import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Film, Building2, CalendarDays,
  Ticket, Gift, Users, CreditCard, LogOut, ShieldCheck, UserCheck
} from 'lucide-react';

export default function AdminSidebar({ currentUser, onLogout }) {
  const role = currentUser?.role || 'TICKET_STAFF';
  const roles = currentUser?.roles || [role];

  const isSuperAdmin = role === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN');
  const isCinemaManager = role === 'CINEMA_MANAGER' || roles.includes('CINEMA_MANAGER') || isSuperAdmin;
  const isMarketing = role === 'MARKETING' || roles.includes('MARKETING') || isSuperAdmin;
  const isStaff = role === 'TICKET_STAFF' || roles.includes('TICKET_STAFF') || roles.includes('ticket:view') || isCinemaManager;

  const roleLabels = {
    'SUPER_ADMIN': '👑 SUPER ADMIN',
    'CINEMA_MANAGER': '🏢 CINEMA MANAGER',
    'TICKET_STAFF': '🎟️ TICKET STAFF',
    'MARKETING': '🎁 MARKETING'
  };

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
        {/* Dashboard: only for Manager, Marketing, SuperAdmin */}
        {(isSuperAdmin || isCinemaManager || isMarketing) && (
          <>
            <div className="nav-section-title">Tổng quan</div>
            <NavLink to="/" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </>
        )}

        {/* Catalog & Showtimes: only for Manager and SuperAdmin */}
        {(isSuperAdmin || isCinemaManager) && (
          <>
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
          </>
        )}

        {/* Bookings: visible to Staff, Manager, SuperAdmin */}
        {isStaff && (
          <>
            <div className="nav-section-title">Bán vé & Soát vé</div>
            <NavLink to="/bookings" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <Ticket size={18} />
              <span>Đơn vé & Soát vé QR</span>
            </NavLink>
          </>
        )}

        {/* Promotions: visible to Marketing, Manager, SuperAdmin */}
        {(isSuperAdmin || isCinemaManager || isMarketing) && (
          <>
            <div className="nav-section-title">Khuyến mãi</div>
            <NavLink to="/promotions" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <Gift size={18} />
              <span>Voucher & Batch Job</span>
            </NavLink>
          </>
        )}

        {/* Users & IAM: strictly SUPER_ADMIN */}
        {isSuperAdmin && (
          <>
            <div className="nav-section-title">Hệ thống & Phân quyền</div>
            <NavLink to="/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Người dùng & IAM</span>
            </NavLink>
            <NavLink to="/roles" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              <span>Vai trò & Phân quyền</span>
            </NavLink>
          </>
        )}

        {/* Payments: visible to Manager, SuperAdmin */}
        {(isSuperAdmin || isCinemaManager) && (
          <>
            <div className="nav-section-title">Tài chính & Cổng TT</div>
            <NavLink to="/payments" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <CreditCard size={18} />
              <span>Đối soát Thanh toán</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="admin-avatar">
          {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser.fullName}
          </div>
          <div style={{ fontSize: '0.72rem', color: isSuperAdmin ? 'var(--admin-primary-hover)' : (isCinemaManager ? '#fbbf24' : '#34d399'), fontWeight: 700 }}>
            {roleLabels[role] || role}
          </div>
        </div>
        <button onClick={onLogout} title="Đăng xuất" style={{ color: 'var(--admin-text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}