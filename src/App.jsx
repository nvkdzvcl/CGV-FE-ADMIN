import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';

import DashboardPage from './pages/DashboardPage';
import MoviesAdminPage from './pages/MoviesAdminPage';
import CinemasAdminPage from './pages/CinemasAdminPage';
import ShowtimesAdminPage from './pages/ShowtimesAdminPage';
import BookingsAdminPage from './pages/BookingsAdminPage';
import PromotionsAdminPage from './pages/PromotionsAdminPage';
import UsersAdminPage from './pages/UsersAdminPage';
import PaymentsAdminPage from './pages/PaymentsAdminPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    fullName: 'Lê Hoàng Huy',
    email: 'admin@cgv.vn',
    role: 'ADMIN'
  });

  const handleLogout = () => {
    if (window.confirm('Bạn có muốn đăng xuất khỏi trang quản trị?')) {
      alert('Đã đăng xuất.');
    }
  };

  return (
    <Router>
      <div className="admin-shell">
        <AdminSidebar currentUser={currentUser} onLogout={handleLogout} />

        <div className="admin-main-wrapper">
          <AdminHeader currentUser={currentUser} />

          <main className="admin-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/movies" element={<MoviesAdminPage />} />
              <Route path="/cinemas" element={<CinemasAdminPage />} />
              <Route path="/showtimes" element={<ShowtimesAdminPage />} />
              <Route path="/bookings" element={<BookingsAdminPage />} />
              <Route path="/promotions" element={<PromotionsAdminPage />} />
              <Route path="/users" element={<UsersAdminPage />} />
              <Route path="/payments" element={<PaymentsAdminPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}