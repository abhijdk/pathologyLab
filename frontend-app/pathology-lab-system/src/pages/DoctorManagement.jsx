import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Modals & Forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null); // null = Add, object = Edit
  const [form, setForm] = useState({ name: '', commissionPercentage: 0 });

  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 0 });

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) { 
      setMessage({ type: 'error', text: 'Failed to fetch doctors.' }); 
    }
    setLoading(false);
  };

  const filteredDoctors = useMemo(() => 
    doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase())), 
    [doctors, search]
  );

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentDoctor) {
        await api.put(`/doctors/${currentDoctor.doctorId}`, { ...currentDoctor, ...form });
        setMessage({ type: 'success', text: 'Doctor updated successfully!' });
      } else {
        await api.post('/doctors', form);
        setMessage({ type: 'success', text: 'Doctor added successfully!' });
      }
      fetchDoctors();
      setShowFormModal(false);
      resetForm();
    } catch (err) { 
      setMessage({ type: 'error', text: 'Operation failed.' }); 
    }
  };

  const resetForm = () => {
    setForm({ name: '', commissionPercentage: 0 });
    setCurrentDoctor(null);
  };

  const openEdit = (d) => {
    setCurrentDoctor(d);
    setForm({ name: d.name, commissionPercentage: d.commissionPercentage });
    setShowFormModal(true);
  };

  const handlePay = async () => {
    // 1. Validate the input
    const paymentAmount = Number(payForm.amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid payment amount.' });
      return;
    }

    try {
      // 2. Calculate the new received commission
      const updatedReceivedCommission = (currentDoctor.receivedCommission || 0) + paymentAmount;
      
      // 3. Create the updated doctor payload
      const updatedDoctor = {
        ...currentDoctor,
        receivedCommission: updatedReceivedCommission
      };

      // 4. Make the PUT request to update the database
      await api.put(`/doctors/${currentDoctor.doctorId}`, updatedDoctor);

      // 5. Update UI on success
      setMessage({ type: 'success', text: `Payment of ₹${paymentAmount} processed successfully.` });
      setShowPayModal(false);
      setPayForm({ amount: 0 }); // Reset the form
      
      // 6. Refresh the doctor list from the database
      fetchDoctors();
      
    } catch (err) {
      console.error("Payment error:", err);
      setMessage({ type: 'error', text: 'Failed to process payment in the database.' });
    }
  };

  return (
    <div className="card">
      <div style={styles.header}>
        <h2>Doctor Management</h2>
        <button style={styles.btnPrimary} onClick={() => { resetForm(); setShowFormModal(true); }}>+ Add Doctor</button>
      </div>

      {/* MESSAGE DISPLAY */}
      {message.text && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '6px', 
          background: message.type === 'error' ? '#fee2e2' : '#dcfce3', 
          color: message.type === 'error' ? '#991b1b' : '#166534' 
        }}>
          {message.text}
        </div>
      )}

      <input style={styles.search} placeholder="Search doctor by name..." onChange={e => setSearch(e.target.value)} />

      <table style={styles.table}>
        <thead>
          <tr style={styles.thRow}>
            <th>ID</th><th>Name</th><th>Comm %</th><th>Total</th><th>Received</th><th>Pending</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDoctors.map(d => {
            const total = d.totalCommission || 0;
            const received = d.receivedCommission || 0;
            const pending = total - received;
            
            return (
              <tr key={d.doctorId} style={styles.tr}>
                <td>#{d.doctorId}</td>
                <td>{d.name}</td>
                <td>{d.commissionPercentage}%</td>
                <td>₹{total.toFixed(2)}</td>
                <td style={{color: 'green'}}>₹{received.toFixed(2)}</td>
                <td style={{color: pending > 0 ? 'red' : 'green'}}>₹{pending.toFixed(2)}</td>
                <td>
                  <button style={styles.btnSm} onClick={() => openEdit(d)}>Edit</button>
                  <button style={{...styles.btnSm, background: 'var(--primary-color)'}} onClick={() => {setCurrentDoctor(d); setShowPayModal(true);}}>Pay</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* FORM MODAL */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={currentDoctor ? "Edit Doctor" : "Add Doctor"}>
        <form onSubmit={handleSave} style={styles.modalForm}>
          <input required placeholder="Doctor Name" style={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input required type="number" min="0" max="100" placeholder="Commission %" style={styles.input} value={form.commissionPercentage} onChange={e => setForm({...form, commissionPercentage: e.target.value})} />
          <button type="submit" style={styles.btnPrimary}>Save Doctor</button>
        </form>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Doctor Payment">
        {currentDoctor && (
          <div style={styles.modalForm}>
            <p><strong>Doctor:</strong> {currentDoctor.name}</p>
            <p><strong>Pending Balance:</strong> ₹{((currentDoctor.totalCommission || 0) - (currentDoctor.receivedCommission || 0)).toFixed(2)}</p>
            <input type="number" style={styles.input} placeholder="Enter Amount" onChange={e => setPayForm({amount: e.target.value})} />
            
            {payForm.amount > ((currentDoctor.totalCommission || 0) - (currentDoctor.receivedCommission || 0)) && (
              <p style={{color: 'red'}}>⚠ Advance Payment: Exceeds by ₹{payForm.amount - ((currentDoctor.totalCommission || 0) - (currentDoctor.receivedCommission || 0))}</p>
            )}
            
            <button style={styles.btnPrimary} onClick={handlePay}>Confirm Payment</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  search: { padding: '10px', width: '100%', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ccc' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { background: '#f8fafc' },
  th: { padding: '12px' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px' },
  btnPrimary: { background: '#0284c7', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnSm: { margin: '0 5px', padding: '5px 10px', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }
};