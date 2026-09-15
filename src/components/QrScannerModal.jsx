import React, { useState } from 'react';
import { X, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

export default function QrScannerModal({ onClose }) {
  const [ticketCode, setTicketCode] = useState('BK-772109');
  const [verifyResult, setVerifyResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;
    const res = await AdminApi.verifyTicketQr(ticketCode);
    setVerifyResult(res);
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={20} color="var(--admin-primary)" />
            Soát Vé Quầy & Quét QR Code (Box Office Staff)
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-admin-body">
          {/* Scanner Simulation Box */}
          <div style={{
            background: '#090d16', border: '2px dashed var(--admin-primary)',
            borderRadius: 12, padding: '30px 20px', textAlign: 'center'
          }}>
            <QrCode size={64} color="var(--admin-primary)" style={{ margin: '0 auto 12px' }} />
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
              Hướng camera về phía mã QR trên điện thoại khách hàng
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Hoặc nhập trực tiếp mã đặt vé (Booking ID) bên dưới
            </div>
          </div>

          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="text"
              required
              className="table-search-input"
              style={{ flex: 1 }}
              placeholder="Nhập mã vé: BK-894210..."
              value={ticketCode}
              onChange={e => setTicketCode(e.target.value)}
            />
            <button type="submit" className="btn-admin-primary">
              Kiểm tra vé
            </button>
          </form>

          {verifyResult && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 10,
              background: verifyResult.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${verifyResult.valid ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {verifyResult.valid ? (
                  <CheckCircle size={22} color="#10b981" />
                ) : (
                  <AlertCircle size={22} color="#ef4444" />
                )}
                <strong style={{ color: verifyResult.valid ? '#34d399' : '#f87171' }}>
                  {verifyResult.message}
                </strong>
              </div>

              {verifyResult.booking && (
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  <div><strong>Phim:</strong> {verifyResult.booking.movieTitle}</div>
                  <div><strong>Rạp & Phòng:</strong> {verifyResult.booking.cinemaName} — {verifyResult.booking.roomName}</div>
                  <div><strong>Ghế ngồi:</strong> {verifyResult.booking.seats.join(', ')}</div>
                  <div><strong>Khách hàng:</strong> {verifyResult.booking.userEmail}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}