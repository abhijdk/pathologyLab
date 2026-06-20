import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export default function Vendors() {
  const [activeTab, setActiveTab] = useState('VENDORS'); // VENDORS, PAYMENTS
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  // --------------------------------------------------------
  // DATA STATES
  // --------------------------------------------------------
  const [vendors, setVendors] = useState([]);
  const [payments, setPayments] = useState([]);

  // --------------------------------------------------------
  // MODAL & FORM STATES
  // --------------------------------------------------------
  const [modal, setModal] = useState({ isOpen: false, type: '', mode: 'add', data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [vendorForm, setVendorForm] = useState({ vendorName: '', vendorMobile: '', vendorEmail: '', balance: 0 });
  const [paymentForm, setPaymentForm] = useState({ paymentDate: new Date().toISOString().split('T')[0], vendorId: '', paidAmount: 0, paymentMode: 'CASH', remarks: '' });

  // --------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorRes, payRes] = await Promise.all([
        api.get('/consumable/inventory/vendors'),
        api.get('/consumable/inventory/payment')
      ]);
      setVendors(vendorRes.data || []);
      setPayments((payRes.data || []).sort((a, b) => b.paymentId - a.paymentId));
    } catch (err) {
      showMessage('Failed to load vendor and payment data.', 'error');
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
      if (type === 'VENDOR') setVendorForm(data);
      if (type === 'PAYMENT') setPaymentForm({ ...data, paymentDate: data.paymentDate, paidAmount: Math.abs(data.paidAmount) }); 
    } else {
      if (type === 'VENDOR') setVendorForm({ vendorName: '', vendorMobile: '', vendorEmail: '', balance: 0 });
      if (type === 'PAYMENT') setPaymentForm({ paymentDate: new Date().toISOString().split('T')[0], vendorId: data?.vendorId || '', paidAmount: 0, paymentMode: 'CASH', remarks: '' });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', mode: 'add', data: null });

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
      const id = isPut ? (modal.data.vendorId || modal.data.paymentId) : '';

      switch (modal.type) {
        case 'VENDOR': endpoint = `/consumable/inventory/vendors${isPut ? `/${id}` : ''}`; payload = vendorForm; break;
        case 'PAYMENT': endpoint = `/consumable/inventory/payment${isPut ? `/${id}` : ''}`; payload = paymentForm; break;
        default: break;
      }

      if (isPut) await api.put(endpoint, payload);
      else await api.post(endpoint, payload);

      showMessage(`${modal.type} ${isPut ? 'updated' : 'added'} successfully!`);
      closeModal();
      fetchData(); // Refresh all data to sync balances
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
      case 'VENDORS': return filterData(vendors, ['vendorName', 'vendorMobile', 'vendorEmail']);
      case 'PAYMENTS': return filterData(payments, ['vendorName', 'paymentMode', 'remarks']);
      default: return [];
    }
  };

  // --------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------
  return (
    <div style={styles.container}>
      
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Vendor Management</h2>
      </div>

      {message.text && (
        <div style={message.type === 'error' ? styles.alertDanger : styles.alertSuccess}>
          {message.text}
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={styles.tabsContainer}>
        {['VENDORS', 'PAYMENTS'].map(tab => (
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
          <button style={styles.btnPrimary} onClick={() => openModal(activeTab.slice(0, -1), 'add')}>
            + Add New {activeTab.slice(0, -1)}
          </button>
        </div>

        {/* TABLES */}
        {loading ? (
          <div style={styles.centerText}>Loading data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              
              {activeTab === 'VENDORS' && (
                <>
                  <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Email</th><th>Balance Due</th><th>Actions</th></tr></thead>
                  <tbody>
                    {getActiveData().map(v => (
                      <tr key={v.vendorId}>
                        <td>#{v.vendorId}</td><td><strong>{v.vendorName}</strong></td><td>{v.vendorMobile}</td><td>{v.vendorEmail || '-'}</td>
                        <td style={{ color: v.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>₹{Number(v.balance).toFixed(2)}</td>
                        <td>
                          <button style={styles.actionBtn} onClick={() => openModal('VENDOR', 'edit', v)}>Edit</button>
                          <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                          <button 
                            style={{ ...styles.actionBtn, color: '#16a34a' }} 
                            onClick={() => openModal('PAYMENT', 'add', { vendorId: v.vendorId })}
                          >
                            Pay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'PAYMENTS' && (
                <>
                  <thead><tr><th>Date</th><th>Vendor</th><th>Mode</th><th>Voucher/Ref</th><th>Paid Amount</th><th>Closing Balance</th></tr></thead>
                  <tbody>
                    {getActiveData().map(p => (
                      <tr key={p.paymentId}>
                        <td>{p.paymentDate}</td><td><strong>{p.vendorName}</strong></td><td>{p.paymentMode}</td><td>{p.paymentAgentVoucher || '-'}</td>
                        <td style={{ color: p.paidAmount < 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                          ₹{Math.abs(p.paidAmount).toFixed(2)} {p.paidAmount < 0 ? '(Paid)' : '(Billed)'}
                        </td>
                        <td>₹{Number(p.closingBalance).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {getActiveData().length === 0 && (
                <tbody><tr><td colSpan="8" style={styles.centerText}>No records found.</td></tr></tbody>
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
              
              {/* VENDOR FORM */}
              {modal.type === 'VENDOR' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Vendor Name *</label>
                    <input required style={styles.input} value={vendorForm.vendorName} onChange={e => setVendorForm({...vendorForm, vendorName: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Mobile</label>
                    <input style={styles.input} value={vendorForm.vendorMobile} onChange={e => setVendorForm({...vendorForm, vendorMobile: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Email</label>
                    <input type="email" style={styles.input} value={vendorForm.vendorEmail} onChange={e => setVendorForm({...vendorForm, vendorEmail: e.target.value})} />
                  </div>
                  {modal.mode === 'add' && (
                    <div style={styles.formGroupFull}>
                      <label>Opening Balance Due (₹)</label>
                      <input type="number" step="0.01" style={styles.input} value={vendorForm.balance} onChange={e => setVendorForm({...vendorForm, balance: Number(e.target.value)})} />
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENT FORM */}
              {modal.type === 'PAYMENT' && (
                <div style={styles.grid}>
                  <div style={styles.formGroupFull}>
                    <label>Vendor *</label>
                    <select required style={styles.input} value={paymentForm.vendorId} onChange={e => setPaymentForm({...paymentForm, vendorId: Number(e.target.value)})}>
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.vendorName} (Due: ₹{v.balance})</option>)}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Date *</label>
                    <input type="date" required style={styles.input} value={paymentForm.paymentDate} onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Amount Paid (₹) *</label>
                    <input type="number" step="0.01" min="0" required style={styles.input} value={paymentForm.paidAmount} onChange={e => setPaymentForm({...paymentForm, paidAmount: Number(e.target.value)})} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Payment Mode *</label>
                    <select required style={styles.input} value={paymentForm.paymentMode} onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}>
                      <option value="CASH">CASH</option>
                      <option value="UPI">UPI</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label>Remarks / Ref No.</label>
                    <input style={styles.input} value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />
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