import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, X, Check, Users, Key, Search } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

const SYSTEM_ROLES = [
  { name: 'SUPER_ADMIN', description: 'Quản trị viên tối cao — toàn quyền hệ thống', isSystem: true },
  { name: 'CINEMA_MANAGER', description: 'Quản lý cụm rạp — quản lý phim, lịch chiếu, phòng chiếu', isSystem: true },
  { name: 'TICKET_STAFF', description: 'Nhân viên soát vé — truy cập trang soát vé QR', isSystem: true },
  { name: 'USER', description: 'Khách hàng thông thường — đặt vé, xem lịch chiếu', isSystem: true },
];

const PERMISSION_MAP = {
  SUPER_ADMIN: ['movie:manage', 'cinema:manage', 'showtime:manage', 'promotion:manage', 'user:manage', 'booking:admin', 'role:manage'],
  CINEMA_MANAGER: ['movie:manage', 'cinema:manage', 'showtime:manage', 'promotion:manage', 'booking:admin'],
  TICKET_STAFF: ['booking:checkin'],
  USER: ['booking:create', 'booking:read'],
};

function Toast({ notification }) {
  if (!notification) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 20px', borderRadius: 8,
      background: notification.type === 'success' ? '#065f46' : '#991b1b',
      color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`
    }}>
      {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{notification.message}</span>
    </div>
  );
}

export default function RolesAdminPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // null | role object
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [assignUserId, setAssignUserId] = useState('');
  const [apiStatus, setApiStatus] = useState(null); // null | 'testing' | 'ok' | 'error'
  const [searchKeyword, setSearchKeyword] = useState('');

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await AdminApi.getRoles?.() || await fetch('http://localhost:8000/api/v1/roles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('cgv_admin_token')}` }
      }).then(r => r.json()).then(j => j.data || j);
      const list = Array.isArray(res) ? res : (res?.data || []);
      // Merge with system roles
      const systemNames = SYSTEM_ROLES.map(r => r.name);
      const apiRoles = list.map(r => ({ ...r, isSystem: systemNames.includes(r.name) }));
      const existingNames = apiRoles.map(r => r.name);
      const missingSystem = SYSTEM_ROLES.filter(r => !existingNames.includes(r.name));
      setRoles([...apiRoles, ...missingSystem]);
    } catch {
      setRoles(SYSTEM_ROLES);
    } finally {
      setLoading(false);
    }
  };

  const testApi = async () => {
    setApiStatus('testing');
    try {
      const token = localStorage.getItem('cgv_admin_token');
      const res = await fetch('http://localhost:8000/api/v1/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setApiStatus('ok');
        showNotice('success', `API GET /roles OK — Status ${res.status}`);
      } else {
        setApiStatus('error');
        showNotice('error', `API GET /roles thất bại — Status ${res.status}`);
      }
    } catch (err) {
      setApiStatus('error');
      showNotice('error', 'Không kết nối được API: ' + err.message);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    try {
      const token = localStorage.getItem('cgv_admin_token');
      const res = await fetch('http://localhost:8000/api/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newRole.name.toUpperCase().replace(/\s/g, '_'), description: newRole.description })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      showNotice('success', `Đã tạo role "${newRole.name}" thành công.`);
      setAddModal(false);
      setNewRole({ name: '', description: '' });
      loadRoles();
    } catch (err) {
      showNotice('error', 'Lỗi tạo role: ' + err.message);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) { showNotice('error', 'Không thể xóa system role!'); return; }
    try {
      const token = localStorage.getItem('cgv_admin_token');
      const url = role.id ? `http://localhost:8000/api/v1/roles/${role.id}` : `http://localhost:8000/api/v1/roles/${role.name}`;
      const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `HTTP ${res.status}`);
      }
      showNotice('success', `Đã xóa role "${role.name}".`);
      setConfirmDelete(null);
      loadRoles();
    } catch (err) {
      showNotice('error', 'Lỗi xóa role: ' + err.message);
    }
  };

  const handleAssignRole = async () => {
    if (!assignUserId.trim() || !assignModal) return;
    try {
      const token = localStorage.getItem('cgv_admin_token');
      const res = await fetch(`http://localhost:8000/api/v1/users/${assignUserId.trim()}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: assignModal.name })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      showNotice('success', `Đã gán role "${assignModal.name}" cho user ID: ${assignUserId}`);
      setAssignModal(null);
      setAssignUserId('');
    } catch (err) {
      showNotice('error', 'Lỗi gán role: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '0' }}>
      <Toast notification={notification} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
              <Key size={20} style={{ display: 'inline', marginRight: 8 }} />
              Quản Lý Vai Trò &amp; Phân Quyền
            </h2>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
              Tạo role tùy chỉnh, gán role cho người dùng, quản lý quyền hạn hệ thống
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-admin-secondary" onClick={testApi} disabled={apiStatus === 'testing'}>
              {apiStatus === 'testing' ? '⏳ Đang test...' : apiStatus === 'ok' ? '✅ API OK' : apiStatus === 'error' ? '❌ API Lỗi' : '🔌 Test API'}
            </button>
            <button className="btn-admin-secondary" onClick={loadRoles}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-admin-primary" onClick={() => setAddModal(true)}>
              <Plus size={15} /> Tạo Role Mới
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 420,
        position: 'relative'
      }}>
        <Search size={15} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--admin-text-muted)'
        }} />
        <input
          type="text"
          className="table-search-input"
          style={{ width: '100%', paddingLeft: 36, paddingRight: 32 }}
          placeholder="Tìm kiếm vai trò theo tên, mô tả..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
        />
        {searchKeyword && (
          <button
            type="button"
            onClick={() => setSearchKeyword('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Role Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
        {roles.filter(r => {
          if (!searchKeyword.trim()) return true;
          const q = searchKeyword.toLowerCase().trim();
          return r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
        }).map(role => {
          const perms = PERMISSION_MAP[role.name] || [];
          return (
            <div key={role.name} style={{
              padding: '20px', borderRadius: 12,
              background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)',
              position: 'relative'
            }}>
              {/* Role Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`status-pill ${role.name === 'SUPER_ADMIN' ? 'danger' : role.name === 'CINEMA_MANAGER' ? 'warning' : role.name === 'TICKET_STAFF' ? 'info' : 'success'}`}>
                      <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <span style={{ fontSize: '0.7rem', color: '#6b7280', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>System</span>
                    )}
                  </div>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', marginTop: 8, lineHeight: 1.5 }}>
                    {role.description || 'Không có mô tả'}
                  </p>
                </div>
                {!role.isSystem && (
                  <button onClick={() => setConfirmDelete(role)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Permissions */}
              {perms.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quyền hạn:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {perms.map(p => (
                      <span key={p} style={{
                        fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        color: '#93c5fd'
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Button */}
              <button className="btn-admin-secondary" style={{ width: '100%', fontSize: '0.82rem', marginTop: 4 }}
                onClick={() => setAssignModal(role)}>
                <Users size={13} /> Gán role này cho user
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick assign by UserId */}
      <div className="table-panel" style={{ padding: 20 }}>
        <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: 12 }}>Gán Quyền Nhanh</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="table-search-input"
            style={{ flex: 1, minWidth: 220 }}
            placeholder="Nhập User ID cần phân quyền..."
            value={assignUserId}
            onChange={e => setAssignUserId(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['SUPER_ADMIN', 'CINEMA_MANAGER', 'TICKET_STAFF'].map(r => (
              <button key={r} className="btn-admin-secondary" style={{ fontSize: '0.8rem' }}
                onClick={async () => {
                  if (!assignUserId.trim()) { showNotice('error', 'Vui lòng nhập User ID!'); return; }
                  try {
                    const token = localStorage.getItem('cgv_admin_token');
                    const res = await fetch(`http://localhost:8000/api/v1/users/${assignUserId.trim()}/roles`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ role: r })
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
                    showNotice('success', `Gán role ${r} thành công!`);
                  } catch (err) {
                    showNotice('error', 'Lỗi: ' + err.message);
                  }
                }}>
                <Shield size={12} /> → {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {addModal && (
        <div className="modal-admin-overlay" onClick={() => setAddModal(false)}>
          <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-admin-header">
              <h3 style={{ color: '#fff' }}>Tạo Role Mới</h3>
              <button onClick={() => setAddModal(false)} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
            </div>
            <div className="modal-admin-body">
              <div className="form-field">
                <label>Tên Role * (sẽ tự động IN HOA, không dấu cách)</label>
                <input value={newRole.name}
                  onChange={e => setNewRole(p => ({ ...p, name: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                  placeholder="VD: MARKETING_MANAGER" />
              </div>
              <div className="form-field">
                <label>Mô tả</label>
                <input value={newRole.description}
                  onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả quyền hạn của role này" />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.8rem', color: '#fbbf24' }}>
                ⚠️ Sau khi tạo role, bạn cần cấu hình quyền tương ứng trong Keycloak Admin Console để role có hiệu lực.
              </div>
            </div>
            <div className="modal-admin-footer">
              <button className="btn-admin-secondary" onClick={() => setAddModal(false)}>Hủy</button>
              <button className="btn-admin-primary" onClick={handleCreateRole}><Check size={16} /> Tạo Role</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {assignModal && (
        <div className="modal-admin-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-admin-header">
              <h3 style={{ color: '#fff' }}>Gán Role: {assignModal.name}</h3>
              <button onClick={() => setAssignModal(null)} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
            </div>
            <div className="modal-admin-body">
              <div className="form-field">
                <label>User ID hoặc Username cần gán quyền</label>
                <input value={assignUserId}
                  onChange={e => setAssignUserId(e.target.value)}
                  placeholder="UUID hoặc username" />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                Role sẽ được gán: <strong style={{ color: '#fff' }}>{assignModal.name}</strong>
              </div>
            </div>
            <div className="modal-admin-footer">
              <button className="btn-admin-secondary" onClick={() => setAssignModal(null)}>Hủy</button>
              <button className="btn-admin-primary" onClick={handleAssignRole}><Check size={16} /> Xác nhận gán quyền</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-admin-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-admin-header">
              <h3 style={{ color: '#f87171' }}>Xác nhận xóa Role</h3>
              <button onClick={() => setConfirmDelete(null)} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
            </div>
            <div className="modal-admin-body">
              <p style={{ color: '#cbd5e1' }}>Bạn có chắc muốn xóa role <strong style={{ color: '#fff' }}>"{confirmDelete.name}"</strong>?</p>
            </div>
            <div className="modal-admin-footer">
              <button className="btn-admin-secondary" onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className="btn-admin-primary" style={{ background: '#dc2626' }}
                onClick={() => handleDeleteRole(confirmDelete)}>
                <Trash2 size={14} /> Xóa Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
