import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Film } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin_test');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập tên tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await AdminApi.login(username.trim(), password.trim());
      if (res.success) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin_test');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="modal-admin-overlay" style={{ background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
      <div className="modal-admin-window" style={{ maxWidth: 440, padding: 32, border: '1px solid rgba(225, 29, 72, 0.4)', boxShadow: '0 25px 60px rgba(0,0,0,0.85)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)'
          }}>
            <Film size={28} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px' }}>CGV Enterprise Admin</h2>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.84rem', margin: 0 }}>
            Đăng nhập hệ thống quản trị rạp chiếu phim CGV
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem',
            marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
              Tài khoản quản trị (Username / Email)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                required
                className="table-search-input"
                style={{ width: '100%', paddingLeft: 38, background: '#090d16', border: '1px solid var(--admin-border)' }}
                placeholder="admin_test"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, marginBottom: 6 }}>
              Mật khẩu xác thực (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                required
                className="table-search-input"
                style={{ width: '100%', paddingLeft: 38, background: '#090d16', border: '1px solid var(--admin-border)' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', color: '#94a3b8',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>Tài khoản mẫu: <strong>admin_test / admin123</strong></span>
            <button
              type="button"
              onClick={handleQuickFill}
              style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              Điền nhanh
            </button>
          </div>

          <button
            type="submit"
            className="btn-admin-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px 20px', fontSize: '0.95rem', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <span>{loading ? 'Đang xác thực Keycloak...' : 'Đăng nhập Quản Trị'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.76rem', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Bảo mật qua Keycloak OAuth2 / OpenID Connect</span>
        </div>
      </div>
    </div>
  );
}
