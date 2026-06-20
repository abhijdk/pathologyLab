import React, { useState, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // 👇 FIXED: Added /v1 to match your backend @RequestMapping("/api/v1/auth")
      const response = await api.post('/v1/auth/login', credentials);
      
      const { accessToken, user } = response.data; 

      const userRoles = user.roles ? user.roles.map(role => role.name) : [];
      
      login(accessToken, { 
        username: user.name, 
        email: user.email, 
        roles: userRoles 
      });
      
    } catch (err) {
      console.error("Login Error:", err);
      // Optional: Prevent the Axios interceptor from refreshing the page on a bad password
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>HealthStack Diagnostics</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              value={credentials.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              value={credentials.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;