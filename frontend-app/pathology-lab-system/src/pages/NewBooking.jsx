import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function NewBooking() {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [testMasters, setTestMasters] = useState([]);
  
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', categoryIds: [], advanceAmount: 0 });
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  
  const [showPatientList, setShowPatientList] = useState(false);
  const [showDoctorList, setShowDoctorList] = useState(false);
  
  // Modal toggle visibility states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Unified data sync fetching routine
  const fetchData = async () => {
    try {
      const [patRes, docRes, testRes] = await Promise.all([
        api.get('/patients'), 
        api.get('/doctors'), 
        api.get('/tests')
      ]);
      setPatients(patRes.data);
      setDoctors(docRes.data);
      setTestMasters(testRes.data);
    } catch (err) { 
      setMessage({ type: 'error', text: 'Failed to load master dataset logs.' }); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPatients = useMemo(() => 
    patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone.includes(patientSearch)), 
    [patients, patientSearch]
  );
  
  const filteredDoctors = useMemo(() => 
    doctors.filter(d => d.name.toLowerCase().includes(doctorSearch.toLowerCase())), 
    [doctors, doctorSearch]
  );

  // Auto-linking handlers to pick up newly added entries and immediately select them
  const handlePatientSaved = async (newPatient) => {
    await fetchData(); // Refresh local list state
    setFormData(prev => ({ ...prev, patientId: newPatient.patientId }));
    setPatientSearch(`${newPatient.name} (${newPatient.phone})`);
    setMessage({ type: 'success', text: `Patient "${newPatient.name}" auto-selected successfully.` });
  };

  const handleDoctorSaved = async (newDoctor) => {
    await fetchData(); // Refresh local list state
    setFormData(prev => ({ ...prev, doctorId: newDoctor.doctorId }));
    setDoctorSearch(newDoctor.name);
    setMessage({ type: 'success', text: `Doctor "${newDoctor.name}" auto-selected successfully.` });
  };

  const totalAmount = useMemo(() => {
    const allCats = testMasters.flatMap(m => m.categories || []);
    return formData.categoryIds.reduce((sum, id) => sum + (allCats.find(c => c.categoryId === id)?.amount || 0), 0);
  }, [formData.categoryIds, testMasters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Basic Selections Validations
    if (!formData.patientId || !formData.doctorId) {
      setMessage({ type: 'error', text: 'Please select a valid patient and doctor before confirming.' });
      return;
    }
    if (formData.categoryIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one lab test variant.' });
      return;
    }

    // 2. Advance Payment Amount Cap Validation
    if (Number(formData.advanceAmount) > totalAmount) {
      setMessage({ 
        type: 'error', 
        text: `Advance amount cannot be greater than the gross total amount (₹${totalAmount.toFixed(2)}).` 
      });
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/bookings/save', { 
        ...formData, 
        patientId: parseInt(formData.patientId, 10), 
        doctorId: parseInt(formData.doctorId, 10),
        advanceAmount: Number(formData.advanceAmount)
      });
      setMessage({ type: 'success', text: 'Booking Created Successfully!' });
      setTimeout(() => navigate('/home'), 1000);
    } catch (err) { 
      setMessage({ type: 'error', text: 'Failed to commit diagnostic booking instance.' }); 
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Master Directories...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#0284c7', marginBottom: '20px' }}>Create New Booking</h2>
      
      {message.text && (
        <div style={{
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px', 
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#991b1b' : '#166534',
          fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.grid}>
        {/* Patient Selection Card Dropdown */}
        <div style={styles.card}>
          <label style={styles.label}>Patient Information *</label>
          <input 
            style={styles.input} 
            placeholder="Search Name or Mobile..." 
            value={patientSearch} 
            onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }} 
          />
          {showPatientList && patientSearch && (
            <div style={styles.dropdown}>
              {filteredPatients.length === 0 ? (
                <div style={styles.dropItem}>No patients match criteria</div>
              ) : (
                filteredPatients.map(p => (
                  <div 
                    key={p.patientId} 
                    style={styles.dropItem} 
                    onClick={() => {
                      setPatientSearch(`${p.name} (${p.phone})`); 
                      setFormData({ ...formData, patientId: p.patientId }); 
                      setShowPatientList(false);
                    }}
                  >
                    {p.name} - ({p.phone})
                  </div>
                ))
              )}
            </div>
          )}
          <button type="button" style={styles.linkBtn} onClick={() => setShowPatientModal(true)}>
            + Add New Patient Record
          </button>
        </div>

        {/* Doctor Selection Card Dropdown */}
        <div style={styles.card}>
          <label style={styles.label}>Referring Doctor *</label>
          <input 
            style={styles.input} 
            placeholder="Search Doctor..." 
            value={doctorSearch} 
            onChange={e => { setDoctorSearch(e.target.value); setShowDoctorList(true); }} 
          />
          {showDoctorList && doctorSearch && (
            <div style={styles.dropdown}>
              {filteredDoctors.length === 0 ? (
                <div style={styles.dropItem}>No matching doctor configurations</div>
              ) : (
                filteredDoctors.map(d => (
                  <div 
                    key={d.doctorId} 
                    style={styles.dropItem} 
                    onClick={() => {
                      setDoctorSearch(d.name); 
                      setFormData({ ...formData, doctorId: d.doctorId }); 
                      setShowDoctorList(false);
                    }}
                  >
                    {d.name}
                  </div>
                ))
              )}
            </div>
          )}
          <button type="button" style={styles.linkBtn} onClick={() => setShowDoctorModal(true)}>
            + Add New Referral Doctor
          </button>
        </div>

        {/* Test Matrix Multi-Selection Chips */}
        <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
          <label style={styles.label}>Select Assays & Test Profiles *</label>
          {testMasters.map(m => (
            <div key={m.testId} style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '8px', color: '#334155' }}>{m.testName}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {m.categories?.map(c => {
                  const isSelected = formData.categoryIds.includes(c.categoryId);
                  return (
                    <button 
                      type="button" 
                      key={c.categoryId} 
                      style={isSelected ? styles.chipActive : styles.chip} 
                      onClick={() => setFormData({
                        ...formData, 
                        categoryIds: isSelected 
                          ? formData.categoryIds.filter(id => id !== c.categoryId) 
                          : [...formData.categoryIds, c.categoryId]
                      })}
                    >
                      {c.categoryName} <span style={{ fontSize: '0.85em', marginLeft: '6px', opacity: 0.9 }}>₹{c.amount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Financial Billing Block Container */}
        <div style={{ ...styles.card, gridColumn: '1 / -1', background: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Billing & Ledger Settlement</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginTop: '15px' }}>
            <p style={{ margin: 0 }}>Gross Balance: <strong>₹{totalAmount.toFixed(2)}</strong></p>
            <p style={{ margin: 0 }}>
              Advance Paid: 
              <input 
                type="number" 
                min="0"
                style={styles.inputSmall} 
                value={formData.advanceAmount} 
                onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })} 
              />
            </p>
            <p style={{ margin: 0, color: (totalAmount - formData.advanceAmount) > 0 ? '#ef4444' : '#166534' }}>
              Pending Balance: <strong>₹{(totalAmount - formData.advanceAmount).toFixed(2)}</strong>
            </p>
          </div>
          <button type="submit" style={styles.submitBtn} disabled={submitLoading}>
            {submitLoading ? 'Creating Ledger Entries...' : 'Confirm Diagnostics Booking'}
          </button>
        </div>
      </form>

      {/* EMBEDDED MODAL SUITE */}
      <AddPatientModal 
        isOpen={showPatientModal} 
        onClose={() => setShowPatientModal(false)} 
        onSaveSuccess={handlePatientSaved}
        triggerToast={(type, text) => setMessage({ type, text })}
      />

      <DoctorFormModal 
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        onSaveSuccess={handleDoctorSaved}
        setMessage={setMessage}
      />
    </div>
  );
}

// ==========================================
// INTEGRATED MODAL ONE: PATIENT SUB-COMPONENT
// ==========================================
function AddPatientModal({ isOpen, onClose, onSaveSuccess, triggerToast }) {
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', age: '', gender: '', phone: '' });
      setFormErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Patient name field is required.';
    if (!form.age || Number(form.age) <= 0 || Number(form.age) > 125) errors.age = 'Enter a valid biological age (1-125).';
    if (!form.gender) errors.gender = 'Please select a gender.';
    
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) errors.phone = 'Requires a valid mobile number (min 10 digits).';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
      const res = await api.post('/patients', payload);
      if (triggerToast) triggerToast('success', `New patient record created for "${payload.name}".`);
      onSaveSuccess(res.data); // Passes data entity back up to auto-select
      onClose();
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('error', 'Failed to commit patient transaction logs.');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>New Patient Diagnostic Registration</h3>
          <button type="button" style={styles.modalCloseBtn} onClick={onClose}>✕</button>
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
                style={{ ...styles.formInput, ...(formErrors.gender ? styles.formInputError : {}) }}
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
            <button type="button" style={styles.btnSecondary} onClick={onClose}>Cancel Execution</button>
            <button type="submit" style={styles.btnPrimary}>Register File</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// INTEGRATED MODAL TWO: DOCTOR SUB-COMPONENT
// ==========================================
function DoctorFormModal({ isOpen, onClose, onSaveSuccess, setMessage }) {
  const [form, setForm] = useState({ name: '', commissionPercentage: 0 });

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', commissionPercentage: 0 });
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/doctors', form);
      if (setMessage) setMessage({ type: 'success', text: 'Doctor added successfully!' });
      onSaveSuccess(res.data); // Passes data entity back up to auto-select
      onClose();
    } catch (err) {
      console.error(err);
      if (setMessage) setMessage({ type: 'error', text: 'Operation failed to write profile logs.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>New Doctor Referral Registration</h3>
          <button type="button" style={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} style={styles.modalForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Full Professional Name</label>
            <input 
              required 
              placeholder="e.g. Dr. Jane Smith" 
              style={styles.formInput} 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Commission Rate (%)</label>
            <input 
              required 
              type="number" 
              min="0" 
              max="100" 
              placeholder="Commission %" 
              style={styles.formInput} 
              value={form.commissionPercentage} 
              onChange={e => setForm({ ...form, commissionPercentage: e.target.value })} 
            />
          </div>

          <div style={styles.modalActionWrapper}>
            <button type="button" style={styles.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.btnPrimary}>Register Doctor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// MASTER STYLES ARCHITECTURE SHEET
// ==========================================
const styles = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { position: 'relative', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  input: { padding: '12px', width: '100%', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' },
  inputSmall: { padding: '6px 10px', width: '90px', borderRadius: '6px', border: '1px solid #cbd5e1', marginLeft: '8px', fontSize: '14px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' },
  dropdown: { position: 'absolute', background: '#fff', width: 'calc(100% - 40px)', border: '1px solid #cbd5e1', zIndex: 100, borderRadius: '6px', maxHeight: '150px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  dropItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155', transition: 'background 0.2s' },
  linkBtn: { background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold', padding: 0, fontSize: '13px' },
  chip: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', background: '#fff', color: '#334155', transition: 'all 0.2s', fontWeight: '500' },
  chipActive: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #0284c7', cursor: 'pointer', background: '#0284c7', color: '#fff', fontWeight: '500' },
  submitBtn: { padding: '12px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', marginTop: '15px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', width: '100%' },
  
  // Custom Viewport Portal Overlay Mock-styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' },
  modalContent: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', fontFamily: 'inherit' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 },
  modalCloseBtn: { background: 'none', border: 'none', fontSize: '16px', color: '#94a3b8', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formLabel: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  formInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#ffffff', color: '#0f172a', width: '100%', boxSizing: 'border-box' },
  formInputError: { borderColor: '#ef4444' },
  errorText: { margin: '2px 0 0 0', color: '#ef4444', fontSize: '12px', fontWeight: '500' },
  modalActionWrapper: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
  btnPrimary: { background: '#0284c7', color: '#ffffff', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  btnSecondary: { background: '#e2e8f0', color: '#334155', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }
};