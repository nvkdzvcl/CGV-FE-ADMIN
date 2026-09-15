import React, { useState } from 'react';
import { Building2, Plus, CheckCircle, MapPin } from 'lucide-react';
import { INITIAL_CINEMAS } from '../data/adminMockData';

export default function CinemasAdminPage() {
  const [cinemas, setCinemas] = useState(INITIAL_CINEMAS);
  const [selectedCinema, setSelectedCinema] = useState(INITIAL_CINEMAS[0]);

  return (
    <div className="cinemas-admin-page">
      {/* Surcharge Config Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="kpi-card" style={{ padding: 16 }}>
          <div>
            <div className="kpi-label">Ghế Thường (NORMAL)</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>+ 0 đ</div>
          </div>
          <span className="status-pill info">Chuẩn</span>
        </div>
        <div className="kpi-card" style={{ padding: 16 }}>
          <div>
            <div className="kpi-label">Phụ thu Ghế VIP (VIP)</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>+ 15.000 đ</div>
          </div>
          <span className="status-pill warning">Phụ thu</span>
        </div>
        <div className="kpi-card" style={{ padding: 16 }}>
          <div>
            <div className="kpi-label">Phụ thu Sweetbox (Đôi)</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>+ 30.000 đ</div>
          </div>
          <span className="status-pill success">Cao cấp</span>
        </div>
      </div>

      {/* Main Cinemas Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Cinemas List */}
        <div className="table-panel" style={{ height: 'fit-content' }}>
          <div className="table-toolbar">
            <h3 style={{ fontSize: '1rem', color: '#fff' }}>Cụm Rạp ({cinemas.length})</h3>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cinemas.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCinema(c)}
                style={{
                  padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                  background: selectedCinema.id === c.id ? 'var(--admin-primary-light)' : 'rgba(255,255,255,0.02)',
                  border: selectedCinema.id === c.id ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border)'
                }}
              >
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                  {c.address}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--admin-text-secondary)' }}>{c.rooms.length} phòng chiếu</span>
                  <span className="status-pill success">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Rooms of Selected Cinema */}
        <div className="table-panel">
          <div className="table-toolbar">
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Phòng Chiếu: {selectedCinema.name}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                {selectedCinema.address}
              </p>
            </div>
            <button className="btn-admin-primary btn-admin-sm">
              <Plus size={14} /> Thêm Phòng
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Mã Phòng</th>
                  <th>Tên Phòng Chiếu</th>
                  <th>Định Dạng</th>
                  <th>Sức Chứa (Ghế)</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {selectedCinema.rooms.map(r => (
                  <tr key={r.id}>
                    <td><code>{r.id}</code></td>
                    <td><strong style={{ color: '#fff' }}>{r.name}</strong></td>
                    <td>
                      <span className={`status-pill ${r.format === 'IMAX' ? 'warning' : r.format === '4DX' ? 'danger' : 'info'}`}>
                        {r.format}
                      </span>
                    </td>
                    <td>{r.seatCapacity} vị trí</td>
                    <td><span className="status-pill success">Hoạt động</span></td>
                    <td>
                      <button className="btn-admin-secondary btn-admin-sm">
                        Xem sơ đồ ghế
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}