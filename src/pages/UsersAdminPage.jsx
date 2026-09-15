import React, { useState } from 'react';
import { Users, Shield, Crown } from 'lucide-react';
import { INITIAL_USERS } from '../data/adminMockData';

export default function UsersAdminPage() {
  const [users, setUsers] = useState(INITIAL_USERS);

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div className="users-admin-page">
      <div className="table-panel">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Tài Khoản & Phân Quyền Hệ Thống</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Đồng bộ Keycloak IAM / IdentityService
          </span>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Họ Tên</th>
                <th>Email Đăng Nhập</th>
                <th>Vai Trò (Role)</th>
                <th>Hạng Thành Viên</th>
                <th>Điểm Loyalty</th>
                <th>Ngày Tạo</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong style={{ color: '#fff' }}>{u.fullName}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{
                        background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                        color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem'
                      }}
                    >
                      <option value="USER">USER (Khách hàng)</option>
                      <option value="STAFF">STAFF (Nhân viên rạp)</option>
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${u.membershipTier === 'VVIP' ? 'warning' : 'info'}`}>
                      <Crown size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {u.membershipTier}
                    </span>
                  </td>
                  <td>{u.loyaltyPoints.toLocaleString('vi-VN')} pts</td>
                  <td>{u.createdAt}</td>
                  <td><span className="status-pill success">{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}