import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, ShieldCheck } from 'lucide-react';

const PAGE_NAMES = {
  '/': 'Bảng Điều Khiển Tổng Quan',
  '/movies': 'Quản Lý Danh Mục Phim',
  '/cinemas': 'Cụm Rạp & Phòng Chiếu',
  '/showtimes': 'Điều Phối Lịch Chiếu Phim',
  '/bookings': 'Quản Lý Đơn Vé & Soát Vé Quầy',
  '/promotions': 'Quản Trị Khuyến Mãi & Batch Job',
  '/users': 'Tài Khoản Khách Hàng & Phân Quyền',
  '/payments': 'Đối Soát Giao Dịch & Cổng Thanh Toán'
};

export default function AdminHeader({ currentUser }) {
  const location = useLocation();
  const pageTitle = PAGE_NAMES[location.pathname] || 'Quản Trị Hệ Thống';

  return (
    <header className="admin-header">
      <div className="header-breadcrumbs">
        <span>CGV Admin</span>
        <span>/</span>
        <strong>{pageTitle}</strong>
      </div>

      <div className="header-actions">
        <span className="status-pill success" style={{ gap: 6 }}>
          <ShieldCheck size={14} /> Microservices Online
        </span>

        <button
          style={{ position: 'relative', padding: 8, color: 'var(--admin-text-secondary)' }}
          title="Thông báo hệ thống"
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 4, right: 4, width: 8, height: 8,
            borderRadius: '50%', background: 'var(--admin-primary)'
          }} />
        </button>

        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
          Xin chào, <strong style={{ color: '#fff' }}>{currentUser.fullName}</strong>
        </div>
      </div>
    </header>
  );
}