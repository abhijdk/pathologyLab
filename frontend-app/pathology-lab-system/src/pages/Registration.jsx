import React, { useState } from 'react';
// 1. Import your configured axios instance
import api from "../api/axiosConfig.jsx"; 

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER', 
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      enable: true,
      roles: [
        {
          name: formData.role,
        },
      ],
    };

    try {
      // 2. Use the 'api' instance. It will automatically attach the token.
      // Note: We only need the relative path if your baseURL is set in axiosConfig
      const response = await api.post('/v1/auth/register', payload);

      if (response.status === 201 || response.status === 200) {
        setMessage({ type: 'success', text: 'User registered successfully!' });
        setFormData({ name: '', email: '', password: '', role: 'USER' });
      }
    } catch (error) {
      // 3. Axios handles errors slightly differently than fetch
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        if (error.response.status === 401 || error.response.status === 403) {
          setMessage({ type: 'error', text: 'Unauthorized: Only admins can register new users.' });
        } else {
          setMessage({ type: 'error', text: error.response.data?.message || 'Registration failed. Please try again.' });
        }
      } else {
        // Network error or request never sent
        setMessage({ type: 'error', text: 'Network error. Could not connect to the server.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>Register New User</h2>
        
        {message.text && (
          <div style={message.type === 'error' ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="name" style={styles.label}>Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="e.g. John Doe"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="user@example.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="role" style={styles.label}>Assign Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="USER">Standard User</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            style={isLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {isLoading ? 'Registering...' : 'Register User'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontFamily: 'sans-serif' },
  card: { width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: '#fff' },
  header: { marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: '#333' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.9rem', fontWeight: 'bold', color: '#555' },
  input: { padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' },
  button: { padding: '0.75rem', borderRadius: '4px', border: 'none', backgroundColor: '#0056b3', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' },
  buttonDisabled: { backgroundColor: '#a0c4e8', cursor: 'not-allowed' },
  errorMsg: { padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.9rem' },
  successMsg: { padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: '#dcfce3', color: '#166534', fontSize: '0.9rem' }
};

export default Registration;