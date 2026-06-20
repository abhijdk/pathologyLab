import React from 'react';
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.box} onClick={e => e.stopPropagation()}>
        <div style={styles.header}><h3>{title}</h3><button onClick={onClose} style={styles.close}>&times;</button></div>
        {children}
      </div>
    </div>
  );
};
const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  close: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }
};
export default Modal;