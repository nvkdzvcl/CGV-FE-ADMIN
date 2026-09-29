import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminLoginScreen from './components/AdminLoginScreen';
import { getAdminUser, getAdminToken, clearAdminSession } from './services/adminApi';

import DashboardPage from './pages/DashboardPage';
import MoviesAdminPage from './pages/MoviesAdminPage';
import CinemasAdminPage from './pages/CinemasAdminPage';
import ShowtimesAdminPage from './pages/ShowtimesAdminPage';
import BookingsAdminPage from './pages/BookingsAdminPage';
import PromotionsAdminPage from './pages/PromotionsAdminPage';
import UsersAdminPage from './pages/UsersAdminPage';
import PaymentsAdminPage from './pages/PaymentsAdminPage';
import RolesAdminPage from './pages/RolesAdminPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = getAdminToken();
    const user = getAdminUser();
    return token && user ? user : null;
  });

  const handleLogout = () => {
    if (window.confirm('Bạn có muốn đăng xuất khỏi trang quản trị?')) {
      clearAdminSession();
      setCurrentUser(null);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // If not logged in, force full login screen
  if (!currentUser) {
    return <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const role = currentUser.role || 'TICKET_STAFF';
  const roles = currentUser.roles || [role];
  const isSuperAdmin = role === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
  const isCinemaManager = role === 'CINEMA_MANAGER' || roles.includes('CINEMA_MANAGER') || isSuperAdmin;
  const isStaff = role === 'TICKET_STAFF' || roles.includes('TICKET_STAFF');

  return (
    <Router>
      <div className="admin-shell">
        <AdminSidebar
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <div className="admin-main-wrapper">
          <AdminHeader
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          <main className="admin-content">
            <Routes>
              {/* Default landing: Staff goes to /bookings, Managers/Admins go to / */}
              <Route
                path="/"
                element={isStaff && !isCinemaManager ? <Navigate to="/bookings" replace /> : <DashboardPage />}
              />
              <Route
                path="/movies"
                element={isCinemaManager ? <MoviesAdminPage /> : <Navigate to="/bookings" replace />}
              />
              <Route
                path="/cinemas"
                element={isCinemaManager ? <CinemasAdminPage /> : <Navigate to="/bookings" replace />}
              />
              <Route
                path="/showtimes"
                element={isCinemaManager ? <ShowtimesAdminPage /> : <Navigate to="/bookings" replace />}
              />
              <Route path="/bookings" element={<BookingsAdminPage />} />
              <Route
                path="/promotions"
                element={isCinemaManager || roles.includes('MARKETING') ? <PromotionsAdminPage /> : <Navigate to="/bookings" replace />}
              />
              <Route
                path="/users"
                element={isSuperAdmin ? <UsersAdminPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="/roles"
                element={isSuperAdmin ? <RolesAdminPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="/payments"
                element={isCinemaManager ? <PaymentsAdminPage /> : <Navigate to="/" replace />}
              />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}