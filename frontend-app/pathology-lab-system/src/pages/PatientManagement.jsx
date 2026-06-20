import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';

export default function PatientManagement() {
  // Core States
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Notification Toast State
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });

  // Modal Control States
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null); // null = Add, Object = Edit
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});

  // Confirmation Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  // Load Data on Mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const triggerToast = (type, text) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: 'success', text: '' }), 4000);
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // FIX: Changed from '/api/patients' to '/patients' to prevent duplication with Axios baseURL
      const res = await api.get('/patients');
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Could not establish connection to server database.');
    } finally {
      setLoading(false);
    }
  };

  // Real-Time Query Filtering (Name and Phone Match)
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const term = search.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(term);
      const phoneMatch = p.phone?.includes(term);
      return nameMatch || phoneMatch;
    });
  }, [patients, search]);

  // Premium Dashboard Analytics Calculators
  const stats = useMemo(() => {
    const total = patients.length;
    const male = patients.filter((p) => p.gender?.toLowerCase() === 'male').length;
    const female = patients.filter((p) => p.gender?.toLowerCase() === 'female').length;
    const others = total - (male + female);
    return { total, male, female, others };
  }, [patients]);

  // Pagination Splitting Control
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;

  // Reset page point if filters render active page empty
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredPatients, totalPages, currentPage]);

  // Input Validation Logic
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Patient name field is required.';
    if (!form.age || Number(form.age) <= 0 || Number(form.age) > 125) {
      errors.age = 'Enter a valid biological age (1-125).';
    }
    if (!form.gender) errors.gender = 'Please select a gender.';
    
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.phone = 'Requires a valid mobile number (min 10 digits).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setCurrentPatient(null);
    setForm({ name: '', age: '', gender: '', phone: '' });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEdit = (patient) => {
    setCurrentPatient(patient);
    setForm({
      name: patient.name || '',
      age: patient.age || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      age: parseInt(form.age, 10),
      gender: form.gender,
      phone: form.phone.trim(),
    };

    try {
      if (currentPatient) {
        // FIX: Removed duplicate '/api' segment from endpoint route path
        await api.put(`/patients/${currentPatient.patientId}`, payload);
        triggerToast('success', `Patient "${payload.name}" updated successfully.`);
      } else {
        // FIX: Removed duplicate '/api' segment from endpoint route path
        await api.post('/patients', payload);
        triggerToast('success', `New patient record created for "${payload.name}".`);
      }
      setShowFormModal(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Failed to commit patient transaction logs.');
    }
  };

  const handleOpenDelete = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      // FIX: Removed duplicate '/api' segment from endpoint route path
      await api.delete(`/patients/${patientToDelete.patientId}`);
      triggerToast('success', 'Patient clinical file purged successfully.');
      setShowDeleteModal(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Execution blocked. Record context may be linked to live lab logs.');
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* TOAST SYSTEM ACCORD */}
      {toast.show && (
        <div style={{ ...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess) }}>
          <div style={styles.toastContent}>
            {toast.type === 'error' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
            <span style={{ marginLeft: '10px', fontWeight: '500' }}>{toast.text}</span>
          </div>
        </div>
      )}

      {/* METRIC ANALYTICS ROW */}
      <div style={styles.metricsRow}>
        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <div style={styles.metricLabel}>Total Registrations</div>
            <div style={styles.metricValue}>{loading ? '...' : stats.total}</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(37, 99, 235, 0.15)', color: '#2563eb' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v14"></path><path d="M12 2l4 4"></path><path d="M12 2L8 6"></path></svg>
          </div>
          <div>
            <div style={styles.metricLabel}>Male Census</div>
            <div style={styles.metricValue}>{loading ? '...' : stats.male}</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="8"></circle><path d="M12 18v6"></path><path d="M9 21h6"></path></svg>
          </div>
          <div>
            <div style={styles.metricLabel}>Female Census</div>
            <div style={styles.metricValue}>{loading ? '...' : stats.female}</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5"></path><path d="M12 2a5 5 0 1 0 0 10 5 5 0 1 0 0-10z"></path></svg>
          </div>
          <div>
            <div style={styles.metricLabel}>Other Mix</div>
            <div style={styles.metricValue}>{loading ? '...' : stats.others}</div>
          </div>
        </div>
      </div>

      {/* WORKSPACE OPERATIONS CONTEXT */}
      <div style={styles.glassPanel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>Laboratory Patient Registry</h2>
            <p style={styles.panelSubtitle}>Manage master records, identity indexes, and operational clinical profiles</p>
          </div>
          <button style={styles.btnPrimary} onClick={handleOpenAdd}>
            <svg style={{ marginRight: '8px' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Admit New Patient
          </button>
        </div>

        {/* SEARCH AND CONTROL LINE */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <svg style={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Query logs by patient name or digital mobile number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* CORE DATA DISPLAY SECTION */}
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={{ ...styles.th, width: '100px' }}>Patient ID</th>
                <th style={styles.th}>Full Name</th>
                <th style={{ ...styles.th, width: '100px' }}>Age</th>
                <th style={{ ...styles.th, width: '140px' }}>Gender Context</th>
                <th style={styles.th}>Mobile Link</th>
                <th style={{ ...styles.th, width: '160px', textAlign: 'center' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} style={styles.tr}>
                    <td style={styles.td}><div style={styles.skeleton}></div></td>
                    <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }}></div></td>
                    <td style={styles.td}><div style={{ ...styles.skeleton, width: '40%' }}></div></td>
                    <td style={styles.td}><div style={{ ...styles.skeleton, width: '50%' }}></div></td>
                    <td style={styles.td}><div style={{ ...styles.skeleton, width: '60%' }}></div></td>
                    <td style={styles.td}><div style={{ ...styles.skeleton, width: '80%', margin: '0 auto' }}></div></td>
                  </tr>
                ))
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyStateContainer}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '12px' }}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    <div style={styles.emptyStateTitle}>No Records Found</div>
                    <div style={styles.emptyStateSubtitle}>Adjust filter parameters or check connection logs.</div>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => (
                  <tr key={p.patientId} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#64748b' }}>
                      #{String(p.patientId).padStart(4, '0')}
                    </td>
                    <td style={{ ...styles.td, color: '#0f172a', fontWeight: '500' }}>{p.name}</td>
                    <td style={styles.td}>{p.age} Yrs</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(p.gender?.toLowerCase() === 'male' ? styles.badgeMale : p.gender?.toLowerCase() === 'female' ? styles.badgeFemale : styles.badgeOther)
                      }}>
                        {p.gender}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', letterSpacing: '0.3px' }}>{p.phone}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={styles.actionButtonGroup}>
                        <button style={styles.btnActionEdit} onClick={() => handleOpenEdit(p)} title="Edit Record">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                        </button>
                        <button style={styles.btnActionDelete} onClick={() => handleOpenDelete(p)} title="Delete Record">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION INTERACTION CONTROLS */}
        {!loading && filteredPatients.length > 0 && (
          <div style={styles.paginationFooter}>
            <div style={styles.paginationDetails}>
              Showing <strong style={{ color: '#0f172a' }}>{Math.min(filteredPatients.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to{' '}
              <strong style={{ color: '#0f172a' }}>{Math.min(filteredPatients.length, currentPage * itemsPerPage)}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{filteredPatients.length}</strong> index files
            </div>
            <div style={styles.paginationButtons}>
              <button
                style={{ ...styles.btnPager, ...(currentPage === 1 ? styles.btnPagerDisabled : {}) }}
                onClick={() => setCurrentPage(c => Math.max(c - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={`page-${pageNum}`}
                    style={{ ...styles.btnPagerNum, ...(currentPage === pageNum ? styles.btnPagerNumActive : {}) }}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                style={{ ...styles.btnPager, ...(currentPage === totalPages ? styles.btnPagerDisabled : {}) }}
                onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT GLASSMOPHISM FORM MODAL CONTAINER */}
      {showFormModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{currentPatient ? 'Modify Clinical Intake Card' : 'New Patient Diagnostic Registration'}</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowFormModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Full Legal Name</label>
                <input
                  type="text"
                  style={{ ...styles.formInput, ...(formErrors.name ? styles.formInputError : {}) }}
                  placeholder="e.g. Johnathan Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <p style={styles.errorText}>{formErrors.name}</p>}
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Biological Age</label>
                  <input
                    type="number"
                    style={{ ...styles.formInput, ...(formErrors.age ? styles.formInputError : {}) }}
                    placeholder="e.g. 34"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                  {formErrors.age && <p style={styles.errorText}>{formErrors.age}</p>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Gender Designation</label>
                  <select
                    style={{ ...styles.formInput, ...styles.formSelect, ...(formErrors.gender ? styles.formInputError : {}) }}
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">-- Choose Option --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.gender && <p style={styles.errorText}>{formErrors.gender}</p>}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Primary Mobile Connection</label>
                <input
                  type="tel"
                  style={{ ...styles.formInput, ...(formErrors.phone ? styles.formInputError : {}) }}
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {formErrors.phone && <p style={styles.errorText}>{formErrors.phone}</p>}
              </div>

              <div style={styles.modalActionWrapper}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowFormModal(false)}>
                  Cancel Execution
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  {currentPatient ? 'Commit Revisions' : 'Register File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESTRUCTIVE ACTION VERIFICATION MODAL */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '440px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.modalTitle, color: '#991b1b' }}>Confirm Destructive Purge</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div style={{ padding: '20px 0' }}>
              <p style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
                You are about to irreversibly purge patient <strong>{patientToDelete?.name}</strong> from the laboratory database indexes. This process cannot be undone.
              </p>
            </div>
            <div style={styles.modalActionWrapper}>
              <button style={styles.btnSecondary} onClick={() => setShowDeleteModal(false)}>
                Abort
              </button>
              <button style={{ ...styles.btnPrimary, background: '#dc2626' }} onClick={confirmDelete}>
                Purge Record File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  dashboardContainer: {
    padding: '30px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    background: 'rgba(255, 255, 255, 0.70)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
    transition: 'transform 0.2s ease',
  },
  metricIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
  },
  metricLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
  },
  glassPanel: {
    background: 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '24px',
    padding: '30px',
    boxShadow: '0 10px 40px -10px rgba(31, 38, 135, 0.06)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '24px',
  },
  panelTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  panelSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    color: '#ffffff',
    padding: '12px 22px',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    background: '#e2e8f0',
    color: '#334155',
    padding: '12px 22px',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  searchContainer: {
    marginBottom: '20px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(203, 213, 225, 0.7)',
    borderRadius: '14px',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.5)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  thRow: {
    background: 'rgba(241, 245, 249, 0.8)',
  },
  th: {
    padding: '16px 20px',
    fontWeight: '600',
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
    textTransform: 'uppercase',
    fontSize: '11px',
    letterSpacing: '0.6px',
  },
  tr: {
    borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '16px 20px',
    color: '#334155',
    verticalAlign: 'middle',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  // FIX: Converted broken rgba string templates into standard valid CSS hex mappings
  badgeMale: { background: '#dbeafe', color: '#1e40af' },
  badgeFemale: { background: '#fce7f3', color: '#9d174d' },
  badgeOther: { background: '#f3e8ff', color: '#6b21a8' },
  actionButtonGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  btnActionEdit: {
    background: 'rgba(241, 245, 249, 1)',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  btnActionDelete: {
    background: 'rgba(254, 226, 226, 0.7)',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  paginationFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  paginationDetails: {
    fontSize: '13px',
    color: '#64748b',
  },
  paginationButtons: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  btnPager: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#334155',
  },
  btnPagerDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  btnPagerNum: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPagerNumActive: {
    background: '#0284c7',
    color: '#ffffff',
    borderColor: '#0284c7',
    fontWeight: '600',
  },
  skeleton: {
    height: '16px',
    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '4px',
    width: '100%',
  },
  emptyStateContainer: {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#64748b',
  },
  emptyStateTitle: { fontSize: '16px', fontWeight: '600', color: '#334155' },
  emptyStateSubtitle: { fontSize: '13px', marginTop: '4px' },
  toast: {
    position: 'fixed',
    top: '30px',
    right: '30px',
    zIndex: 9999,
    padding: '16px 24px',
    borderRadius: '14px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(8px)',
  },
  toastSuccess: {
    background: 'rgba(22, 101, 52, 0.9)',
    color: '#f0fdf4',
    border: '1px solid rgba(74, 222, 128, 0.4)',
  },
  toastError: {
    background: 'rgba(153, 27, 27, 0.9)',
    color: '#fef2f2',
    border: '1px solid rgba(248, 113, 113, 0.4)',
  },
  toastContent: { display: 'flex', alignItems: 'center' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.35)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '20px',
  },
  modalContent: {
    background: 'rgba(255, 255, 255, 0.90)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    padding: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '14px',
  },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formLabel: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  formInput: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    background: '#ffffff',
    color: '#0f172a',
    transition: 'border-color 0.2s ease',
  },
  formInputError: { borderColor: '#ef4444' },
  formSelect: { WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' },
  errorText: { margin: '2px 0 0 0', color: '#ef4444', fontSize: '12px', fontWeight: '500' },
  modalActionWrapper: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }
};