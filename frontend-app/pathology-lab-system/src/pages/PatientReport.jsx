// without login patient download the report
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

// Integrated Header Components
const Header20 = () => {
  return (
    <header
      className="no-print"
      style={{
        backgroundColor: '#1e3a8a',
        color: '#fff',
        padding: '15px 20px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <h2 style={{ margin: 0 }}>HealthStack Diagnostics</h2>
    </header>
  );
};

// Integrated Footer Component
const Footer = () => {
  return (
    <footer 
      className="footer no-print" 
      style={{
        textAlign: 'center',
        padding: '20px',
        color: '#64748b',
        fontSize: '0.875rem',
        borderTop: '1px solid #e2e8f0',
        marginTop: '40px',
        background: '#fff'
      }}
    >
      <div>© {new Date().getFullYear()} HealthStack Diagnostics. All rights reserved.</div>
      <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>Tihidi, Bhadrak, Odisha - 756130</div>
    </footer>
  );
};

export default function PatientReport() {
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [reportInfo, setReportInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState({ code: null, text: '' }); // Tracks semantic statuses: 'UNDER_PROCESS', 'NOT_FOUND', 'SUCCESS'
  const [liveDateTime, setLiveDateTime] = useState('');

  // Live Timer for Print Reference
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDateTime(new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReport = async (e) => {
    e.preventDefault();
    if (!bookingIdInput.trim()) return;

    setLoading(true);
    setStatusState({ code: null, text: '' });
    setReportInfo(null);

    try {
      const response = await api.get(`/patientReports/${bookingIdInput}`);
      
      // Case 1: Report Under Process (Status 204 or missing essential test payload structure)
      if (response.status === 204 || !response.data || !response.data.tests || response.data.tests.length === 0) {
        setStatusState({ code: 'UNDER_PROCESS', text: 'Report under process' });
        setLoading(false);
        return;
      }

      // Case 3: Report Available (Status 200)
      if (response.status === 200) {
        const data = response.data;
        const masterGroups = {};
        
        // Dynamic map collection listing for displaying unique Test Names in the Success Card
        const uniqueTestNames = new Set();

        data.tests.forEach(test => {
          if (test.testName) uniqueTestNames.add(test.testName);
          
          const master = test.masterName || 'General Laboratory Tests';
          if (!masterGroups[master]) {
            masterGroups[master] = { masterName: master, categories: {} };
          }
          
          const catName = test.categoryName || 'General';
          if (!masterGroups[master].categories[catName]) {
            masterGroups[master].categories[catName] = {
              categoryName: catName,
              results: []
            };
          }
          
          if (test.results) {
            masterGroups[master].categories[catName].results.push(...test.results);
          }
        });

        const formattedMasterGroups = Object.values(masterGroups).map(group => ({
          ...group,
          categories: Object.values(group.categories)
        }));

        setReportInfo({
          bookingId: data.bookingId || bookingIdInput,
          patientName: data.patientName || 'N/A',
          mobile: data.mobile || '-',
          referredBy: data.doctorName ? `Dr. ${data.doctorName}` : 'Self',
          bookingDate: data.bookingDate || new Date().toLocaleDateString('en-IN'),
          reportDate: data.reportDate || new Date().toLocaleDateString('en-IN'),
          testSummaryList: Array.from(uniqueTestNames).join(', ') || 'Diagnostic Evaluation Profile',
          masterGroups: formattedMasterGroups
        });
        
        setStatusState({ code: 'SUCCESS', text: 'Report Ready' });
      }

    } catch (err) {
      console.error("Report error:", err);
      
      // Case 2: Invalid Booking ID (Status 404 or 400 Bad Requests mapping)
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
        setStatusState({ code: 'NOT_FOUND', text: 'Invalid booking id give correct booking id' });
      } else {
        // Safe standard technical fallback card block
        setStatusState({ 
          code: 'ERROR', 
          text: err.response?.data?.message || err.message || 'System error encountered while connecting to our database.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* SCREEN HIDES PRINT UI */
        @media screen {
          .print-only { display: none !important; }
        }

        /* PRINT HIDES SCREEN UI */
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden; background: #fff !important; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { 
            position: absolute; left: 0; top: 0; width: 100%; 
            color: black !important;
          }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; padding-bottom: 20px; }
          .page-break:last-child { page-break-after: auto; }
          .print-hr { border: none; border-top: 1px solid #000; margin: 8px 0; }
        }
      `}</style>

      {/* App Header (Screen View Only) */}
      <Header20 />

      {/* ========================================================
          SCREEN UI (Search Bar & Dynamic Status Panels)
      ======================================================== */}
      <div style={styles.screenWrapper} className="no-print">
        
        {/* Search Input Box */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.mainTitle}>Download Official Report</h2>
          </div>

          <form onSubmit={fetchReport} style={styles.searchForm}>
            <input
              type="text"
              value={bookingIdInput}
              onChange={(e) => setBookingIdInput(e.target.value)}
              placeholder="Enter Booking ID (e.g., 24)"
              style={styles.searchField}
              required
            />
            <button type="submit" style={styles.btnFetch} disabled={loading}>
              {loading ? 'Searching...' : 'Retrieve'}
            </button>
          </form>
        </div>

        {/* ========================================================
            DYNAMIC REFINED STATUS CARDS
        ======================================================== */}
        
        {/* CASE 1: Report Under Process Warning UI Card */}
        {statusState.code === 'UNDER_PROCESS' && (
          <div style={{ ...styles.statusCard, ...styles.cardProcess }}>
            <div style={styles.statusHeader}>
              <span style={styles.statusIconYellow}>🟡</span>
              <h3 style={styles.statusTitleDark}>Report Under Process</h3>
            </div>
            <p style={styles.statusDescription}>
              Your report is currently being analyzed and verified by our laboratory team. 
              Please try again after some time.
            </p>
          </div>
        )}

        {/* CASE 2: Invalid Booking ID Error UI Card */}
        {statusState.code === 'NOT_FOUND' && (
          <div style={{ ...styles.statusCard, ...styles.cardError }}>
            <div style={styles.statusHeader}>
              <span style={styles.statusIconRed}>🔴</span>
              <h3 style={styles.statusTitleDark}>Invalid Booking ID</h3>
            </div>
            <p style={styles.statusDescription}>
              No matching booking parameters were discovered in our diagnostic database. 
              Please check the Booking ID, verify, and try again.
            </p>
          </div>
        )}

        {/* Catch-all unexpected standard internal database error */}
        {statusState.code === 'ERROR' && (
          <div style={{ ...styles.statusCard, ...styles.cardError }}>
            <div style={styles.statusHeader}>
              <span style={styles.statusIconRed}>❌</span>
              <h3 style={styles.statusTitleDark}>Request Disturbance</h3>
            </div>
            <p style={styles.statusDescription}>{statusState.text}</p>
          </div>
        )}

        {/* CASE 3: Report Available Overview Actions Dashboard Panel */}
        {statusState.code === 'SUCCESS' && reportInfo && (
          <div style={{ ...styles.statusCard, ...styles.cardSuccess, marginTop: '25px' }}>
            <div style={styles.statusHeader}>
              <span style={styles.statusIconGreen}>🟢</span>
              <h3 style={styles.statusTitleGreen}>Report Ready</h3>
            </div>
            
            <div style={styles.successMetaGrid}>
              <div style={styles.metaColumn}>
                <p style={styles.metaRow}><strong>Patient Name:</strong> {reportInfo.patientName}</p>
                <p style={styles.metaRow}><strong>Booking ID:</strong> #{reportInfo.bookingId}</p>
                <p style={styles.metaRow}><strong>Referred By:</strong> {reportInfo.referredBy}</p>
              </div>
              <div style={styles.metaColumn}>
                <p style={styles.metaRow}><strong>Investigation Tests:</strong> <span style={{color: '#1e3a8a', fontWeight: '500'}}>{reportInfo.testSummaryList}</span></p>
                <p style={styles.metaRow}><strong>Booking Date:</strong> {reportInfo.bookingDate}</p>
                <p style={styles.metaRow}><strong>Release Date:</strong> {reportInfo.reportDate}</p>
              </div>
            </div>

            <div style={styles.actionButtonContainer}>
              <a href="#interactive-preview" style={styles.btnActionSecondary}>
                👁️ View Report Details
              </a>
              <button onClick={() => window.print()} style={styles.btnActionPrimary}>
                🖨️ Download & Print Official PDF
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Interactive Report Screen Preview Section */}
        {statusState.code === 'SUCCESS' && reportInfo && (
          <div id="interactive-preview" style={{ ...styles.card, marginTop: '30px' }}>
            
            {/* Screen Header Panel */}
            <div style={styles.screenReportHeader}>
              <div>
                <h1 style={styles.brandText}>HealthStack Diagnostics</h1>
                <p style={styles.brandSubText}>NABL Accredited & ISO Certified Laboratory</p>
                <p style={styles.metaText}>Tihidi, Bhadrak, Odisha - 756130</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={styles.metaText}><strong>Booking ID:</strong> #{reportInfo.bookingId}</p>
                <p style={styles.metaText}><strong>Report Date:</strong> {reportInfo.reportDate}</p>
              </div>
            </div>

            {/* Demographics Summary Grid */}
            <div style={styles.demoGrid}>
              <div style={styles.demoBox}><strong>Patient Name:</strong> <span style={{ textTransform: 'uppercase' }}>{reportInfo.patientName}</span></div>
              <div style={styles.demoBox}><strong>Mobile Number:</strong> {reportInfo.mobile}</div>
              <div style={styles.demoBox}><strong>Referred By:</strong> <span style={{ textTransform: 'uppercase' }}>{reportInfo.referredBy}</span></div>
            </div>

            {/* Test Investigations View Wrapper */}
            {reportInfo.masterGroups.map((masterGroup, mIdx) => (
              <div key={mIdx} style={styles.masterWrapper}>
                <div style={styles.masterBanner}>{masterGroup.masterName}</div>
                
                {masterGroup.categories.map((category, cIdx) => (
                  <div key={cIdx} style={{ marginBottom: '20px' }}>
                    <h4 style={styles.categoryHeading}>{category.categoryName}</h4>
                    
                    <table style={styles.screenTable}>
                      <thead>
                        <tr style={styles.screenThRow}>
                          <th style={styles.screenTh}>Investigation</th>
                          <th style={{ ...styles.screenTh, textAlign: 'center' }}>Result</th>
                          <th style={{ ...styles.screenTh, textAlign: 'center' }}>Unit</th>
                          <th style={styles.screenTh}>Reference Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.results.map((param, pIdx) => (
                          <tr key={pIdx} style={styles.screenTr}>
                            <td style={styles.screenTd}><strong>{param.parameter}</strong></td>
                            <td style={{ ...styles.screenTd, ...styles.screenResultCell }}>{param.value || '-'}</td>
                            <td style={{ ...styles.screenTd, textAlign: 'center', fontFamily: 'monospace' }}>{param.unit || '-'}</td>
                            <td style={{ ...styles.screenTd, color: '#475569', fontSize: '0.85rem' }}>{param.range || 'As per clinical correlation'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))}
            
            <div style={styles.endMarker}>*** End of Report ***</div>
          </div>
        )}
      </div>
      

      {/* App Footer (Screen View Only) */}
      <Footer />

      {/* ========================================================
          PRINT UI (Minimal High-Contrast, Structured Page-Breaks)
      ======================================================== */}
      {statusState.code === 'SUCCESS' && reportInfo && (
        <div className="print-only print-container">
          {reportInfo.masterGroups.map((masterGroup) => 
            masterGroup.categories.map((category, catIdx) => (
              
              <div key={`${masterGroup.masterName}-${catIdx}`} className="page-break" style={{ fontFamily: 'Arial, sans-serif', color: '#000' }}>
                
                {/* Lines 1, 2, 3: Print Brand Header */}
                <h2 style={{ textAlign: 'center', margin: '0 0 4px 0', fontSize: '22px', letterSpacing: '-0.5px' }}>HealthStack Diagnostics</h2>
                <p style={{ textAlign: 'center', margin: '0 0 4px 0', fontSize: '11px', color: '#333' }}>Tihidi, Bhadrak, Odisha - 756130</p>
                <p style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '11px', color: '#333' }}>Email: lab@healthstack.com | Ph: +91-9876543210</p>
                
                <hr className="print-hr" />
                
                {/* Line 4: Primary Patient Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '6px 0' }}>
                  <div><strong>Patient Name:</strong> <span style={{ textTransform: 'uppercase' }}>{reportInfo.patientName}</span></div>
                  <div><strong>Booking ID:</strong> #{reportInfo.bookingId}</div>
                </div>
                
                {/* Line 5: Secondary Demographics Record */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '6px 0 10px 0' }}>
                  <div><strong>Mobile:</strong> {reportInfo.mobile} | <strong>Date:</strong> {reportInfo.reportDate}</div>
                  <div><strong>Ref By:</strong> <span style={{ textTransform: 'uppercase' }}>{reportInfo.referredBy}</span></div>
                </div>
                
                <hr className="print-hr" />
                
                {/* Line 6: Master Group Segment Box Header */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase', padding: '6px 0' }}>
                  {masterGroup.masterName}
                </div>
                
                <hr className="print-hr" />
                
                {/* Line 7: Specific Laboratory Category Profile Title */}
                <div style={{ fontWeight: 'bold', fontSize: '13px', padding: '6px 0', textTransform: 'capitalize' }}>
                  {category.categoryName}
                </div>
                
                <hr className="print-hr" style={{ marginBottom: '12px' }} />
                
                {/* Line 8: Structural Parameters Table Elements */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '6px', width: '40%' }}>Investigation</th>
                      <th style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '6px', width: '20%' }}>Result</th>
                      <th style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '6px', width: '15%' }}>Unit</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '6px', width: '25%' }}>Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.results.map((param, index) => (
                      <tr key={index}>
                        <td style={{ padding: '7px 0', borderBottom: '1px dashed #ccc' }}>{param.parameter}</td>
                        <td style={{ padding: '7px 0', borderBottom: '1px dashed #ccc', fontWeight: 'bold', textAlign: 'center', fontSize: '13px' }}>
                          {param.value || '-'}
                        </td>
                        <td style={{ padding: '7px 0', borderBottom: '1px dashed #ccc', textAlign: 'center', fontFamily: 'monospace' }}>{param.unit || '-'}</td>
                        <td style={{ padding: '7px 0', borderBottom: '1px dashed #ccc', whiteSpace: 'pre-line', fontSize: '11px', color: '#333' }}>
                          {param.range || 'As per clinical correlation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Print Verification Timeline stamp */}
                <div style={{ fontSize: '10px', color: '#555', marginTop: '15px' }}>
                  Report Generated On: {liveDateTime}
                </div>

                {/* Footer Clinical Authorization Signatures Layout */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '10px', color: '#444', maxWidth: '60%', textAlign: 'justify', lineHeight: '1.2' }}>
                    <strong>Disclaimer:</strong> This verified clinical data record corresponds specifically to the analyzed specimen sample. 
                    Results should be parsed directly through medical context correlations by registered healthcare practitioners.
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #000', width: '160px', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Authorized Laboratory Signatory</div>
                    <div style={{ fontSize: '9px', color: '#444' }}>HealthStack Diagnostics</div>
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
// INLINE STYLES CONFIGURATION (Refinement UI Additions)
// --------------------------------------------------------
const styles = {
  screenWrapper: {
    padding: '30px 20px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '70vh'
  },
  card: {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px'
  },
  mainTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    margin: 0
  },
  searchForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '5px'
  },
  searchField: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '1rem',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
  },
  btnFetch: {
    background: '#1e3a8a',
    color: '#ffffff',
    padding: '12px 28px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    textTransform: 'uppercase',
    cursor: 'pointer',
    letterSpacing: '0.05em'
  },
  
  /* REFINED STATUS CARDS DESIGN LANGUAGE SYSTEMS */
  statusCard: {
    marginTop: '20px',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
    borderLeft: '5px solid transparent',
    animation: 'fadeIn 0.3s ease-out'
  },
  cardProcess: {
    background: '#fffbeb',
    borderColor: '#d97706',
    border: '1px solid #fef3c7',
    borderLeft: '5px solid #d97706'
  },
  cardError: {
    background: '#fef2f2',
    borderColor: '#dc2626',
    border: '1px solid #fee2e2',
    borderLeft: '5px solid #dc2626'
  },
  cardSuccess: {
    background: '#f0fdf4',
    borderColor: '#16a34a',
    border: '1px solid #dcfce7',
    borderLeft: '5px solid #16a34a'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  statusIconYellow: { fontSize: '1.25rem' },
  statusIconRed: { fontSize: '1.25rem' },
  statusIconGreen: { fontSize: '1.25rem' },
  statusTitleDark: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  statusTitleGreen: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#14532d'
  },
  statusDescription: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#475569',
    lineHeight: '1.5'
  },
  
  /* SUCCESS DETAILS OVERVIEW CORES */
  successMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '15px',
    padding: '15px 0',
    borderTop: '1px solid #dcfce7',
    borderBottom: '1px solid #dcfce7'
  },
  metaColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  metaRow: {
    margin: 0,
    fontSize: '0.925rem',
    color: '#1e293b'
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '18px'
  },
  btnActionPrimary: {
    background: '#16a34a',
    color: '#ffffff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
    transition: 'background 0.2s'
  },
  btnActionSecondary: {
    background: '#ffffff',
    color: '#334155',
    padding: '10px 20px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.875rem',
    textDecoration: 'none',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },

  /* REPORT SCREEN STYLES PREVIEW PANEL */
  screenReportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '4px solid #1e3a8a',
    paddingBottom: '15px',
    marginBottom: '20px'
  },
  brandText: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#1e3a8a',
    margin: '0 0 2px 0',
    textTransform: 'uppercase'
  },
  brandSubText: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: '0 0 8px 0'
  },
  metaText: {
    fontSize: '0.85rem',
    color: '#334155',
    margin: '0 0 3px 0'
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
    background: '#f8fafc',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    marginBottom: '25px'
  },
  demoBox: {
    fontSize: '0.9rem',
    color: '#1e293b'
  },
  masterWrapper: {
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    background: '#eff6ff',
    marginBottom: '25px',
    overflow: 'hidden',
    paddingBottom: '10px'
  },
  masterBanner: {
    padding: '12px 20px',
    background: '#bfdbfe',
    color: '#1e3a8a',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: '0.925rem',
    letterSpacing: '0.05em',
    textAlign: 'center'
  },
  categoryHeading: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#1e293b',
    textTransform: 'uppercase',
    margin: '15px 15px 8px 15px'
  },
  screenTable: {
    width: 'calc(100% - 30px)',
    margin: '0 15px',
    borderCollapse: 'collapse',
    background: '#ffffff',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  screenThRow: {
    background: '#f1f5f9',
    borderBottom: '2px solid #cbd5e1'
  },
  screenTh: {
    padding: '10px 12px',
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#475569',
    textAlign: 'left'
  },
  screenTr: {
    borderBottom: '1px solid #f1f5f9'
  },
  screenTd: {
    padding: '10px 12px',
    fontSize: '0.9rem',
    color: '#0f172a',
    verticalAlign: 'top'
  },
  screenResultCell: {
    textAlign: 'center',
    fontWeight: '800',
    color: '#1e3a8a',
    fontSize: '0.95rem'
  },
  endMarker: {
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginTop: '30px'
  }
};