import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';

export default function Home() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, booking: null, amount: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Print State
  const [receiptData, setReceiptData] = useState(null);
  
  // Global Lookup States for Printing
  const [categoryLookup, setCategoryLookup] = useState({});
  const [categoryPrices, setCategoryPrices] = useState({});

  // --------------------------------------------------------
  // 1. DATA FETCHING
  // --------------------------------------------------------
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookRes, patRes, testRes, docRes] = await Promise.all([
        api.get('/bookings/all'),
        api.get('/patients'),
        api.get('/tests'),
        api.get('/doctors')
      ]);

      const patientMap = {};
      patRes.data.forEach(p => patientMap[p.patientId] = p);

      const doctorMap = {};
      docRes.data.forEach(d => doctorMap[d.doctorId] = d.name);

      const catLookup = {};
      const catPrices = {};
      
      testRes.data.forEach(master => {
        master.categories?.forEach(cat => {
          catLookup[cat.categoryId] = cat.categoryName;
          catPrices[cat.categoryId] = cat.amount;
        });
      });

      setCategoryLookup(catLookup);
      setCategoryPrices(catPrices);

      const processedBookings = bookRes.data.map(b => {
        const patient = patientMap[b.patientId] || {};
        const doctorName = doctorMap[b.doctorId] || 'Self';
        const total = b.totalAmount || 0;
        const paid = b.advanceAmount || 0;
        const pending = total - paid;
        
        let categoryIds = [];
        if (typeof b.bookingCategory === 'string') {
          categoryIds = JSON.parse(b.bookingCategory);
        } else if (Array.isArray(b.bookingCategory)) {
          categoryIds = b.bookingCategory;
        }

        const testNames = categoryIds.map(id => catLookup[id] || `Unknown (${id})`).join(', ');

        return {
          ...b,
          patientName: patient.name || 'Unknown',
          mobile: patient.phone || 'N/A',
          doctorName,
          testNames,
          pendingAmount: pending
        };
      });

      processedBookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      setBookings(processedBookings);
      setError('');
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError('Failed to load dashboard data. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --------------------------------------------------------
  // 2. FILTERING & SEARCHING
  // --------------------------------------------------------
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    const today = new Date();

    if (filterType !== 'All') {
      result = result.filter(b => {
        const bDate = new Date(b.bookingDate);
        if (filterType === 'Today') {
          return bDate.toDateString() === today.toDateString();
        }
        if (filterType === 'This Week') {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return bDate >= startOfWeek;
        }
        if (filterType === 'This Month') {
          return bDate.getMonth() === today.getMonth() && bDate.getFullYear() === today.getFullYear();
        }
        if (filterType === 'This Year') {
          return bDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.patientName.toLowerCase().includes(query) || 
        b.mobile.includes(query)
      );
    }

    return result;
  }, [bookings, filterType, searchQuery]);

  // --------------------------------------------------------
  // 3. PAYMENT HANDLING
  // --------------------------------------------------------
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const payload = {
        bId: paymentModal.booking.bookingId,
        payAmount: parseFloat(paymentModal.amount)
      };
      
      await api.put('/bookings/update-payment', payload);
      
      setMessage(`Payment of ₹${payload.payAmount} successful!`);
      setPaymentModal({ isOpen: false, booking: null, amount: '' });
      fetchDashboardData();
      
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error("Payment Error:", err);
      alert(err.response?.data || "Payment failed.");
    }
    setPaymentLoading(false);
  };

  // --------------------------------------------------------
  // 4. PRINTING LOGIC
  // --------------------------------------------------------
  const handlePrint = (booking) => {
    setReceiptData(booking);
  };

  useEffect(() => {
    let timer;
    const handleAfterPrint = () => {
      setReceiptData(null);
    };

    if (receiptData) {
      window.addEventListener('afterprint', handleAfterPrint);
      timer = setTimeout(() => {
        window.print();
      }, 100);
    }

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      if (timer) clearTimeout(timer);
    };
  }, [receiptData]);

  const formatINR = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  // --------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------
  return (
    <>
      <style>{`
        @media screen {
          .print-section {
            display: none !important;
          }
        }

        @media print {
          @page {
            size: 21cm 14cm landscape;
            margin: 0; 
          }
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .print-section, .print-section * { visibility: visible; }
          
          .print-section {
            position: absolute;
            left: 0; top: 0;
            width: 21cm;
            height: 14cm;
            padding: 10mm;
            box-sizing: border-box;
            font-size: 11px;
            font-family: 'Arial', sans-serif;
            color: #000;
            background: #fff;
            display: flex;
            flex-direction: column;
          }
          
          /* Minimal Header Section */
          .print-minimal-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 5px; border-bottom: 1.5px solid #000; margin-bottom: 8px; }
          .print-lab-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .print-lab-contact { text-align: right; font-size: 11px; }
          .print-lab-contact div { margin-top: 2px; }

          .print-hr { border: none; border-top: 1.5px solid #000; margin: 6px 0; }
          
          /* Patient Info Section */
          .print-info-row { display: flex; justify-content: space-between; margin: 4px 0; }
          .print-info-col { display: flex; flex-direction: column; gap: 4px; }
          .print-info-text { font-size: 12px; }
          
          /* Body Section (70% / 30% Split) */
          .print-body { display: flex; flex: 1; margin-top: 8px; }
          .print-left { width: 70%; padding-right: 15px; }
          .print-right { width: 30%; padding-left: 15px; border-left: 1.5px solid #000; display: flex; flex-direction: column; }
          
          /* Table Styles */
          .print-table { width: 100%; border-collapse: collapse; }
          .print-table th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 4px; text-align: left; font-weight: bold; }
          .print-table td { border-bottom: 1px dashed #aaa; padding: 6px 4px; text-align: left; }
          
          /* Summary Styles */
          .summary-box { display: flex; flex-direction: column; gap: 10px; margin-top: 25px; }
          .summary-row { display: flex; justify-content: space-between; font-size: 13px; }
          .summary-row.bold { font-weight: bold; font-size: 14px; }
          
          /* Footer Section */
          .print-footer { margin-top: auto; }
          .signature-row { display: flex; justify-content: space-between; padding-top: 30px; }
          .signature-box { text-align: center; font-size: 12px; }
        }
      `}</style>

      {/* DASHBOARD VIEW (Hidden during print) */}
      <div className="card no-print" style={{ minHeight: '80vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: 'var(--primary-color)' }}>Booking Dashboard</h2>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Search Name or Mobile..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.input}
            />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.input}
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
        </div>

        {message && <div style={styles.successAlert}>{message}</div>}

        {loading ? (
          <div style={styles.centerText}>Loading dashboard data...</div>
        ) : error ? (
          <div style={styles.errorAlert}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Tests</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Paid</th>
                  <th style={styles.th}>Pending</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan="10" style={styles.centerText}>No bookings found.</td></tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.bookingId} style={styles.tr}>
                      <td style={styles.td}>{formatDate(b.bookingDate)}</td>
                      <td style={styles.td}>#{b.bookingId}</td>
                      <td style={styles.td}><b>{b.patientName}</b></td>
                      <td style={styles.td}>{b.mobile}</td>
                      <td style={styles.td}><small>{b.testNames}</small></td>
                      <td style={styles.td}>{formatINR(b.totalAmount)}</td>
                      <td style={styles.td} style={{color: 'var(--success)'}}>{formatINR(b.advanceAmount)}</td>
                      <td style={styles.td} style={{color: b.pendingAmount > 0 ? 'var(--danger)' : 'inherit'}}>
                        {formatINR(b.pendingAmount)}
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, ...styles[`status${b.paymentStatus}`]}}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {b.pendingAmount > 0 && (
                            <button 
                              style={{...styles.btn, background: 'var(--primary-color)'}}
                              onClick={() => setPaymentModal({ isOpen: true, booking: b, amount: b.pendingAmount })}
                            >
                              Pay
                            </button>
                          )}
                          <button 
                            style={{...styles.btn, background: '#475569'}}
                            onClick={() => handlePrint(b)}
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAYMENT MODAL (Hidden during print) */}
      {paymentModal.isOpen && (
        <div style={styles.modalOverlay} className="no-print">
          <div style={styles.modalBox}>
            <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>Process Payment</h3>
            <div style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
              <p><b>Patient:</b> {paymentModal.booking.patientName}</p>
              <p><b>Booking ID:</b> #{paymentModal.booking.bookingId}</p>
              <hr style={{ margin: '10px 0', borderColor: '#e2e8f0' }} />
              <p><b>Total Amount:</b> {formatINR(paymentModal.booking.totalAmount)}</p>
              <p><b>Already Paid:</b> {formatINR(paymentModal.booking.advanceAmount)}</p>
              <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                Pending Amount: {formatINR(paymentModal.booking.pendingAmount)}
              </p>
            </div>
            
            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Enter Payment Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  max={paymentModal.booking.pendingAmount}
                  required
                  value={paymentModal.amount}
                  onChange={e => setPaymentModal({...paymentModal, amount: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" style={{...styles.btn, background: '#94a3b8'}} onClick={() => setPaymentModal({isOpen: false})}>Cancel</button>
                <button type="submit" style={{...styles.btn, background: 'var(--success)'}} disabled={paymentLoading}>
                  {paymentLoading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PRINT SECTION (Only rendered in DOM for printing, hidden by CSS on screen) */}
      {receiptData && (() => {
        const bookingCategories = 
          typeof receiptData.bookingCategory === 'string'
            ? JSON.parse(receiptData.bookingCategory)
            : receiptData.bookingCategory || [];

        return (
          <div className="print-section">
            
            {/* 1. Minimal Header Section */}
            <div className="print-minimal-header">
              <div className="print-lab-name">HealthStack Diagnostics</div>
              <div className="print-lab-contact">
                <div>Tihidi, Bhadrak, Odisha - 756130</div>
                <div>Mob: +91-9876543210</div>
              </div>
            </div>

            {/* 2. Patient Information Section */}
            <div className="print-info-row">
              <div className="print-info-col">
                <div className="print-info-text"><b>Patient Name:</b> {receiptData.patientName}</div>
                <div className="print-info-text"><b>Receipt No:</b> #{receiptData.bookingId}</div>
              </div>
              <div className="print-info-col" style={{ textAlign: 'right' }}>
                <div className="print-info-text"><b>Date & Time:</b> {formatDate(receiptData.bookingDate)}</div>
                <div className="print-info-text"><b>Ref. Doctor:</b> Dr. {receiptData.doctorName}</div>
              </div>
            </div>
            <hr className="print-hr" />

            {/* 3. Test Details Section (Two Columns) */}
            <div className="print-body">
              {/* Left Side (70%) */}
              <div className="print-left">
                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Sl No</th>
                      <th style={{ width: '60%' }}>TEST NAME</th>
                      <th style={{ width: '30%', textAlign: 'right' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingCategories.map((catId, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{categoryLookup[catId] || 'Test Not Found'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {categoryPrices[catId] !== undefined ? formatINR(categoryPrices[catId]) : '₹0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Side (30%) */}
              <div className="print-right">
                <div className="summary-box">
                  <div className="summary-row">
                    <span>Total:</span>
                    <span>{formatINR(receiptData.totalAmount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Paid:</span>
                    <span>{formatINR(receiptData.advanceAmount)}</span>
                  </div>
                  <hr style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
                  <div className="summary-row bold">
                    <span>Pending:</span>
                    <span>{formatINR(receiptData.pendingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Footer Section */}
            <div className="print-footer">
              <hr className="print-hr" />
              <div className="signature-row">
                <div className="signature-box">
                  <p>_______________________</p>
                  <p>Patient Signature</p>
                </div>
                <div className="signature-box">
                  <p>_______________________</p>
                  <p>Authorized Signature</p>
                </div>
              </div>
            </div>

          </div>
        );
      })()}
    </>
  );
}

// --------------------------------------------------------
// INLINE STYLES (Pure React CSS)
// --------------------------------------------------------
const styles = {
  input: {
    padding: '8px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '0.9rem',
    width: '100%'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    fontSize: '0.9rem'
  },
  thRow: {
    backgroundColor: 'var(--secondary-color)',
    borderBottom: '2px solid var(--border-color)'
  },
  th: {
    padding: '12px 15px',
    textAlign: 'left',
    color: 'var(--text-muted)',
    fontWeight: '600'
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '12px 15px',
    verticalAlign: 'middle'
  },
  btn: {
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  statusPaid: { background: '#dcfce7', color: '#166534' },
  statusPartial: { background: '#fef3c7', color: '#92400e' },
  statusPending: { background: '#fee2e2', color: '#991b1b' },
  centerText: { textAlign: 'center', padding: '20px', color: 'var(--text-muted)' },
  errorAlert: { background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '15px' },
  successAlert: { background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '6px', marginBottom: '15px' },
  
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  modalBox: {
    background: '#fff', padding: '25px', borderRadius: '8px',
    width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
};