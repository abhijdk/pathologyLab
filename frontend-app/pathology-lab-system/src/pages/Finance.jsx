import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

// --- Utility Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Smart Date Parser to handle Spring Boot LocalDate arrays (e.g., [2026, 6, 13]) or Strings
const parseDate = (val) => {
  if (!val) return new Date();
  if (Array.isArray(val)) {
    // Spring Boot array format: [year, month, day] -> JS Date expects month index 0-11
    return new Date(val[0], val[1] - 1, val[2]);
  }
  return new Date(val);
};

const formatDate = (val) => {
  if (!val) return '-';
  const d = parseDate(val);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Finance() {
  const [activeTab, setActiveTab] = useState('PATIENT'); // PATIENT or INVENTORY
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- States for Patient Finance ---
  const [patientBookings, setPatientBookings] = useState([]);
  const [patientMetrics, setPatientMetrics] = useState({ totalBusiness: 0, totalCollected: 0, totalPending: 0 });
  const [patientPage, setPatientPage] = useState(1);

  // --- States for Inventory Finance ---
  const [inventoryExpenses, setInventoryExpenses] = useState([]); // Purchases + Maintenance
  const [inventoryPayments, setInventoryPayments] = useState([]); // Payments to vendors
  const [inventoryMetrics, setInventoryMetrics] = useState({ totalBilled: 0, totalPaid: 0, totalPending: 0 });
  const [invExpPage, setInvExpPage] = useState(1);
  const [invPayPage, setInvPayPage] = useState(1);

  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        bookingsRes,
        patientsRes,
        consRes,
        nonConsRes,
        maintRes,
        paymentsRes
      ] = await Promise.all([
        api.get('/bookings/all').catch(() => ({ data: [] })),
        api.get('/patients').catch(() => ({ data: [] })),
        api.get('/consumable/inventory/entry').catch(() => ({ data: [] })),
        api.get('/nonconsumable/inventory/entry').catch(() => ({ data: [] })),
        api.get('/nonconsumable/inventory/maintenance').catch(() => ({ data: [] })),
        api.get('/consumable/inventory/payment').catch(() => ({ data: [] }))
      ]);

      processPatientFinance(bookingsRes.data || [], patientsRes.data || []);
      processInventoryFinance(
        consRes.data || [],
        nonConsRes.data || [],
        maintRes.data || [],
        paymentsRes.data || []
      );

    } catch (err) {
      console.error("Finance fetch error:", err);
      setError("Failed to load financial records from the server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PROCESS PATIENT FINANCE
  // ==========================================
  const processPatientFinance = (bookingsData, patientsData) => {
    const patientMap = {};
    patientsData.forEach(p => {
      if (p.patientId) patientMap[p.patientId] = p.name || p.patientName || 'Unknown';
    });

    let totalBiz = 0; let totalColl = 0; let totalPend = 0;

    const processedBookings = bookingsData.map(b => {
      const id = b.bookingId || b.id || b.bId || '-';
      const rawDate = b.bookingDate || b.createdAt;
      const patientName = patientMap[b.patientId] || b.patientName || (b.patient ? b.patient.name : 'Unknown');
      
      const total = Number(b.totalAmount || b.netAmount || 0);
      const paid = Number(b.advanceAmount || b.paidAmount || b.payAmount || 0);
      let pending = total - paid;
      if (pending < 0) pending = 0; 

      totalBiz += total;
      totalColl += paid;
      totalPend += pending;

      const status = pending === 0 && total > 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending');

      return { id, rawDate, parsedDate: parseDate(rawDate), patientName, total, paid, pending, status };
    });

    // ONLY SHOW BOOKINGS WITH PENDING BALANCE > 0
    const pendingOnlyBookings = processedBookings.filter(b => b.pending > 0);

    // Sort newest first
    pendingOnlyBookings.sort((a, b) => b.parsedDate - a.parsedDate);

    setPatientBookings(pendingOnlyBookings);
    setPatientMetrics({ totalBusiness: totalBiz, totalCollected: totalColl, totalPending: totalPend });
  };

  // ==========================================
  // PROCESS INVENTORY FINANCE
  // ==========================================
  const processInventoryFinance = (consumables, nonConsumables, maintenance, payments) => {
    let totalExpenses = 0; let totalPaidToVendors = 0;
    const expensesList = [];

    // Parse Consumable Purchases
    consumables.forEach(item => {
      const amt = Number(item.billAmount || item.netAmount || 0);
      totalExpenses += amt;
      expensesList.push({
        id: `C-${item.inventoryEntryId || Math.random()}`,
        rawDate: item.entryDate || item.createdAt,
        parsedDate: parseDate(item.entryDate || item.createdAt),
        type: 'Consumable',
        reference: item.voucherNumber || '-',
        entity: item.vendorName || 'Unknown Vendor',
        item: item.itemName || '-',
        amount: amt
      });
    });

    // Parse Non-Consumable Purchases
    nonConsumables.forEach(item => {
      const amt = Number(item.billAmount || item.netAmount || 0);
      totalExpenses += amt;
      expensesList.push({
        id: `NC-${item.inventoryEntryId || Math.random()}`,
        rawDate: item.entryDate || item.createdAt,
        parsedDate: parseDate(item.entryDate || item.createdAt),
        type: 'Asset',
        reference: item.voucherNumber || '-',
        entity: item.vendorName || 'Unknown Vendor',
        item: item.itemName || '-',
        amount: amt
      });
    });

    // Parse Maintenance
    maintenance.forEach(item => {
      const amt = Number(item.maintenanceAmount || 0);
      totalExpenses += amt;
      expensesList.push({
        id: `M-${item.mid || Math.random()}`,
        rawDate: item.date || item.createdAt,
        parsedDate: parseDate(item.date || item.createdAt),
        type: 'Maintenance',
        reference: item.serialNumber || '-',
        entity: item.engineerName || 'Unknown Engineer',
        item: item.itemName || '-',
        amount: amt
      });
    });

    // Parse Payments Made
    const paymentsList = payments.map(p => {
      const amt = Math.abs(Number(p.paidAmount || 0)); 
      totalPaidToVendors += amt;
      return {
        id: p.paymentId || Math.random(),
        rawDate: p.paymentDate || p.createdAt,
        parsedDate: parseDate(p.paymentDate || p.createdAt),
        vendor: p.vendorName || 'Unknown Vendor',
        mode: p.paymentMode || '-',
        ref: p.paymentAgentVoucher || '-',
        amount: amt
      };
    });

    // Sort arrays newest first
    expensesList.sort((a, b) => b.parsedDate - a.parsedDate);
    paymentsList.sort((a, b) => b.parsedDate - a.parsedDate);

    setInventoryExpenses(expensesList);
    setInventoryPayments(paymentsList);
    setInventoryMetrics({
      totalBilled: totalExpenses,
      totalPaid: totalPaidToVendors,
      totalPending: totalExpenses - totalPaidToVendors
    });
  };

  // ==========================================
  // PAGINATION HELPERS
  // ==========================================
  const paginate = (dataList, pageNum) => {
    const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
    return dataList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const renderPaginationControls = (totalItems, currentPage, setPageFn) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div style={styles.paginationContainer}>
        <button 
          style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }} 
          disabled={currentPage === 1}
          onClick={() => setPageFn(currentPage - 1)}
        >
          &laquo; Previous
        </button>
        <span style={styles.pageInfo}>Page <b>{currentPage}</b> of {totalPages}</span>
        <button 
          style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }} 
          disabled={currentPage === totalPages}
          onClick={() => setPageFn(currentPage + 1)}
        >
          Next &raquo;
        </button>
      </div>
    );
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div style={styles.container}>
      {/* HEADER & TOGGLE */}
      <div style={styles.headerRow}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Financial Overview</h2>
        <div style={styles.toggleGroup}>
          <button 
            style={activeTab === 'PATIENT' ? styles.toggleBtnActive : styles.toggleBtn}
            onClick={() => setActiveTab('PATIENT')}
          >
            Patient Finance
          </button>
          <button 
            style={activeTab === 'INVENTORY' ? styles.toggleBtnActive : styles.toggleBtn}
            onClick={() => setActiveTab('INVENTORY')}
          >
            Inventory Finance
          </button>
        </div>
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {loading ? (
        <div style={styles.centerText}>Loading financial data...</div>
      ) : (
        <>
          {/* -------------------------------------------
              PATIENT FINANCE VIEW
          ------------------------------------------- */}
          {activeTab === 'PATIENT' && (
            <div>
              {/* SUMMARY CARDS */}
              <div style={styles.summaryGrid}>
                <div style={{...styles.summaryCard, borderLeft: '4px solid #0284c7'}}>
                  <div style={styles.cardTitle}>Total Patient Business</div>
                  <div style={styles.cardAmount}>{formatCurrency(patientMetrics.totalBusiness)}</div>
                </div>
                <div style={{...styles.summaryCard, borderLeft: '4px solid #16a34a'}}>
                  <div style={styles.cardTitle}>Total Collected</div>
                  <div style={styles.cardAmount}>{formatCurrency(patientMetrics.totalCollected)}</div>
                </div>
                <div style={{...styles.summaryCard, borderLeft: '4px solid #dc2626'}}>
                  <div style={styles.cardTitle}>Total Pending</div>
                  <div style={{...styles.cardAmount, color: '#dc2626'}}>{formatCurrency(patientMetrics.totalPending)}</div>
                </div>
              </div>

              {/* DATA TABLE (PENDING ONLY) */}
              <div style={styles.tableCard}>
                <div style={styles.tableHeader}>
                  <h3 style={{ margin: 0 }}>Pending Patient Dues</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Showing only bookings with a balance due</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Booking ID</th>
                        <th style={styles.th}>Patient Name</th>
                        <th style={styles.th}>Total Bill</th>
                        <th style={styles.th}>Paid (Advance)</th>
                        <th style={styles.th}>Pending Balance</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(patientBookings, patientPage).map((b, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{formatDate(b.rawDate)}</td>
                          <td style={{...styles.td, fontWeight: 'bold'}}>#{b.id}</td>
                          <td style={styles.td}>{b.patientName}</td>
                          <td style={{...styles.td, fontWeight: 'bold'}}>{formatCurrency(b.total)}</td>
                          <td style={{...styles.td, color: '#16a34a', fontWeight: 'bold'}}>{formatCurrency(b.paid)}</td>
                          <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>{formatCurrency(b.pending)}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge, 
                              backgroundColor: b.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                              color: b.status === 'Partial' ? '#92400e' : '#991b1b'
                            }}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {patientBookings.length === 0 && (
                        <tr><td colSpan="7" style={styles.centerText}>No pending dues found!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationControls(patientBookings.length, patientPage, setPatientPage)}
              </div>
            </div>
          )}

          {/* -------------------------------------------
              INVENTORY FINANCE VIEW
          ------------------------------------------- */}
          {activeTab === 'INVENTORY' && (
            <div>
              {/* SUMMARY CARDS - Show ONLY Balance Due */}
              <div style={styles.summaryGrid}>
                <div style={{...styles.summaryCard, borderLeft: '4px solid #dc2626'}}>
                  <div style={styles.cardTitle}>Total Balance Due (Payables)</div>
                  <div style={{...styles.cardAmount, color: '#dc2626'}}>{formatCurrency(inventoryMetrics.totalPending)}</div>
                </div>
              </div>

              {/* DATA TABLE - EXPENSES/BILLS */}
              <div style={{...styles.tableCard, marginBottom: '20px'}}>
                <div style={styles.tableHeader}>
                  <h3 style={{ margin: 0 }}>All Inventory Bills (Purchases & Maint.)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Vendor / Engineer</th>
                        <th style={styles.th}>Item / Description</th>
                        <th style={styles.th}>Voucher / Ref</th>
                        <th style={styles.th}>Bill Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(inventoryExpenses, invExpPage).map((e, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{formatDate(e.rawDate)}</td>
                          <td style={styles.td}>
                            <span style={{...styles.badge, backgroundColor: '#f1f5f9', color: '#475569'}}>{e.type}</span>
                          </td>
                          <td style={{...styles.td, fontWeight: 'bold'}}>{e.entity}</td>
                          <td style={styles.td}>{e.item}</td>
                          <td style={styles.td}>{e.reference}</td>
                          <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>{formatCurrency(e.amount)}</td>
                        </tr>
                      ))}
                      {inventoryExpenses.length === 0 && (
                        <tr><td colSpan="6" style={styles.centerText}>No expense data found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationControls(inventoryExpenses.length, invExpPage, setInvExpPage)}
              </div>

              {/* DATA TABLE - PAYMENTS */}
              <div style={styles.tableCard}>
                <div style={styles.tableHeader}>
                  <h3 style={{ margin: 0 }}>Payments Made to Vendors</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Vendor Name</th>
                        <th style={styles.th}>Payment Mode</th>
                        <th style={styles.th}>Reference / Voucher</th>
                        <th style={styles.th}>Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(inventoryPayments, invPayPage).map((p, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td style={styles.td}>{formatDate(p.rawDate)}</td>
                          <td style={{...styles.td, fontWeight: 'bold'}}>{p.vendor}</td>
                          <td style={styles.td}>{p.mode}</td>
                          <td style={styles.td}>{p.ref}</td>
                          <td style={{...styles.td, color: '#16a34a', fontWeight: 'bold'}}>{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {inventoryPayments.length === 0 && (
                        <tr><td colSpan="5" style={styles.centerText}>No payment data found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationControls(inventoryPayments.length, invPayPage, setInvPayPage)}
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    padding: '20px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    color: '#0f172a'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  toggleGroup: {
    display: 'flex',
    backgroundColor: '#e2e8f0',
    padding: '4px',
    borderRadius: '8px'
  },
  toggleBtn: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: '0.2s'
  },
  toggleBtnActive: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#ffffff',
    fontWeight: 'bold',
    color: '#0284c7',
    cursor: 'pointer',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  cardAmount: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0f172a'
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  tableHeader: {
    padding: '15px 20px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px'
  },
  thRow: {
    backgroundColor: '#f1f5f9'
  },
  th: {
    padding: '12px 20px',
    fontWeight: '600',
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '12px 20px',
    color: '#334155',
    whiteSpace: 'nowrap'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  centerText: {
    textAlign: 'center',
    padding: '30px',
    color: '#64748b'
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500'
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '15px 20px',
    gap: '15px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0'
  },
  pageBtn: {
    padding: '6px 12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    color: '#0f172a',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  pageInfo: {
    fontSize: '14px',
    color: '#64748b'
  }
};