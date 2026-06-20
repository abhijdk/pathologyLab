import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { hasRole } = useContext(AuthContext);

  const getActive = ({ isActive }) => (isActive ? 'nav-item active' : 'nav-item');

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <ul className="nav-menu">
          <li><NavLink to="/home" className={getActive} onClick={closeSidebar}>Dashboard</NavLink></li>
          <li><NavLink to="/bookings" className={getActive} onClick={closeSidebar}>New Booking</NavLink></li>
          <li><NavLink to="/reports" className={getActive} onClick={closeSidebar}>Reports</NavLink></li>
          
          <div className="sidebar-section">Management</div>
          <li><NavLink to="/doctors" className={getActive} onClick={closeSidebar}>Doctor Management</NavLink></li>
          <li><NavLink to="/patients" className={getActive} onClick={closeSidebar}>Patient Management</NavLink></li>
          <li><NavLink to="/tests" className={getActive} onClick={closeSidebar}>Test Management</NavLink></li>
          
          <div className="sidebar-section">Inventory</div>
          <li><NavLink to="/consumables" className={getActive} onClick={closeSidebar}>Consumables</NavLink></li>
          <li><NavLink to="/non-consumables" className={getActive} onClick={closeSidebar}>Non Consumables</NavLink></li>
          <li><NavLink to="/finance" className={getActive} onClick={closeSidebar}>Finance</NavLink></li>
          <li><NavLink to="/Vendors" className={getActive} onClick={closeSidebar}> Vendor'S </NavLink></li>
          
          {hasRole('ADMIN') && (
            <>
              <div className="sidebar-section">Admin Access</div>
              <li><NavLink to="/register" className={getActive} onClick={closeSidebar}>Registration Page</NavLink></li>
              <li><NavLink to="/viewAllUser" className={getActive} onClick={closeSidebar}>View All Users</NavLink></li>
            </>
          )}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;