import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
        <h2>HealthStack Diagnostics</h2>
      </div>
      <div className="header-right">
        <div>
          <span style={{ marginRight: '10px' }}>{user?.username}</span>
          <span className={`badge ${user?.roles?.includes('ADMIN') ? 'admin' : ''}`}>
            {user?.roles?.join(', ')}
          </span>
        </div>
        <button className="btn-danger" onClick={logout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;