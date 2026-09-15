import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Film, Building2, CalendarDays,
  Ticket, Gift, Users, CreditCard, LogOut, ShieldAlert
} from 'lucide-react';

export default function AdminSidebar({ currentUser, onLogout }) {
  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <Film size={20} />
        </div>
        <div>
          <div className="brand-title">CGV Portal</div>
          <div className="brand-subtitle">Enterprise Admin</div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Tổng quan</div>
        <NavLink to="/" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <div className="nav-section-title">Vận hành rạp & Phim</div>
        <NavLink to="/movies" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Film size={18} />
          <span>Quản lý Phim</span>
        </NavLink>
        <NavLink to="/cinemas" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Building2 size={18} />
          <span>Cụm rạp & Phòng</span>
        </NavLink>
        <NavLink to="/showtimes" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={18} />
          <span>Lịch chiếu (Showtimes)</span>
        </NavLink>

        <div className="nav-section-title">Bán vé & Marketing</div>
        <NavLink to="/bookings" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Ticket size={18} />
          <span>Đơn vé & Soát vé QR</span>
        </NavLink>
        <NavLink to="/promotions" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Gift size={18} />
          <span>Voucher & Batch Job</span>
        </NavLink>

        <div className="nav-section-title">Hệ thống & Tài chính</div>
        <NavLink to="/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Người dùng & Quyền</span>
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <CreditCard size={18} />
          <span>Đối soát Thanh toán</span>
        </NavLink>
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="admin-avatar">
          {currentUser.fullName ? currentUser.fullName[0] : 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser.fullName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--admin-primary-hover)', fontWeight: 700 }}>
            {currentUser.role}
          </div>
        </div>
        <button onClick={onLogout} title="Đăng xuất" style={{ color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}