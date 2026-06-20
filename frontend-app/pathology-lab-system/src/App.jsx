import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Registration from './pages/Registration';
import DoctorManagement from './pages/DoctorManagement';
import PatientManagement from './pages/PatientManagement';
import TestManagement from './pages/TestManagement';
import Consumables from './pages/Consumables';
import NonConsumables from './pages/NonConsumables';
import Finance from './pages/Finance';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import NewBooking from './pages/NewBooking';
import PatientReport from './pages/PatientReport';
import ViewAllUser from './pages/ViewAllUser';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
        <Route path="/patientreport" element={<PatientReport />} />
      
      {/* Protected Routes Wrapper */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="bookings" element={<NewBooking />} />
        <Route path="reports" element={<Reports />} />
        <Route path="doctors" element={<DoctorManagement />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="tests" element={<TestManagement />} />
        <Route path="consumables" element={<Consumables />} />
        <Route path="non-consumables" element={<NonConsumables />} />
        <Route path="finance" element={<Finance />} />
        <Route path='vendors' element={<Vendors />} />
        
        {/* Admin Only Route */}
        <Route path="register" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Registration />
          </ProtectedRoute>
        } />

        
        <Route path="viewAllUser" element={
          <ProtectedRoute requiredRole="ADMIN">
            <ViewAllUser />
          </ProtectedRoute>
        } />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;