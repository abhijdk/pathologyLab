import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export default function Consumables() {
  const [activeTab, setActiveTab] = useState('ITEMS'); // ITEMS, PURCHASES, CONSUMPTION
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  // --------------------------------------------------------
  // DATA STATES
  // --------------------------------------------------------
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]); // Kept only for the dropdown
  const [purchases, setPurchases] = useState([]);
  const [consumptions, setConsumptions] = useState([]);

  // --------------------------------------------------------
  // MODAL & FORM STATES
  // --------------------------------------------------------
  const [modal, setModal] = useState({ isOpen: false, type: '', mode: 'add', data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [itemForm, setItemForm] = useState({ itemName: '', stock: 0, suffix: 'pcs' });
  const [consumeForm, setConsumeForm] = useState({ consumptionDate: new Date().toISOString().split('T')[0], itemId: '', usedQuantity: 1, usedBy: '', remarks: '' });
  
  // Complex Purchase Form (Supports Batch Add & Single Edit)
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: '', entryDate: new Date().toISOString().split('T')[0], voucherNumber: '', 
    billAmount: 0, gst: 0, representativeName: '', remarks: '',
    items: [{ itemId: '', receivedQuantityBox: 1, perBoxQuantity: 1, itemAmount: 0 }]
  });

  // --------------------------------------------------------
  // AUTO-CALCULATE TOTAL BILL AMOUNT
  // --------------------------------------------------------
  useEffect(() => {
    if (modal.type === 'PURCHASE') {
      const totalAmount = purchaseForm.items.reduce((sum, item) => {
        return sum + (Number(item.itemAmount) || 0);
      }, 0);
      
      if (purchaseForm.billAmount !== totalAmount) {
        setPurchaseForm(prev => ({
          ...prev,
          billAmount: totalAmount
        }));
      }
    }
  }, [purchaseForm.items, modal.type]);

  // --------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemRes, vendorRes, purchRes, consRes] = await Promise.all([
        api.get('/consumable/inventory/items'),
        api.get('/consumable/inventory/vendors'), // Fetch vendors purely for the select dropdown
        api.get('/consumable/inventory/entry'),
        api.get('/consumable/inventory/consume')
      ]);
      setItems(itemRes.data || []);
      setVendors(vendorRes.data || []);
      
      setPurchases((purchRes.data || []).sort((a, b) => b.entryId - a.entryId));
      setConsumptions((consRes.data || []).sort((a, b) => b.consumptionId - a.consumptionId));
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
  // MODAL CONTROLS
  // --------------------------------------------------------
  const openModal = (type, mode, data = null) => {
    setModal({ isOpen: true, type, mode, data });
    
    if (mode === 'edit' && data) {
      if (type === 'ITEM') setItemForm(data);
      if (type === 'CONSUME') setConsumeForm({ ...data, consumptionDate: data.consumptionDate });
      if (type === 'PURCHASE') {
        setPurchaseForm({
          vendorId: data.vendorId, entryDate: data.entryDate, voucherNumber: data.voucherNumber,
          billAmount: data.billAmount, gst: data.gst || 0, representativeName: data.representativeName || '', remarks: data.remarks || '',
          items: [{ itemId: data.itemId, receivedQuantityBox: data.receivedQuantityBox, perBoxQuantity: data.perBoxQuantity, itemAmount: data.billAmount }]
        });
      }
    } else {
      if (type === 'ITEM') setItemForm({ itemName: '', stock: 0, suffix: 'pcs' });
      if (type === 'CONSUME') setConsumeForm({ consumptionDate: new Date().toISOString().split('T')[0], itemId: '', usedQuantity: 1, usedBy: '', remarks: '' });
      if (type === 'PURCHASE') setPurchaseForm({
        vendorId: '', entryDate: new Date().toISOString().split('T')[0], voucherNumber: '', billAmount: 0, gst: 0, representativeName: '', remarks: '',
        items: [{ itemId: '', receivedQuantityBox: 1, perBoxQuantity: 1, itemAmount: 0 }]
      });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', mode: 'add', data: null });

  // --------------------------------------------------------
  // PURCHASE FORM DYNAMIC ROWS
  // --------------------------------------------------------
  const addPurchaseRow = () => {
    setPurchaseForm(prev => ({ ...prev, items: [...prev.items, { itemId: '', receivedQuantityBox: 1, perBoxQuantity: 1, itemAmount: 0 }] }));
  };
  const removePurchaseRow = (index) => {
    setPurchaseForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };
  const updatePurchaseRow = (index, field, value) => {
    const newItems = [...purchaseForm.items];
    newItems[index][field] = value;
    setPurchaseForm(prev => ({ ...prev, items: newItems }));
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
      const id = isPut ? modal.data.id || modal.data.itemId || modal.data.entryId || modal.data.consumptionId : '';

      switch (modal.type) {
        case 'ITEM': endpoint = `/consumable/inventory/items${isPut ? `/${id}` : ''}`; payload = itemForm; break;
        case 'CONSUME': endpoint = `/consumable/inventory/consume${isPut ? `/${id}` : ''}`; payload = consumeForm; break;
        case 'PURCHASE': 
          endpoint = `/consumable/inventory/entry${isPut ? `/${id}` : '/batch'}`;
          payload = purchaseForm;
          if (payload.items.some(i => !i.itemId)) throw new Error("Please select an item for all rows.");
          if (!payload.vendorId) throw new Error("Please select a vendor.");
          break;
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
      case 'ITEMS': return filterData(items, ['itemName', 'suffix']);
      case 'PURCHASES': return filterData(purchases, ['itemName', 'vendorName', 'voucherNumber']);
      case 'CONSUMPTION': return filterData(consumptions, ['itemName', 'usedBy', 'remarks']);
      default: return [];
    }
  };

  // --------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------
  return (
    <div style={styles.container}>
      
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Consumables Inventory</h2>
      </div>

      {message.text && (
        <div style={message.type === 'error' ? styles.alertDanger : styles.alertSuccess}>
          {message.text}
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={styles.tabsContainer}>
        {['ITEMS', 'PURCHASES', 'CONSUMPTION'].map(tab => (
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
              'PURCHASES': 'PURCHASE',
              'CONSUMPTION': 'CONSUME',
            };
            openModal(typeMap[activeTab], 'add');
          }}>
            + Add New {activeTab === 'CONSUMPTION' ? 'Record' : activeTab.slice(0, -1)}
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
                  <thead><tr><th>ID</th><th>Item Name</th><th>Current Stock</th><th>Unit</th><th>Actions</th></tr></thead>
                  <tbody>
                    {getActiveData().map(i => (
                      <tr key={i.itemId}>
                        <td>#{i.itemId}</td><td><strong>{i.itemName}</strong></td>
                        <td style={{ color: i.stock < 10 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{i.stock}</td>
                        <td>{i.suffix}</td>
                        <td><button style={styles.actionBtn} onClick={() => openModal('ITEM', 'edit', i)}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'PURCHASES' && (
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
                    {getActiveData().map(p => (
                      <tr key={p.entryId || p.inventoryEntryId}>
                        <td>{p.entryDate}</td>
                        <td>{p.voucherNumber}</td>
                        <td>{p.vendorName}</td>
                        <td><strong>{p.itemName}</strong></td>
                        <td>{p.openingBalance || 0}</td>
                        <td>{p.totalQuantityReceived} ({p.receivedQuantityBox} box)</td>
                        <td style={{ fontWeight: 'bold' }}>{p.closingBalance || 0}</td>
                        <td>₹{Number(p.perKitOrMlCost || 0).toFixed(2)}</td>
                        <td>₹{Number(p.gst || 0).toFixed(2)}</td>
                        <td style={{ color: '#dc2626', fontWeight: 'bold' }}>₹{Number(p.billAmount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'CONSUMPTION' && (
                <>
                  <thead><tr><th>Date</th><th>Item</th><th>Qty Used</th><th>Stock After</th><th>Used By</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {getActiveData().map(c => (
                      <tr key={c.consumptionId}>
                        <td>{c.consumptionDate}</td><td><strong>{c.itemName}</strong></td>
                        <td style={{ color: '#dc2626', fontWeight: 'bold' }}>-{c.usedQuantity}</td>
                        <td>{c.closingStock}</td><td>{c.usedBy}</td><td>{c.remarks}</td>
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
                    <label>Item Name *</label>
                    <input required style={styles.input} value={itemForm.itemName} onChange={e => setItemForm({...itemForm, itemName: e.target.value})} />
                  </div>
                  {modal.mode === 'add' && (
                    <div style={styles.formGroup}>
                      <label>Opening Stock</label>
                      <input type="number" min="0" style={styles.input} value={itemForm.stock} onChange={e => setItemForm({...itemForm, stock: Number(e.target.value)})} />
                    </div>
                  )}
                  <div style={styles.formGroup}>
                    <label>Unit / Suffix</label>
                    <input placeholder="e.g. pcs, ml, box" style={styles.input} value={itemForm.suffix} onChange={e => setItemForm({...itemForm, suffix: e.target.value})} />
                  </div>
                </div>
              )}

              {/* CONSUMPTION FORM */}
              {modal.type === 'CONSUME' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Item *</label>
                    <select required style={styles.input} value={consumeForm.itemId} onChange={e => setConsumeForm({...consumeForm, itemId: Number(e.target.value)})}>
                      <option value="">-- Select Item --</option>
                      {items.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName} (Stock: {i.stock} {i.suffix})</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Date *</label>
                    <input type="date" required style={styles.input} value={consumeForm.consumptionDate} onChange={e => setConsumeForm({...consumeForm, consumptionDate: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Quantity Used *</label>
                    <input type="number" min="1" required style={styles.input} value={consumeForm.usedQuantity} onChange={e => setConsumeForm({...consumeForm, usedQuantity: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Used By (Person/Dept)</label>
                    <input style={styles.input} value={consumeForm.usedBy} onChange={e => setConsumeForm({...consumeForm, usedBy: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Remarks</label>
                    <input style={styles.input} value={consumeForm.remarks} onChange={e => setConsumeForm({...consumeForm, remarks: e.target.value})} />
                  </div>
                </div>
              )}

              {/* PURCHASE (BATCH) FORM */}
              {modal.type === 'PURCHASE' && (
                <div>
                  <div style={styles.grid}>
                    <div style={styles.formGroup}>
                      <label>Vendor *</label>
                      <select required style={styles.input} value={purchaseForm.vendorId} onChange={e => setPurchaseForm({...purchaseForm, vendorId: Number(e.target.value)})}>
                        <option value="">-- Select Vendor --</option>
                        {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label>Entry Date *</label>
                      <input type="date" required style={styles.input} value={purchaseForm.entryDate} onChange={e => setPurchaseForm({...purchaseForm, entryDate: e.target.value})} />
                    </div>
                    <div style={styles.formGroup}>
                      <label>Voucher / Bill No.</label>
                      <input style={styles.input} value={purchaseForm.voucherNumber} onChange={e => setPurchaseForm({...purchaseForm, voucherNumber: e.target.value})} />
                    </div>
                    <div style={styles.formGroup}>
                      <label>Total Bill Amount (₹) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        style={{...styles.input, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed'}} 
                        value={purchaseForm.billAmount} 
                        readOnly
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label>Total GST (₹)</label>
                      <input type="number" step="0.01" style={styles.input} value={purchaseForm.gst} onChange={e => setPurchaseForm({...purchaseForm, gst: Number(e.target.value)})} />
                    </div>
                    <div style={styles.formGroup}>
                      <label>Representative</label>
                      <input style={styles.input} value={purchaseForm.representativeName} onChange={e => setPurchaseForm({...purchaseForm, representativeName: e.target.value})} />
                    </div>
                  </div>

                  <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Items Purchased</h4>
                    {modal.mode === 'add' && (
                      <button type="button" style={{...styles.btnPrimary, background: '#10b981', padding: '5px 10px'}} onClick={addPurchaseRow}>
                        + Add Item Row
                      </button>
                    )}
                  </div>

                  {purchaseForm.items.map((row, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '10px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '0.8rem', display: 'block' }}>Item *</label>
                        <select required style={styles.input} value={row.itemId} onChange={e => updatePurchaseRow(index, 'itemId', Number(e.target.value))}>
                          <option value="">Select...</option>
                          {items.map(i => <option key={i.itemId} value={i.itemId}>{i.itemName}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', display: 'block' }}>Rcvd Boxes *</label>
                        <input type="number" min="1" required style={styles.input} value={row.receivedQuantityBox} onChange={e => updatePurchaseRow(index, 'receivedQuantityBox', Number(e.target.value))} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', display: 'block' }}>Qty / Box *</label>
                        <input type="number" min="1" required style={styles.input} value={row.perBoxQuantity} onChange={e => updatePurchaseRow(index, 'perBoxQuantity', Number(e.target.value))} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', display: 'block' }}>Amount (₹)</label>
                        <input type="number" step="0.01" style={styles.input} value={row.itemAmount} onChange={e => updatePurchaseRow(index, 'itemAmount', Number(e.target.value))} />
                      </div>
                      {modal.mode === 'add' && purchaseForm.items.length > 1 && (
                        <button type="button" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer' }} onClick={() => removePurchaseRow(index)}>
                          X
                        </button>
                      )}
                    </div>
                  ))}
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