import React, { useState } from 'react';
import { Film, Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

export default function AdminLoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await AdminApi.login(username.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu quản trị viên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1e111d 0%, #080b13 70%, #030509 100%)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient lights */}
      <div style={{
        position: 'absolute', top: '-10%', left: '30%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(60px)'
      }} />

      <div style={{
        width: '100%', maxWidth: 460,
        background: 'rgba(14, 20, 34, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--admin-primary), #9f1239)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)',
            marginBottom: 16
          }}>
            <Film size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            CGV Enterprise Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginTop: 6 }}>
            Hệ thống Quản Trị Phân Quyền & Vận Hành Cụm Rạp
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', fontSize: '0.85rem', marginBottom: 20
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
              Tài khoản quản trị (Username / Email)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
              <input
                type="text"
                required
                className="table-search-input"
                style={{ width: '100%', paddingLeft: 40, height: 42 }}
                placeholder="admin@cgv.vn"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
              Mật khẩu xác thực (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
              <input
                type="password"
                required
                className="table-search-input"
                style={{ width: '100%', paddingLeft: 40, height: 42 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-admin-primary"
            disabled={loading}
            style={{ height: 44, fontSize: '0.95rem', fontWeight: 700, marginTop: 8 }}
          >
            {loading ? 'Đang xác thực Keycloak IAM...' : 'Đăng nhập vào hệ thống'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
