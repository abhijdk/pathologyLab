import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export default function NonConsumables() {
  const [activeTab, setActiveTab] = useState('ITEMS'); // ITEMS, ENTRIES, MAINTENANCE, DESTROY
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  // --------------------------------------------------------
  // DATA STATES
  // --------------------------------------------------------
  const [items, setItems] = useState([]);
  const [entries, setEntries] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [destroys, setDestroys] = useState([]);
  const [vendors, setVendors] = useState([]); // Kept only for the dropdown

  // --------------------------------------------------------
  // MODAL & FORM STATES
  // --------------------------------------------------------
  const [modal, setModal] = useState({ isOpen: false, type: '', mode: 'add', data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [itemForm, setItemForm] = useState({ 
    date: new Date().toISOString().split('T')[0], itemName: '', itemSerialNumber: '', 
    itemOptional: '', stock: 0, maintenanceNextDate: '', maintenanceDurationMonths: 0 
  });
  
  const [entryForm, setEntryForm] = useState({ 
    entryDate: new Date().toISOString().split('T')[0], itemId: '', vendorId: '', 
    receivedQuantityBox: 1, perBoxQuantity: 1, voucherNumber: '', 
    billAmount: 0, gst: 0, representativeName: '', remarks: '' 
  });

  const [maintenanceForm, setMaintenanceForm] = useState({ 
    date: new Date().toISOString().split('T')[0], niId: '', engineerName: '', 
    presenceOfStaff: '', maintenanceAmount: 0, remarks: '' 
  });

  const [destroyForm, setDestroyForm] = useState({ 
    date: new Date().toISOString().split('T')[0], nciId: '', destroyQuantity: 1, 
    destroyedBy: '', remark: '' 
  });

  // --------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemRes, entryRes, maintRes, destRes, vendorRes] = await Promise.all([
        api.get('/nonconsumable/inventory/items'),
        api.get('/nonconsumable/inventory/entry'),
        api.get('/nonconsumable/inventory/maintenance'),
        api.get('/nonconsumable/inventory/destroy'),
        api.get('/consumable/inventory/vendors') // Fetch vendors purely for the select dropdown
      ]);
      
      setItems(itemRes.data || []);
      setEntries((entryRes.data || []).sort((a, b) => b.inventoryEntryId - a.inventoryEntryId));
      setMaintenances((maintRes.data || []).sort((a, b) => b.mid - a.mid));
      setDestroys((destRes.data || []).sort((a, b) => b.idId - a.idId));
      setVendors(vendorRes.data || []);
    } catch (err) {
      showMessage('Failed to load inventory data.', 'error');
    }
    setLoading(false);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // --------------------------------------------------------
  // MODAL CONTROLS & QUICK ACTIONS
  // --------------------------------------------------------
  const openModal = (type, mode, data = null) => {
    setModal({ isOpen: true, type, mode, data });
    
    if (mode === 'edit' && data) {
      if (type === 'ITEM') {
        setItemForm({
          ...data,
          date: data.date || new Date().toISOString().split('T')[0],
          maintenanceNextDate: data.maintenanceNextDate || ''
        });
      }
    } else {
      if (type === 'ITEM') setItemForm({ date: new Date().toISOString().split('T')[0], itemName: '', itemSerialNumber: '', itemOptional: '', stock: 0, maintenanceNextDate: '', maintenanceDurationMonths: 0 });
      if (type === 'ENTRY') setEntryForm({ entryDate: new Date().toISOString().split('T')[0], itemId: '', vendorId: '', receivedQuantityBox: 1, perBoxQuantity: 1, voucherNumber: '', billAmount: 0, gst: 0, representativeName: '', remarks: '' });
      if (type === 'MAINTENANCE') setMaintenanceForm({ date: new Date().toISOString().split('T')[0], niId: '', engineerName: '', presenceOfStaff: '', maintenanceAmount: 0, remarks: '' });
      if (type === 'DESTROY') setDestroyForm({ date: new Date().toISOString().split('T')[0], nciId: '', destroyQuantity: 1, destroyedBy: '', remark: '' });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', mode: 'add', data: null });

  const handleQuickMaintenance = async (item) => {
    const confirmMessage = `Was the machine '${item.itemName}' maintained?\n\nCurrent Next Maint. Date: ${item.maintenanceNextDate || 'Not Scheduled'}\n\nPress OK to update the maintenance record and advance the date.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const payload = {
          date: new Date().toISOString().split('T')[0],
          niId: item.itemId,
          engineerName: 'Routine Auto-Log',
          presenceOfStaff: 'Yes',
          maintenanceAmount: 0,
          remarks: 'Quick maintenance logged'
        };
        await api.post('/nonconsumable/inventory/maintenance', payload);
        showMessage('Maintenance logged & date updated successfully!');
        fetchData();
      } catch (err) {
        showMessage('Failed to log maintenance.', 'error');
      }
    }
  };

  // --------------------------------------------------------
  // SUBMIT HANDLERS
  // --------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let endpoint = '';
      let payload = null;
      let isPut = modal.mode === 'edit';
      const id = isPut ? modal.data.itemId : '';

      switch (modal.type) {
        case 'ITEM': endpoint = `/nonconsumable/inventory/items${isPut ? `/${id}` : ''}`; payload = itemForm; break;
        case 'ENTRY': endpoint = `/nonconsumable/inventory/entry`; payload = entryForm; break;
        case 'MAINTENANCE': endpoint = `/nonconsumable/inventory/maintenance`; payload = maintenanceForm; break;
        case 'DESTROY': endpoint = `/nonconsumable/inventory/destroy`; payload = destroyForm; break;
        default: break;
      }

      if (isPut) await api.put(endpoint, payload);
      else await api.post(endpoint, payload);

      showMessage(`${modal.type} ${isPut ? 'updated' : 'added'} successfully!`);
      closeModal();
      fetchData();
    } catch (err) {
      showMessage(err.message || err.response?.data?.message || 'Operation failed.', 'error');
    }
    setIsSubmitting(false);
  };

  // --------------------------------------------------------
  // FILTERING
  // --------------------------------------------------------
  const filterData = (dataList, fields) => {
    if (!search) return dataList;
    const q = search.toLowerCase();
    return dataList.filter(item => fields.some(f => String(item[f] || '').toLowerCase().includes(q)));
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'ITEMS': return filterData(items, ['itemName', 'itemSerialNumber', 'itemOptional']);
      case 'ENTRIES': return filterData(entries, ['itemName', 'vendorName', 'voucherNumber']);
      case 'MAINTENANCE': return filterData(maintenances, ['itemName', 'engineerName', 'serialNumber']);
      case 'DESTROY': return filterData(destroys, ['itemName', 'destroyedBy', 'remark']);
      default: return [];
    }
  };

  // --------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------
  return (
    <div style={styles.container}>
      
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Non-Consumables (Assets)</h2>
      </div>

      {message.text && (
        <div style={message.type === 'error' ? styles.alertDanger : styles.alertSuccess}>
          {message.text}
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={styles.tabsContainer}>
        {['ITEMS', 'ENTRIES', 'MAINTENANCE', 'DESTROY'].map(tab => (
          <button 
            key={tab} 
            style={activeTab === tab ? styles.activeTab : styles.tab}
            onClick={() => { setActiveTab(tab); setSearch(''); }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '20px', background: '#fff', borderRadius: '8px' }}>
        
        {/* TOOLBAR */}
        <div style={styles.toolbar}>
          <input 
            style={styles.searchInput} 
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button style={styles.btnPrimary} onClick={() => {
            const typeMap = {
              'ITEMS': 'ITEM',
              'ENTRIES': 'ENTRY',
              'MAINTENANCE': 'MAINTENANCE',
              'DESTROY': 'DESTROY'
            };
            openModal(typeMap[activeTab], 'add');
          }}>
            + Add New {activeTab === 'ENTRIES' ? 'Entry' : activeTab.slice(0, activeTab.endsWith('S') ? -1 : undefined)}
          </button>
        </div>

        {/* TABLES */}
        {loading ? (
          <div style={styles.centerText}>Loading data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              
              {activeTab === 'ITEMS' && (
                <>
                  <thead><tr><th>ID</th><th>Asset Name</th><th>Serial No.</th><th>Units</th><th>Stock</th><th>Next Maint. Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {getActiveData().map(i => (
                      <tr key={i.itemId}>
                        <td>#{i.itemId}</td>
                        <td><strong>{i.itemName}</strong></td>
                        <td>{i.itemSerialNumber || '-'}</td>
                        <td>pcs</td>
                        <td style={{ color: i.stock < 1 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{i.stock}</td>
                        <td style={{ color: (i.maintenanceNextDate && new Date(i.maintenanceNextDate) < new Date()) ? '#dc2626' : 'inherit' }}>
                          {i.maintenanceNextDate || 'Not Scheduled'}
                        </td>
                        <td>
                          <button style={styles.actionBtn} onClick={() => openModal('ITEM', 'edit', i)}>Edit</button>
                          <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                          <button style={{ ...styles.actionBtn, color: '#f59e0b' }} onClick={() => handleQuickMaintenance(i)}>Maintenance</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'ENTRIES' && (
                <>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Voucher</th>
                      <th>Vendor</th>
                      <th>Item</th>
                      <th>Open Bal</th>
                      <th>Qty (Total)</th>
                      <th>Close Bal</th>
                      <th>Cost/Unit</th>
                      <th>GST</th>
                      <th>Bill Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getActiveData().map(e => (
                      <tr key={e.inventoryEntryId}>
                        <td>{e.entryDate}</td>
                        <td>{e.voucherNumber}</td>
                        <td>{e.vendorName}</td>
                        <td><strong>{e.itemName}</strong></td>
                        <td>{e.openingBalance || 0}</td>
                        <td>{e.totalQuantityReceived}</td>
                        <td style={{ fontWeight: 'bold' }}>{e.closingBalance || 0}</td>
                        <td>₹{Number(e.perKitOrMlCost || 0).toFixed(2)}</td>
                        <td>₹{Number(e.gst || 0).toFixed(2)}</td>
                        <td style={{ color: '#dc2626', fontWeight: 'bold' }}>₹{Number(e.billAmount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'MAINTENANCE' && (
                <>
                  <thead><tr><th>Date</th><th>Item</th><th>Serial No.</th><th>Engineer</th><th>Staff Present</th><th>Amount</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {getActiveData().map(m => (
                      <tr key={m.mid}>
                        <td>{m.date}</td><td><strong>{m.itemName}</strong></td><td>{m.serialNumber}</td>
                        <td>{m.engineerName}</td><td>{m.presenceOfStaff}</td>
                        <td style={{ fontWeight: 'bold' }}>₹{Number(m.maintenanceAmount).toFixed(2)}</td>
                        <td>{m.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'DESTROY' && (
                <>
                  <thead><tr><th>Date</th><th>Item</th><th>Qty Scrapped</th><th>Stock After</th><th>Scrapped By</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {getActiveData().map(d => (
                      <tr key={d.idId}>
                        <td>{d.date}</td><td><strong>{d.itemName}</strong></td>
                        <td style={{ color: '#dc2626', fontWeight: 'bold' }}>-{d.destroyQuantity}</td>
                        <td>{d.closingBalance}</td><td>{d.destroyedBy}</td><td>{d.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {getActiveData().length === 0 && (
                <tbody><tr><td colSpan="10" style={styles.centerText}>No records found.</td></tr></tbody>
              )}
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODALS
      ======================================================== */}
      {modal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {modal.mode === 'edit' ? 'Edit' : 'Add'} {modal.type}
              </h3>
              <button style={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              
              {/* ITEM FORM */}
              {modal.type === 'ITEM' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Asset Name *</label>
                    <input required style={styles.input} value={itemForm.itemName} onChange={e => setItemForm({...itemForm, itemName: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Serial Number</label>
                    <input style={styles.input} value={itemForm.itemSerialNumber} onChange={e => setItemForm({...itemForm, itemSerialNumber: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Brand / Specs (Optional)</label>
                    <input style={styles.input} value={itemForm.itemOptional} onChange={e => setItemForm({...itemForm, itemOptional: e.target.value})} />
                  </div>
                  {modal.mode === 'add' && (
                    <div style={styles.formGroup}>
                      <label>Opening Stock</label>
                      <input type="number" min="0" style={styles.input} value={itemForm.stock} onChange={e => setItemForm({...itemForm, stock: Number(e.target.value)})} />
                    </div>
                  )}
                  <div style={styles.formGroup}>
                    <label>Setup / Registration Date</label>
                    <input type="date" required style={styles.input} value={itemForm.date} onChange={e => setItemForm({...itemForm, date: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Maintenance Interval (Months)</label>
                    <input type="number" min="0" style={styles.input} value={itemForm.maintenanceDurationMonths} onChange={e => setItemForm({...itemForm, maintenanceDurationMonths: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Next Maintenance Date</label>
                    <input type="date" style={styles.input} value={itemForm.maintenanceNextDate} onChange={e => setItemForm({...itemForm, maintenanceNextDate: e.target.value})} />
                  </div>
                </div>
              )}

              {/* ENTRY FORM */}
              {modal.type === 'ENTRY' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Asset Item *</label>
                    <select required style={styles.input} value={entryForm.itemId} onChange={e => setEntryForm({...entryForm, itemId: Number(e.target.value)})}>
                      <option value="">-- Select Item --</option>
                      {items.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroupFull}>
                    <label>Vendor *</label>
                    <select required style={styles.input} value={entryForm.vendorId} onChange={e => setEntryForm({...entryForm, vendorId: Number(e.target.value)})}>
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Entry Date *</label>
                    <input type="date" required style={styles.input} value={entryForm.entryDate} onChange={e => setEntryForm({...entryForm, entryDate: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Voucher / Bill No.</label>
                    <input style={styles.input} value={entryForm.voucherNumber} onChange={e => setEntryForm({...entryForm, voucherNumber: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Received Qty (Boxes/Units) *</label>
                    <input type="number" min="1" required style={styles.input} value={entryForm.receivedQuantityBox} onChange={e => setEntryForm({...entryForm, receivedQuantityBox: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Pieces Per Box/Unit *</label>
                    <input type="number" min="1" required style={styles.input} value={entryForm.perBoxQuantity} onChange={e => setEntryForm({...entryForm, perBoxQuantity: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Total Bill Amount (₹) *</label>
                    <input type="number" step="0.01" required style={styles.input} value={entryForm.billAmount} onChange={e => setEntryForm({...entryForm, billAmount: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>GST Amount (₹)</label>
                    <input type="number" step="0.01" style={styles.input} value={entryForm.gst} onChange={e => setEntryForm({...entryForm, gst: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Representative Name</label>
                    <input style={styles.input} value={entryForm.representativeName} onChange={e => setEntryForm({...entryForm, representativeName: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Remarks</label>
                    <input style={styles.input} value={entryForm.remarks} onChange={e => setEntryForm({...entryForm, remarks: e.target.value})} />
                  </div>
                </div>
              )}

              {/* MAINTENANCE FORM */}
              {modal.type === 'MAINTENANCE' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Asset Item *</label>
                    <select required style={styles.input} value={maintenanceForm.niId} onChange={e => setMaintenanceForm({...maintenanceForm, niId: Number(e.target.value)})}>
                      <option value="">-- Select Item --</option>
                      {items.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName} (SN: {i.itemSerialNumber})</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Maintenance Date *</label>
                    <input type="date" required style={styles.input} value={maintenanceForm.date} onChange={e => setMaintenanceForm({...maintenanceForm, date: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Engineer Name</label>
                    <input style={styles.input} value={maintenanceForm.engineerName} onChange={e => setMaintenanceForm({...maintenanceForm, engineerName: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Staff Present</label>
                    <input style={styles.input} value={maintenanceForm.presenceOfStaff} onChange={e => setMaintenanceForm({...maintenanceForm, presenceOfStaff: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Cost / Amount (₹)</label>
                    <input type="number" step="0.01" style={styles.input} value={maintenanceForm.maintenanceAmount} onChange={e => setMaintenanceForm({...maintenanceForm, maintenanceAmount: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroupFull}>
                    <label>Service Remarks / Parts Replaced</label>
                    <input style={styles.input} value={maintenanceForm.remarks} onChange={e => setMaintenanceForm({...maintenanceForm, remarks: e.target.value})} />
                  </div>
                </div>
              )}

              {/* DESTROY / SCRAP FORM */}
              {modal.type === 'DESTROY' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Asset Item *</label>
                    <select required style={styles.input} value={destroyForm.nciId} onChange={e => setDestroyForm({...destroyForm, nciId: Number(e.target.value)})}>
                      <option value="">-- Select Item --</option>
                      {items.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName} (Stock: {i.stock})</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Discard Date *</label>
                    <input type="date" required style={styles.input} value={destroyForm.date} onChange={e => setDestroyForm({...destroyForm, date: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Quantity Scrapped *</label>
                    <input type="number" min="1" required style={styles.input} value={destroyForm.destroyQuantity} onChange={e => setDestroyForm({...destroyForm, destroyQuantity: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Scrapped / Authorized By</label>
                    <input style={styles.input} value={destroyForm.destroyedBy} onChange={e => setDestroyForm({...destroyForm, destroyedBy: e.target.value})} />
                  </div>
                  <div style={styles.formGroupFull}>
                    <label>Reason / Remarks</label>
                    <input style={styles.input} value={destroyForm.remark} onChange={e => setDestroyForm({...destroyForm, remark: e.target.value})} />
                  </div>
                </div>
              )}

              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnOutline} onClick={closeModal}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = {
  container: { fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: '20px' },
  tabsContainer: { display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' },
  tab: { padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontWeight: '500', color: '#64748b' },
  activeTab: { padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: '2px solid #0284c7', cursor: 'pointer', fontWeight: 'bold', color: '#0284c7' },
  toolbar: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' },
  searchInput: { padding: '10px 15px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '300px', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' },
  centerText: { textAlign: 'center', padding: '30px', color: '#64748b' },
  actionBtn: { background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: '600' },
  btnPrimary: { background: '#0284c7', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  btnOutline: { background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' },
  alertSuccess: { padding: '12px 20px', background: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '20px' },
  alertDanger: { padding: '12px 20px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  formGroupFull: { display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1 / -1' },
  input: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', width: '100%', boxSizing: 'border-box' }
};