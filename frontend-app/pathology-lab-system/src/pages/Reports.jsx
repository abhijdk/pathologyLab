import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');

  // Data States
  const [bookings, setBookings] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [parameterLookup, setParameterLookup] = useState({});
  const [categoryLookup, setCategoryLookup] = useState({});
  const [categoryToParamsMap, setCategoryToParamsMap] = useState({});
  
  const [masterLookup, setMasterLookup] = useState({});
  const [categoryToMasterMap, setCategoryToMasterMap] = useState({});

  // Result Entry View State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentReportParams, setCurrentReportParams] = useState([]); 
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------------------------------
  // 1. DATA FETCHING
  // --------------------------------------------------------
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [bookRes, patRes, testsRes, reportRes, docRes] = await Promise.all([
        api.get('/bookings/all'),
        api.get('/patients'),
        api.get('/tests'),
        api.get('/reports/booking/all'),
        api.get('/doctors').catch(() => ({ data: [] }))
      ]);

      const patientMap = {};
      patRes.data?.forEach(p => patientMap[p.patientId] = p);

      const doctorMap = {};
      docRes.data?.forEach(d => doctorMap[d.doctorId] = d.name);

      const pLookup = {};
      const cLookup = {};
      const catToParams = {};
      const mLookup = {};
      const catToMaster = {};

      const colorThemes = [
        { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', catBg: '#dbeafe' }, // Blue
        { bg: '#fefce8', border: '#fef08a', text: '#713f12', catBg: '#fef9c3' }, // Yellow
        { bg: '#fffbeb', border: '#fde68a', text: '#92400e', catBg: '#fef3c7' }, // Amber
        { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', catBg: '#f1f5f9' }, // Gray
        { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', catBg: '#dcfce7' }, // Green
      ];
      
      testsRes.data?.forEach((test, index) => {
        mLookup[test.testId] = { name: test.testName, theme: colorThemes[index % colorThemes.length] };

        test.categories?.forEach(cat => {
          cLookup[cat.categoryId] = cat.categoryName;
          catToMaster[cat.categoryId] = test.testId;
          catToParams[cat.categoryId] = [];
          
          cat.parameters?.forEach(param => {
            catToParams[cat.categoryId].push(param.paramId);
            pLookup[param.paramId] = {
              name: param.paramName,
              unit: param.unit,
              refMale: `${param.refMaleMin} - ${param.refMaleMax}`,
              refFemale: `${param.refFemaleMin} - ${param.refFemaleMax}`,
              categoryId: cat.categoryId
            };
          });
        });
      });
      
      setParameterLookup(pLookup);
      setCategoryLookup(cLookup);
      setCategoryToParamsMap(catToParams);
      setMasterLookup(mLookup);
      setCategoryToMasterMap(catToMaster);

      const processedBookings = bookRes.data?.map(b => {
        const patient = patientMap[b.patientId] || {};
        const patientName = patient.name || 'Unknown Patient';
        const mobile = patient.phone || patient.mobile || 'N/A';
        const doctorName = doctorMap[b.doctorId] || 'Self';
        const pendingAmount = (b.totalAmount || 0) - (b.advanceAmount || 0);
        
        let categoryIds = [];
        if (typeof b.bookingCategory === 'string') {
          try { categoryIds = JSON.parse(b.bookingCategory); } catch(e){}
        } else if (Array.isArray(b.bookingCategory)) {
          categoryIds = b.bookingCategory;
        }
        const testNames = categoryIds.map(id => cLookup[id] || `Test ${id}`).join(', ');

        return { ...b, patientName, mobile, doctorName, pendingAmount, testNames, categoryIds };
      }) || [];
      
      processedBookings.sort((a, b) => b.bookingId - a.bookingId);
      setBookings(processedBookings);
      
      const grouped = (reportRes.data || []).reduce((acc, report) => {
        if (!acc[report.bookingId]) acc[report.bookingId] = [];
        acc[report.bookingId].push(report);
        return acc;
      }, {});
      setGroupedReports(grouped);

    } catch (err) {
      console.error("Data fetch error:", err);
      showMessage('Failed to load dashboard data from server.', 'error');
    }
    setLoading(false);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // --------------------------------------------------------
  // 2. RESULT ENTRY LOGIC
  // --------------------------------------------------------
  const handleOpenBooking = async (booking) => {
    setSelectedBooking(booking);
    
    try {
      const res = await api.get(`/reports/booking/${booking.bookingId}`);
      const existingData = res.data || [];
      const savedValuesMap = {};
      existingData.forEach(r => { savedValuesMap[r.paramId] = r.resultValue });

      const expectedParams = [];
      const initialForm = {};

      booking.categoryIds.forEach(catId => {
        const paramIdsForCategory = categoryToParamsMap[catId] || [];
        paramIdsForCategory.forEach(pId => {
          expectedParams.push({ paramId: pId, categoryId: catId });
          initialForm[pId] = savedValuesMap[pId] || ''; 
        });
      });

      setCurrentReportParams(expectedParams);
      setFormData(initialForm);
    } catch (err) {
      showMessage(`Failed to load results for Booking #${booking.bookingId}`, 'error');
    }
  };

  const handleInputChange = (paramId, value) => {
    setFormData(prev => ({ ...prev, [paramId]: value }));
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = currentReportParams.map(param => ({
        bookingId: selectedBooking.bookingId,
        categoryId: param.categoryId,
        paramId: param.paramId,
        resultValue: formData[param.paramId] || ''
      }));

      await api.post('/reports/save', payload);
      showMessage(`Results saved successfully for ${selectedBooking.patientName}`);
      
      const res = await api.get('/reports/booking/all');
      const grouped = (res.data || []).reduce((acc, report) => {
        if (!acc[report.bookingId]) acc[report.bookingId] = [];
        acc[report.bookingId].push(report);
        return acc;
      }, {});
      setGroupedReports(grouped);

    } catch (err) {
      showMessage('Failed to save results.', 'error');
    }
    setIsSaving(false);
  };

  // --------------------------------------------------------
  // 3. NESTED GROUPING
  // --------------------------------------------------------
  const filteredBookings = useMemo(() => {
    if (!search) return bookings;
    const query = search.toLowerCase();
    return bookings.filter(b => 
      b.patientName.toLowerCase().includes(query) || 
      b.bookingId.toString().includes(query) ||
      b.testNames.toLowerCase().includes(query)
    );
  }, [bookings, search]);

  const masterTestGroups = useMemo(() => {
    if (!currentReportParams.length) return {};
    const groups = {};

    currentReportParams.forEach(param => {
      const catId = param.categoryId;
      const masterId = categoryToMasterMap[catId] || 0;
      
      if (!groups[masterId]) {
        groups[masterId] = {
          masterId,
          masterName: masterLookup[masterId]?.name || 'Other Tests',
          theme: masterLookup[masterId]?.theme || { bg: '#fff', border: '#ccc', text: '#000', catBg: '#f1f5f9' },
          categories: {}
        };
      }
      if (!groups[masterId].categories[catId]) {
        groups[masterId].categories[catId] = {
          categoryId: catId,
          categoryName: categoryLookup[catId] || 'Unknown Category',
          params: []
        };
      }
      groups[masterId].categories[catId].params.push(param);
    });

    return groups;
  }, [currentReportParams, categoryToMasterMap, masterLookup, categoryLookup]);

  // --------------------------------------------------------
  // 4. RENDER UI
  // --------------------------------------------------------
  return (
    <>
      <style>{`
        /* SCREEN HIDES PRINT UI */
        @media screen {
          .print-only { display: none !important; }
        }

        /* PRINT HIDES SCREEN UI */
        @media print {
          @page { margin: 15mm; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { 
            position: absolute; left: 0; top: 0; width: 100%; 
            background: white !important; color: black !important;
          }
          .no-print { display: none !important; }
          
          /* PAGE BREAK PER CATEGORY */
          .page-break { page-break-after: always; padding-bottom: 20px; }
          .page-break:last-child { page-break-after: auto; }
          
          .print-hr { border: none; border-top: 1px solid #000; margin: 8px 0; }
        }
      `}</style>

      {/* ========================================================
          SCREEN UI (Data Entry & Dashboards)
      ======================================================== */}
      <div className="card no-print">
        <div style={styles.header}>
          <h2>Report Management</h2>
          {selectedBooking && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{...styles.btn, ...styles.btnOutline}} onClick={() => setSelectedBooking(null)}>← Back to List</button>
              <button style={{...styles.btn, background: '#475569', color: '#fff'}} onClick={() => window.print()}>🖨 Print Report</button>
            </div>
          )}
        </div>

        {message.text && (
          <div style={{...styles.alert, background: message.type === 'error' ? '#fee2e2' : '#dcfce3', color: message.type === 'error' ? '#991b1b' : '#166534'}}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={styles.centerText}>Loading dashboard data...</div>
        ) : !selectedBooking ? (
          
          /* DASHBOARD TABLE */
          <div>
            <input 
              style={styles.search} 
              placeholder="Search by Patient Name, Booking ID, or Test..." 
              value={search}
              onChange={e => setSearch(e.target.value)} 
            />
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Booking ID</th>
                    <th style={styles.th}>Patient Name</th>
                    <th style={styles.th}>Tests Selected</th>
                    <th style={styles.th}>Progress</th>
                    <th style={styles.th}>Payment Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan="6" style={styles.centerText}>No records found.</td></tr>
                  ) : (
                    filteredBookings.map(b => {
                      const reportsForBooking = groupedReports[b.bookingId] || [];
                      const enteredCount = reportsForBooking.filter(r => r.resultValue && r.resultValue.trim() !== '').length;
                      const expectedCount = b.categoryIds.reduce((total, catId) => total + (categoryToParamsMap[catId]?.length || 0), 0);
                      const hasDataEntered = enteredCount > 0;
                      
                      return (
                        <tr key={b.bookingId} style={styles.tr}>
                          <td style={{ fontWeight: 'bold' }}>#{b.bookingId}</td>
                          <td style={{ fontWeight: '500' }}>{b.patientName}</td>
                          <td style={{ fontSize: '0.85rem', color: '#475569' }}>{b.testNames || 'N/A'}</td>
                          <td><span style={styles.progressText}>{enteredCount} / {expectedCount} Entered</span></td>
                          <td><span style={{...styles.badge, ...styles[`status${b.paymentStatus}`]}}>{b.paymentStatus || 'UNKNOWN'}</span></td>
                          <td>
                            <button
                                    style={{ ...styles.btnPrimary, background: '#0284c7' }} // Blue
                                    onClick={() => handleOpenBooking(b)}
                                  >
                                    {hasDataEntered ? 'Edit Results' : '+ Add Results'}
                                  </button>

                                  <button
                                    style={{ ...styles.btnPrimary, background: '#16a34a' }} // Green
                                    onClick={() => handleOpenBooking(b)}
                                  >
                                    Print Results
                                  </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* RESULT ENTRY FORM (Colored Boxes) */
          <div>
            <div style={styles.reportHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Patient Report Entry</h3>
                  <p style={{ margin: '5px 0 0 0' }}>Patient: {selectedBooking.patientName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0' }}>Booking ID: <strong>#{selectedBooking.bookingId}</strong></p>
                  <p style={{ margin: 0 }}>Date: {new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveResults}>
              {Object.keys(masterTestGroups).length > 0 ? (
                Object.values(masterTestGroups).map(masterGroup => (
                  <div key={masterGroup.masterId} style={{ 
                    background: masterGroup.theme.bg, border: `1px solid ${masterGroup.theme.border}`, 
                    borderRadius: '8px', marginBottom: '20px', overflow: 'hidden'
                  }}>
                    <div style={{ padding: '12px 20px', background: masterGroup.theme.border, color: masterGroup.theme.text, fontWeight: 'bold' }}>
                      {masterGroup.masterName}
                    </div>

                    <div style={{ padding: '15px' }}>
                      <table style={styles.nestedTable}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${masterGroup.theme.border}` }}>
                            <th style={styles.thNested}>Parameter Name</th>
                            <th style={styles.thNested}>Result Value</th>
                            <th style={styles.thNested}>Unit</th>
                            <th style={styles.thNested}>Normal Range (M/F)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(masterGroup.categories).map(category => (
                            <React.Fragment key={category.categoryId}>
                              <tr style={{ background: masterGroup.theme.catBg }}>
                                <td colSpan="4" style={{ padding: '8px 15px', fontWeight: 'bold', color: masterGroup.theme.text }}>
                                  {category.categoryName}
                                </td>
                              </tr>
                              {category.params.map(param => {
                                const paramInfo = parameterLookup[param.paramId] || {};
                                return (
                                  <tr key={param.paramId} style={{ borderBottom: `1px solid ${masterGroup.theme.border}40` }}>
                                    <td style={{ fontWeight: '500', padding: '10px 10px 10px 25px' }}>{paramInfo.name}</td>
                                    <td style={{ padding: '10px' }}>
                                      <input 
                                        type="text" style={styles.input} placeholder="Result"
                                        value={formData[param.paramId] || ''}
                                        onChange={(e) => handleInputChange(param.paramId, e.target.value)}
                                      />
                                    </td>
                                    <td style={{ padding: '10px' }}>{paramInfo.unit || '-'}</td>
                                    <td style={{ fontSize: '0.85rem', padding: '10px' }}>
                                      M: {paramInfo.refMale || '-'}<br/>F: {paramInfo.refFemale || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.centerText}>No parameters found.</div>
              )}
              
              {/* UPDATED: Added bottom action buttons for convenience */}
              <div style={{ 
                marginTop: '30px', 
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }} className="no-print">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" style={{...styles.btn, ...styles.btnOutline}} onClick={() => setSelectedBooking(null)}>← Back to List</button>
                  <button type="button" style={{...styles.btn, background: '#475569', color: '#fff'}} onClick={() => window.print()}>🖨 Print Report</button>
                </div>
                <button type="submit" style={styles.btnPrimary} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Results'}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>


      {/* ========================================================
          PRINT UI (Black & White, Page Break Per Category)
      ======================================================== */}
      {selectedBooking && (
        <div className="print-only print-container">
          {Object.values(masterTestGroups).map(masterGroup => 
            Object.values(masterGroup.categories).map(category => (
              
              <div key={`${masterGroup.masterId}-${category.categoryId}`} className="page-break" style={{ fontFamily: 'Arial, sans-serif', color: '#000' }}>
                
                {/* Lines 1, 2, 3: Header */}
                <h2 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>HealthStack Diagnostics</h2>
                <p style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '12px' }}>Tihidi, Bhadrak, Odisha - 756130</p>
                <p style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12px' }}>Email: lab@healthstack.com | Mobile: +91-9876543210</p>
                
                <hr className="print-hr" />
                
                {/* Line 4: Patient Name & Booking ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                  <div><strong>Patient Name:</strong> {selectedBooking.patientName}</div>
                  <div><strong>Booking ID:</strong> #{selectedBooking.bookingId}</div>
                </div>
                
                {/* Line 5: Mobile & Ref Dr */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                  <div><strong>Mobile:</strong> {selectedBooking.mobile}</div>
                  <div><strong>Ref Dr:</strong> Dr. {selectedBooking.doctorName}</div>
                </div>
                
                <hr className="print-hr" />
                
                {/* Line 6: Master Test Name */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', padding: '5px 0' }}>
                  {masterGroup.masterName}
                </div>
                
                <hr className="print-hr" />
                
                {/* Line 7: Category Name */}
                <div style={{ fontWeight: 'bold', fontSize: '15px', padding: '5px 0' }}>
                  {category.categoryName}
                </div>
                
                <hr className="print-hr" style={{ marginBottom: '15px' }} />
                
                {/* Line 8: Parameters Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Parameter Name</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Result</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Unit</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Normal Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.params.map(param => {
                      const paramInfo = parameterLookup[param.paramId] || {};
                      return (
                        <tr key={param.paramId}>
                          <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>{paramInfo.name}</td>
                          <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc', fontWeight: 'bold' }}>{formData[param.paramId] || '-'}</td>
                          <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>{paramInfo.unit || '-'}</td>
                          <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>
                            {paramInfo.refMale && paramInfo.refMale !== ' - ' && <div>M: {paramInfo.refMale}</div>}
                            {paramInfo.refFemale && paramInfo.refFemale !== ' - ' && <div>F: {paramInfo.refFemale}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer Signature Box */}
                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #000', width: '180px', marginBottom: '5px' }}></div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Seal & Sign of Lab Tech</div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}

// --------------------------------------------------------
// INLINE STYLES (Screen Only)
// --------------------------------------------------------
const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  search: { padding: '10px 15px', width: '100%', maxWidth: '400px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' },
  alert: { padding: '12px 20px', borderRadius: '6px', marginBottom: '20px', fontWeight: '500' },
  centerText: { textAlign: 'center', padding: '40px', color: '#64748b' },
  tableWrapper: { overflowX: 'auto', background: '#fff', borderRadius: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' },
  thRow: { background: '#f8fafc' },
  th: { padding: '12px 15px', color: '#334155', fontWeight: '600', borderBottom: '2px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  nestedTable: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem', background: '#fff' },
  thNested: { padding: '10px 15px', color: '#475569', fontWeight: '600' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' },
  btnPrimary: { background: '#0284c7', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  btnOutline: { background: 'transparent', color: '#475569', border: '1px solid #cbd5e1' },
  input: { padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', maxWidth: '150px' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' },
  statusPaid: { background: '#dcfce7', color: '#166534' },
  statusPartial: { background: '#fef3c7', color: '#92400e' },
  statusPending: { background: '#fee2e2', color: '#991b1b' },
  progressText: { fontSize: '0.85rem', color: '#475569', fontWeight: '500' },
  reportHeader: { marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0' }
};