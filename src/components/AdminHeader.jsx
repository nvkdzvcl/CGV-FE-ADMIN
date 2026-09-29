import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, ShieldCheck, LogOut, Radio } from 'lucide-react';
import { realtime } from '../services/realtimeService';

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

export default function AdminHeader({ currentUser, onLogout }) {
  const location = useLocation();
  const pageTitle = PAGE_NAMES[location.pathname] || 'Quản Trị Hệ Thống';
  const role = currentUser?.role || 'STAFF';
  const [sseLive, setSseLive] = useState(true);

  useEffect(() => {
    const unsub = realtime.subscribe(msg => {
      if (msg.type === 'SSE_STATUS_CHANGED') {
        setSseLive(msg.payload.connected);
      }
    });
    return unsub;
  }, []);

  return (
    <header className="admin-header">
      <div className="header-breadcrumbs">
        <span>CGV Admin</span>
        <span>/</span>
        <strong>{pageTitle}</strong>
      </div>

      <div className="header-actions">
        {/* <span className={`status-pill ${sseLive ? 'success' : 'warning'}`} style={{ gap: 6, fontSize: '0.78rem' }} title="Luồng Server-Sent Events kết nối trực tiếp đến Catalog & Booking Microservices qua Kong Gateway"> */}
          {/* <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: sseLive ? '#10b981' : '#f59e0b',
            boxShadow: sseLive ? '0 0 8px #10b981' : 'none',
            display: 'inline-block'
          }} />
          SSE {sseLive ? 'Live' : 'Reconnecting...'}
        </span>

        <span className="status-pill success" style={{ gap: 6 }}>
          <ShieldCheck size={14} /> Microservices Online
        </span> */}

        <button
          style={{ position: 'relative', padding: 8, color: 'var(--admin-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Thông báo hệ thống"
        >
          {/* <Bell size={18} /> */}
          <span style={{
            position: 'absolute', top: 4, right: 4, width: 8, height: 8,
            borderRadius: '50%', background: 'var(--admin-primary)'
          }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeft: '1px solid var(--admin-border)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              {currentUser?.fullName}
            </div>
            <div style={{ fontSize: '0.72rem', color: role === 'SUPER_ADMIN' ? 'var(--admin-primary-hover)' : '#34d399', fontWeight: 600 }}>
              {role}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn-table-icon delete"
            style={{ width: 34, height: 34 }}
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}