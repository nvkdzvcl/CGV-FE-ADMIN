import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Shield, Crown, RefreshCw, CheckCircle, AlertCircle,
  Phone, Mail, Edit2, Trash2, Lock, Unlock, Eye, Plus, X, Check, History,
  Download, Sparkles, Building, Ticket, Gift, Briefcase, Filter,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { AdminApi, getAdminUser } from '../services/adminApi';
import { exportUsersToExcel } from '../services/exportExcel';

const STATUS_VI = {
  ACTIVE: 'Hoạt động',
  BLOCKED: 'Đã khóa',
  DELETED: 'Đã xóa',
  INACTIVE: 'Không hoạt động',
};

const STATUS_COLOR = {
  ACTIVE: 'success',
  BLOCKED: 'danger',
  DELETED: 'default',
  INACTIVE: 'warning',
};

// Định nghĩa chi tiết các vai trò trong hệ thống CGV
export const ROLE_DETAILS = {
  SUPER_ADMIN: {
    key: 'SUPER_ADMIN',
    title: 'Quản trị viên tối cao',
    category: 'ADMIN',
    badgeColor: 'danger',
    icon: Crown,
    scope: 'Toàn hệ thống (Super Admin)',
    description: 'Toàn quyền kiểm soát hệ thống, quản lý tài khoản quản trị viên, phân quyền IAM và cấu hình bảo mật.'
  },
  ADMIN: {
    key: 'ADMIN',
    title: 'Quản trị viên hệ thống',
    category: 'ADMIN',
    badgeColor: 'danger',
    icon: Shield,
    scope: 'Quản trị nghiệp vụ',
    description: 'Quản trị dữ liệu toàn sàn, kiểm soát đối soát thanh toán và duyệt các nghiệp vụ quan trọng.'
  },
  CINEMA_MANAGER: {
    key: 'CINEMA_MANAGER',
    title: 'Quản lý cụm rạp',
    category: 'MANAGER',
    badgeColor: 'warning',
    icon: Building,
    scope: 'Cụm rạp & Phòng chiếu',
    description: 'Quản lý phòng chiếu, sơ đồ ghế, xếp lịch chiếu (Showtimes), giá vé và xử lý/duyệt đơn thuê rạp sự kiện.'
  },
  TICKET_STAFF: {
    key: 'TICKET_STAFF',
    title: 'Nhân viên quầy vé',
    category: 'STAFF',
    badgeColor: 'info',
    icon: Ticket,
    scope: 'Quầy vé & Phòng vé',
    description: 'Bán vé trực tiếp tại quầy, tra cứu thông tin vé khách hàng và sử dụng camera quét QR soát vé vào rạp.'
  },
  MARKETING: {
    key: 'MARKETING',
    title: 'Nhân viên Marketing',
    category: 'STAFF',
    badgeColor: 'primary',
    icon: Gift,
    scope: 'Ưu đãi & Khuyến mãi',
    description: 'Tạo mã voucher, thiết lập chương trình khuyến mãi, chạy batch job nạp voucher và quản lý banner.'
  },
  USER: {
    key: 'USER',
    title: 'Khách hàng thành viên',
    category: 'CUSTOMER',
    badgeColor: 'success',
    icon: Users,
    scope: 'Người dùng phổ thông',
    description: 'Tài khoản khách hàng xem phim, đặt vé trực tuyến, hưởng ưu đãi thành viên và tích lũy điểm thưởng.'
  }
};

const MANAGEMENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CINEMA_MANAGER', 'TICKET_STAFF', 'MARKETING'];

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

// Modal Thêm hoặc Chỉnh sửa người dùng với Chọn vai trò chi tiết
function UserFormModal({ user, initialCategory = 'STAFF', onClose, onSave }) {
  const isEdit = Boolean(user?.id);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
    password: '',
    role: user?.role || (initialCategory === 'CUSTOMER' ? 'USER' : 'TICKET_STAFF'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role
    };
    if (!isEdit) {
      payload.username = form.username;
      payload.password = form.password;
    }
    onSave(payload);
    onClose();
  };

  const selectedRoleInfo = ROLE_DETAILS[form.role] || ROLE_DETAILS.USER;

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-admin-header">
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>
              {isEdit ? 'Chỉnh sửa thông tin tài khoản' : 'Thêm người dùng & Phân quyền'}
            </h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              {isEdit ? `Cập nhật thông tin cho @${user.username || user.fullName}` : 'Tạo tài khoản mới và gán vai trò quyền hạn chi tiết'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body">
            {!isEdit && (
              <div className="form-row">
                <div className="form-field">
                  <label>Tên đăng nhập *</label>
                  <input
                    required
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="ví dụ: staff_hcm01"
                  />
                </div>
                <div className="form-field">
                  <label>Mật khẩu khởi tạo *</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
                  />
                </div>
              </div>
            )}

            <div className="form-field">
              <label>Họ và tên đầy đủ *</label>
              <input
                required
                value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Email liên hệ</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="user@cgv.vn"
                />
              </div>
              <div className="form-field">
                <label>Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="0912345678"
                />
              </div>
            </div>

            {/* BẢNG CHỌN VAI TRÒ CHI TIẾT */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                Chọn vai trò & Quyền hạn truy cập:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                {Object.values(ROLE_DETAILS).map(role => {
                  const Icon = role.icon;
                  const isSelected = form.role === role.key;
                  return (
                    <div
                      key={role.key}
                      onClick={() => setForm(p => ({ ...p, role: role.key }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                        background: isSelected ? 'rgba(231, 26, 15, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12
                      }}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={isSelected}
                        onChange={() => setForm(p => ({ ...p, role: role.key }))}
                        style={{ marginTop: 4, accentColor: 'var(--admin-primary)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={14} style={{ color: isSelected ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }} />
                            {role.title}
                          </span>
                          <span className={`status-pill ${role.badgeColor}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {role.key}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                          {role.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Thông tin vai trò được chọn */}
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Phạm vi tác nghiệp:</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>
                  {selectedRoleInfo.scope}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-admin-primary">
              <Check size={16} /> {isEdit ? 'Lưu thay đổi' : 'Tạo & Gán vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Phân quyền chi tiết cho tài khoản hiện có
function AssignRoleModal({ user, onClose, onAssign }) {
  const [selectedRole, setSelectedRole] = useState(user.role || 'TICKET_STAFF');

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-admin-header">
          <div>
            <h3 style={{ color: '#fff' }}>Phân quyền tài khoản — {user.fullName}</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Thay đổi vai trò và quyền hạn quản trị trong Keycloak
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>

        <div className="modal-admin-body">
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>Vai trò hiện tại: </span>
            <span className={`status-pill ${ROLE_DETAILS[user.role]?.badgeColor || 'info'}`} style={{ marginLeft: 6 }}>
              {ROLE_DETAILS[user.role]?.title || user.role}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {MANAGEMENT_ROLES.map(key => {
              const role = ROLE_DETAILS[key];
              const Icon = role.icon;
              const isSelected = selectedRole === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                    background: isSelected ? 'rgba(231, 26, 15, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="assignRoleRadio"
                      checked={isSelected}
                      onChange={() => setSelectedRole(key)}
                      style={{ accentColor: 'var(--admin-primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon size={14} style={{ color: isSelected ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }} />
                        {role.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>{role.description}</div>
                    </div>
                  </div>
                  <span className={`status-pill ${role.badgeColor}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                    {role.key}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-admin-primary" onClick={() => { onAssign(selectedRole); onClose(); }}>
            <Shield size={14} /> Xác nhận đổi vai trò
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Lịch sử vé
function BookingHistoryModal({ user, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminApi.getUserBookings(user.id).then(data => {
      setBookings(data);
    }).catch(() => setBookings([])).finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-admin-header">
          <h3 style={{ color: '#fff' }}>Lịch sử vé — {user.fullName}</h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>
        <div className="modal-admin-body" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-muted)' }}>Đang tải lịch sử...</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-muted)' }}>Không có lịch sử đặt vé.</div>
          ) : bookings.map(b => (
            <div key={b.id} style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{b.movieTitle}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    {b.showtimeStart ? new Date(b.showtimeStart).toLocaleString('vi-VN') : 'N/A'} — Ghế: {b.seats?.join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#f59e0b' }}>{Number(b.totalAmount || 0).toLocaleString('vi-VN')}đ</div>
                  <span className="status-pill info" style={{ fontSize: '0.72rem' }}>{b.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' (Quản lý & Nhân viên) | 'customers' (Khách hàng)
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL'); // 'ALL' | 'SUPER_ADMIN' | 'CINEMA_MANAGER' | 'TICKET_STAFF' | 'MARKETING'
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notification, setNotification] = useState(null);

  // Modals
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [roleModal, setRoleModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Lấy thông tin admin hiện tại
  const currentUser = getAdminUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.roles?.includes('SUPER_ADMIN');
  const currentUserId = currentUser?.id || currentUser?.sub;

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getUsers(0, 100);
      setUsers(data);
    } catch (err) {
      showNotice('error', 'Lỗi tải danh sách: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // Phân loại tài khoản: Khách hàng vs Ban Quản lý & Nhân viên
  const categorized = useMemo(() => {
    const customers = [];
    const staffAndManagers = [];

    users.forEach(u => {
      const roles = u.roles || [u.role];
      const isStaffOrAdmin = roles.some(r => MANAGEMENT_ROLES.includes(r));
      if (isStaffOrAdmin) {
        staffAndManagers.push(u);
      } else {
        customers.push(u);
      }
    });

    return { customers, staffAndManagers };
  }, [users]);

  // Lọc theo Tab, Sub-filter, Hạng thành viên, Trạng thái và Tìm kiếm
  const tabUsers = useMemo(() => {
    let list = activeTab === 'customers' ? categorized.customers : categorized.staffAndManagers;

    // Sub-filter cho tab Quản lý & Nhân viên
    if (activeTab === 'staff' && staffRoleFilter !== 'ALL') {
      list = list.filter(u => {
        const roles = u.roles || [u.role];
        return roles.includes(staffRoleFilter);
      });
    }

    // Sub-filter cho tab Khách hàng
    if (activeTab === 'customers' && tierFilter !== 'ALL') {
      list = list.filter(u => (u.membershipTier || '').toUpperCase() === tierFilter.toUpperCase());
    }

    // Lọc theo trạng thái hoạt động / khóa
    if (statusFilter !== 'ALL') {
      list = list.filter(u => u.status === statusFilter);
    }

    if (!search) return list;
    const q = search.trim().toLowerCase();
    return list.filter(u =>
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  }, [categorized, activeTab, staffRoleFilter, tierFilter, statusFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, staffRoleFilter, tierFilter, statusFilter, search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(tabUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tabUsers.slice(start, start + pageSize);
  }, [tabUsers, currentPage, pageSize]);

  const handleSaveUser = async (formData) => {
    try {
      if (editModal?.id) {
        await AdminApi.updateUser(editModal.id, formData);
        if (formData.role && formData.role !== editModal.role) {
          await AdminApi.assignRole(editModal.id, formData.role);
        }
        showNotice('success', 'Đã cập nhật thông tin và vai trò người dùng.');
      } else {
        await AdminApi.createUser(formData);
        showNotice('success', `Đã tạo tài khoản và gán vai trò ${ROLE_DETAILS[formData.role]?.title || formData.role}.`);
      }
      loadUsers();
    } catch (err) {
      showNotice('error', 'Lỗi: ' + err.message);
    }
  };

  const handleBlockToggle = async (user) => {
    if (user.id === currentUserId) {
      showNotice('error', 'Bạn không thể tự khóa tài khoản của chính mình!');
      return;
    }
    try {
      if (user.status === 'BLOCKED') {
        await AdminApi.unblockUser(user.id);
        showNotice('success', `Đã mở khóa tài khoản "${user.fullName}".`);
      } else {
        await AdminApi.blockUser(user.id);
        showNotice('success', `Đã khóa tài khoản "${user.fullName}".`);
      }
      loadUsers();
    } catch (err) {
      showNotice('error', 'Không thể thay đổi trạng thái: ' + err.message);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUserId) {
      showNotice('error', 'Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    try {
      await AdminApi.deleteUser(user.id);
      showNotice('success', `Đã xóa tài khoản "${user.fullName}".`);
      loadUsers();
    } catch (err) {
      showNotice('error', 'Lỗi xóa: ' + err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleAssignRole = async (userId, role) => {
    try {
      await AdminApi.assignRole(userId, role);
      showNotice('success', `Đã phân vai trò ${ROLE_DETAILS[role]?.title || role} thành công.`);
      loadUsers();
    } catch (err) {
      showNotice('error', 'Lỗi phân quyền: ' + err.message);
    }
  };

  const TABS = [
    {
      key: 'staff',
      label: 'Ban Quản lý & Nhân viên',
      count: categorized.staffAndManagers.length,
      icon: Briefcase
    },
    {
      key: 'customers',
      label: 'Khách hàng thành viên',
      count: categorized.customers.length,
      icon: Users
    }
  ];

  return (
    <div className="users-admin-page">
      <Toast notification={notification} />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>
          Quản Lý Tài Khoản & Phân Quyền Vai Trò
        </h2>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Phân tách rành mạch Khách hàng và Ban Quản lý / Nhân viên rạp, gán quyền trực quan
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--admin-border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setStaffRoleFilter('ALL'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: active ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                borderBottom: active ? '2px solid var(--admin-primary)' : '2px solid transparent',
                fontWeight: active ? 700 : 500, fontSize: '0.92rem',
                marginBottom: -1,
                transition: 'all 0.2s'
              }}>
              <Icon size={16} />
              {tab.label}
              <span style={{
                background: active ? 'var(--admin-primary)' : 'rgba(255,255,255,0.1)',
                color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-filter cho Tab Quản lý & Nhân viên */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={13} /> Lọc vai trò:
          </span>
          {[
            { key: 'ALL', label: 'Tất cả nhân sự', count: categorized.staffAndManagers.length },
            { key: 'SUPER_ADMIN', label: '👑 Quản trị tối cao', count: categorized.staffAndManagers.filter(u => (u.roles || [u.role]).includes('SUPER_ADMIN')).length },
            { key: 'CINEMA_MANAGER', label: '🏢 Quản lý cụm rạp', count: categorized.staffAndManagers.filter(u => (u.roles || [u.role]).includes('CINEMA_MANAGER')).length },
            { key: 'TICKET_STAFF', label: '🎟️ Nhân viên soát vé', count: categorized.staffAndManagers.filter(u => (u.roles || [u.role]).includes('TICKET_STAFF')).length },
            { key: 'MARKETING', label: '🎁 Marketing', count: categorized.staffAndManagers.filter(u => (u.roles || [u.role]).includes('MARKETING')).length }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStaffRoleFilter(f.key)}
              className="btn-admin-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '4px 12px',
                borderRadius: 20,
                border: staffRoleFilter === f.key ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                background: staffRoleFilter === f.key ? 'rgba(231,26,15,0.15)' : 'rgba(255,255,255,0.02)',
                color: staffRoleFilter === f.key ? '#fff' : 'var(--admin-text-muted)',
                fontWeight: staffRoleFilter === f.key ? 700 : 400
              }}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      {/* Main Table Panel */}
      <div className="table-panel">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="table-search-input"
              placeholder="Tìm theo Tên, Email, SĐT, Username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />

            {/* Filter by Tier if in Customers Tab */}
            {activeTab === 'customers' && (
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                style={{
                  background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                  color: '#cbd5e1', padding: '7px 10px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                <option value="ALL">👑 Mọi hạng thành viên</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIP">VIP</option>
                <option value="VVIP">VVIP</option>
              </select>
            )}

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '7px 10px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">🔘 Mọi trạng thái</option>
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="BLOCKED">Đã khóa (BLOCKED)</option>
            </select>

            <button className="btn-admin-secondary" onClick={loadUsers} title="Tải lại danh sách">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button
              className="btn-admin-secondary"
              onClick={() => exportUsersToExcel(tabUsers)}
              title="Xuất file Excel danh sách người dùng">
              <Download size={15} /> Export ({tabUsers.length})
            </button>
          </div>

          <button className="btn-admin-primary" onClick={() => setAddModal(true)}>
            <UserPlus size={15} /> Thêm người dùng mới
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Thông Tin Liên Hệ</th>
                <th>Vai Trò & Quyền Hạn</th>
                {activeTab === 'customers' && <th>Hạng / Điểm</th>}
                <th>Ngày Tạo</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : tabUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Không có tài khoản nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : paginatedUsers.map(u => {
                const roleInfo = ROLE_DETAILS[u.role] || ROLE_DETAILS.USER;
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} style={{ background: isSelf ? 'rgba(231,26,15,0.04)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{u.fullName}</strong>
                        {isSelf && (
                          <span style={{
                            background: 'rgba(231,26,15,0.2)', color: '#f87171',
                            fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, fontWeight: 700
                          }}>
                            Bạn
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.74rem' }}>
                        @{u.username || u.id?.substring(0, 8)}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: '0.82rem' }}>
                        <Mail size={13} color="var(--admin-text-muted)" /> {u.email || '—'}
                      </div>
                      {u.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--admin-primary-hover)', fontSize: '0.78rem', marginTop: 2 }}>
                          <Phone size={13} /> {u.phone}
                        </div>
                      )}
                    </td>

                    {/* VAI TRÒ CHI TIẾT */}
                    <td>
                      <span
                        className={`status-pill ${roleInfo.badgeColor}`}
                        title={roleInfo.description}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', fontSize: '0.75rem' }}>
                        <roleInfo.icon size={13} />
                        {roleInfo.title}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        {roleInfo.scope}
                      </div>
                    </td>

                    {activeTab === 'customers' && (
                      <td>
                        <span className="status-pill info">
                          <Crown size={11} style={{ display: 'inline', marginRight: 4 }} />
                          {u.membershipTier}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                          {Number(u.loyaltyPoints || 0).toLocaleString('vi-VN')} pts
                        </div>
                      </td>
                    )}

                    <td style={{ fontSize: '0.82rem' }}>{u.createdAt}</td>

                    <td>
                      <span className={`status-pill ${STATUS_COLOR[u.status] || 'info'}`}>
                        {STATUS_VI[u.status] || u.status}
                      </span>
                    </td>

                    <td>
                      <div className="table-action-btns">
                        {/* Lịch sử vé cho khách */}
                        {activeTab === 'customers' && (
                          <button
                            className="btn-table-icon"
                            onClick={() => setHistoryModal(u)}
                            title="Lịch sử mua vé">
                            <History size={14} />
                          </button>
                        )}

                        {/* Phân quyền */}
                        <button
                          className="btn-table-icon"
                          onClick={() => setRoleModal(u)}
                          title="Thay đổi vai trò / Phân quyền"
                          style={{ color: '#38bdf8' }}>
                          <Shield size={14} />
                        </button>

                        {/* Sửa */}
                        <button
                          className="btn-table-icon"
                          onClick={() => setEditModal(u)}
                          title="Chỉnh sửa thông tin">
                          <Edit2 size={14} />
                        </button>

                        {/* Khóa/Mở khóa */}
                        {!isSelf && (
                          <button
                            className="btn-table-icon"
                            onClick={() => handleBlockToggle(u)}
                            title={u.status === 'BLOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            style={{ color: u.status === 'BLOCKED' ? '#34d399' : '#f59e0b' }}>
                            {u.status === 'BLOCKED' ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                        )}

                        {/* Xóa */}
                        {!isSelf && isSuperAdmin && (
                          <button
                            className="btn-table-icon danger"
                            onClick={() => setConfirmDelete(u)}
                            title="Xóa tài khoản">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          borderTop: '1px solid var(--admin-border)',
          background: 'rgba(255,255,255,0.015)',
          fontSize: '0.82rem',
          color: 'var(--admin-text-secondary)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            Hiển thị <strong style={{ color: '#fff' }}>
              {tabUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong> đến <strong style={{ color: '#fff' }}>
              {Math.min(currentPage * pageSize, tabUsers.length)}
            </strong> trong số <strong style={{ color: '#fff' }}>{tabUsers.length}</strong> tài khoản
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 6,
                  color: '#cbd5e1',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: 'var(--admin-bg-input, #1e293b)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: currentPage <= 1 ? '#475569' : '#cbd5e1',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <ChevronLeft size={13} /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsisBefore && <span style={{ padding: '0 4px', color: '#64748b' }}>...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: currentPage === p ? 'var(--admin-primary, #e11d48)' : 'var(--admin-bg-input, #1e293b)',
                            border: '1px solid ' + (currentPage === p ? 'var(--admin-primary, #e11d48)' : 'var(--admin-border, #334155)'),
                            color: '#fff',
                            fontWeight: currentPage === p ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: 'var(--admin-bg-input, #1e293b)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: currentPage >= totalPages ? '#475569' : '#cbd5e1',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  Sau <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {addModal && (
        <UserFormModal
          user={null}
          initialCategory={activeTab === 'customers' ? 'CUSTOMER' : 'STAFF'}
          onClose={() => setAddModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {editModal && (
        <UserFormModal
          user={editModal}
          initialCategory={activeTab === 'customers' ? 'CUSTOMER' : 'STAFF'}
          onClose={() => setEditModal(null)}
          onSave={handleSaveUser}
        />
      )}

      {roleModal && (
        <AssignRoleModal
          user={roleModal}
          onClose={() => setRoleModal(null)}
          onAssign={(r) => handleAssignRole(roleModal.id, r)}
        />
      )}

      {historyModal && (
        <BookingHistoryModal
          user={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {confirmDelete && (
        <div className="modal-admin-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-admin-header">
              <h3 style={{ color: '#ef4444' }}>Xác nhận xóa tài khoản</h3>
              <button onClick={() => setConfirmDelete(null)}><X size={20} /></button>
            </div>
            <div className="modal-admin-body">
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa tài khoản <strong>"{confirmDelete.fullName}"</strong> (@{confirmDelete.username}) không?
                Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className="modal-admin-footer">
              <button className="btn-admin-secondary" onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className="btn-admin-primary" style={{ background: '#ef4444', borderColor: '#dc2626' }}
                onClick={() => handleDelete(confirmDelete)}>
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}