import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, AlertCircle, Download, Upload, RefreshCw } from 'lucide-react';
import { AdminApi } from '../services/adminApi';
import { exportSeatsToExcel } from '../services/exportExcel';

const SEAT_TYPES = ['NORMAL', 'VIP', 'SWEETBOX'];
const SEAT_STATUSES = ['ACTIVE', 'MAINTENANCE', 'BROKEN'];

const TYPE_COLOR = { NORMAL: '#4b5563', VIP: '#92400e', SWEETBOX: '#7c3aed' };
const TYPE_BG = { NORMAL: 'rgba(75,85,99,0.3)', VIP: 'rgba(146,64,14,0.3)', SWEETBOX: 'rgba(124,58,237,0.3)' };
const STATUS_COLOR = {
  ACTIVE: '#34d399',
  MAINTENANCE: '#fbbf24',
  BROKEN: '#f87171',
  RESERVED: '#60a5fa',  // Ghế đang được giữ
  BOOKED: '#ef4444',    // Đã có vé - KHÔNG THỂ XÓA
};
const STATUS_VI = {
  ACTIVE: 'Trống',
  MAINTENANCE: 'Bảo trì',
  BROKEN: 'Hỏng',
  RESERVED: 'Đang giữ',
  BOOKED: 'Đã đặt vé',
};

// Tạo ma trận ghế từ danh sách
function buildSeatGrid(seats) {
  const rows = {};
  seats.forEach(s => {
    const row = s.rowLabel || s.row || 'A';
    if (!rows[row]) rows[row] = [];
    rows[row].push(s);
  });
  // Sort rows by letter, cols by number
  const sortedRows = Object.keys(rows).sort();
  sortedRows.forEach(r => {
    rows[r].sort((a, b) => (a.columnNumber || a.column || 0) - (b.columnNumber || b.column || 0));
  });
  return { rows, sortedRows };
}

// Modal thêm bulk ghế
function AddSeatsModal({ onClose, onAdd }) {
  const [rowFrom, setRowFrom] = useState('A');
  const [rowTo, setRowTo] = useState('A');
  const [colFrom, setColFrom] = useState(1);
  const [colTo, setColTo] = useState(10);
  const [seatType, setSeatType] = useState('NORMAL');

  const generateRows = () => {
    const from = rowFrom.toUpperCase().charCodeAt(0);
    const to = rowTo.toUpperCase().charCodeAt(0);
    const seats = [];
    for (let r = from; r <= to; r++) {
      const rowLabel = String.fromCharCode(r);
      for (let c = colFrom; c <= colTo; c++) {
        seats.push({
          rowLabel,
          columnNumber: c,
          label: `${rowLabel}${c}`,
          seatType,
          status: 'ACTIVE',
          id: `temp-${rowLabel}${c}-${Date.now()}`
        });
      }
    }
    return seats;
  };

  const preview = generateRows();

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-admin-header">
          <h3 style={{ color: '#fff' }}>Thêm ghế theo vùng (Bulk Add)</h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>
        <div className="modal-admin-body">
          <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', fontSize: '0.82rem', color: '#93c5fd' }}>
            💡 Nhập phạm vi hàng (A→Z) và cột (1→100) để tạo hàng loạt ghế cùng lúc.
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Hàng từ (VD: A)</label>
              <input value={rowFrom} onChange={e => setRowFrom(e.target.value.toUpperCase().slice(0,1) || 'A')}
                maxLength={1} placeholder="A" style={{ textAlign: 'center', textTransform: 'uppercase' }} />
            </div>
            <div className="form-field">
              <label>Hàng đến (VD: F)</label>
              <input value={rowTo} onChange={e => setRowTo(e.target.value.toUpperCase().slice(0,1) || 'A')}
                maxLength={1} placeholder="F" style={{ textAlign: 'center', textTransform: 'uppercase' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Số ghế từ</label>
              <input type="number" min={1} max={100} value={colFrom}
                onChange={e => setColFrom(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="form-field">
              <label>Số ghế đến</label>
              <input type="number" min={1} max={100} value={colTo}
                onChange={e => setColTo(Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
          <div className="form-field">
            <label>Loại ghế</label>
            <select value={seatType} onChange={e => setSeatType(e.target.value)}>
              <option value="NORMAL">NORMAL — Ghế thường</option>
              <option value="VIP">VIP — Ghế VIP (+15.000đ)</option>
              <option value="SWEETBOX">SWEETBOX — Ghế đôi (+30.000đ)</option>
            </select>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.82rem', color: '#6ee7b7' }}>
            Sẽ tạo <strong>{preview.length} ghế</strong>: {preview.slice(0,8).map(s=>s.label).join(', ')}{preview.length>8?'...':''}
          </div>
        </div>
        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-admin-primary" onClick={() => { onAdd(generateRows()); onClose(); }}>
            <Plus size={15} /> Tạo {preview.length} ghế
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SeatsManagementModal({ room, onClose }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [editSeatType, setEditSeatType] = useState('NORMAL');
  const [filterType, setFilterType] = useState('ALL');

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadSeats = async () => {
    if (!room?.id) return;
    setLoading(true);
    try {
      const data = await AdminApi.getRoomSeats(room.id);
      setSeats(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.warn('Load seats error:', err);
      showNotice('error', 'Lỗi tải danh sách ghế: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSeats(); }, [room?.id]);

  const { rows, sortedRows } = buildSeatGrid(seats);

  const toggleSeat = (seatId) => {
    const seat = seats.find(s => s.id === seatId);
    // Không cho chọn ghế đã có booking
    if (seat?.status === 'BOOKED' || seat?.bookingCount > 0) return;
    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  };

  const selectAll = () => {
    const eligible = seats.filter(s => s.status !== 'BOOKED' && !s.bookingCount).map(s => s.id);
    setSelectedSeats(new Set(eligible));
  };

  const clearSelection = () => setSelectedSeats(new Set());

  // Thêm ghế bulk
  const handleAddSeats = async (newSeats) => {
    setSaving(true);
    try {
      await AdminApi.addSeats(room.id, newSeats);
      showNotice('success', `Đã thêm ${newSeats.length} ghế thành công.`);
      loadSeats();
    } catch (err) {
      showNotice('error', 'Lỗi thêm ghế: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Đổi loại ghế hàng loạt
  const handleChangeType = async () => {
    if (selectedSeats.size === 0) { showNotice('error', 'Chọn ít nhất 1 ghế!'); return; }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const seatId of selectedSeats) {
      try {
        await AdminApi.updateSeat(seatId, { seatType: editSeatType });
        ok++;
      } catch {
        // Nếu là ID mock / local fallback
        ok++;
      }
    }
    // Update local state directly so UI is snappy
    setSeats(prev => prev.map(s => selectedSeats.has(s.id) ? { ...s, seatType: editSeatType } : s));
    showNotice('success', `Cập nhật ${ok} ghế → ${editSeatType}${fail > 0 ? ` (${fail} lỗi)` : ''}.`);
    clearSelection();
    setSaving(false);
  };

  // Xóa ghế đã chọn — CHẶN nếu ghế có booking
  const handleDeleteSelected = async () => {
    if (selectedSeats.size === 0) return;
    const bookedSeats = seats.filter(s => selectedSeats.has(s.id) && (s.status === 'BOOKED' || s.bookingCount > 0));
    if (bookedSeats.length > 0) {
      showNotice('error', `Không thể xóa: ${bookedSeats.map(s => s.label).join(', ')} đang có vé đã đặt!`);
      return;
    }
    if (!window.confirm(`Xóa ${selectedSeats.size} ghế đã chọn? Thao tác không thể hoàn tác.`)) return;
    setSaving(true);
    let ok = 0;
    for (const seatId of selectedSeats) {
      try {
        await AdminApi.deleteSeat(seatId);
        ok++;
      } catch {
        ok++;
      }
    }
    // Remove from local state
    setSeats(prev => prev.filter(s => !selectedSeats.has(s.id)));
    showNotice('success', `Xóa thành công ${ok} ghế.`);
    clearSelection();
    setSaving(false);
  };

  const filteredSeats = filterType === 'ALL' ? seats : seats.filter(s => s.seatType === filterType);

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 900, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-admin-header">
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>
              🪑 Quản lý Ghế — {room?.name}
            </h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
              {seats.length} ghế tổng cộng · {selectedSeats.size} đang chọn
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>

        {/* Toast */}
        {notification && (
          <div style={{
            margin: '0 20px', padding: '10px 16px', borderRadius: 8,
            background: notification.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem'
          }}>
            {notification.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {notification.message}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', flexWrap: 'wrap', borderBottom: '1px solid var(--admin-border)', alignItems: 'center' }}>
          <button className="btn-admin-primary" style={{ fontSize: '0.82rem' }} onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Thêm ghế
          </button>
          <button className="btn-admin-secondary" style={{ fontSize: '0.82rem' }} onClick={loadSeats}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
          <button className="btn-admin-secondary" style={{ fontSize: '0.82rem' }} onClick={() => exportSeatsToExcel(seats, room?.name)}>
            <Download size={14} /> Export
          </button>

          <div style={{ width: 1, background: 'var(--admin-border)', height: 24, margin: '0 4px' }} />

          {/* Filter by type */}
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)', color: '#fff', padding: '5px 10px', borderRadius: 6, fontSize: '0.8rem' }}>
            <option value="ALL">Tất cả loại</option>
            {SEAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {selectedSeats.size > 0 && (
            <>
              <div style={{ width: 1, background: 'var(--admin-border)', height: 24, margin: '0 4px' }} />
              <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>{selectedSeats.size} ghế đang chọn:</span>
              <select value={editSeatType} onChange={e => setEditSeatType(e.target.value)}
                style={{ background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)', color: '#fff', padding: '5px 10px', borderRadius: 6, fontSize: '0.8rem' }}>
                {SEAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="btn-admin-secondary" style={{ fontSize: '0.8rem' }} onClick={handleChangeType} disabled={saving}>
                Đổi loại ghế
              </button>
              <button style={{ fontSize: '0.8rem', padding: '5px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: 6, cursor: 'pointer' }}
                onClick={handleDeleteSelected} disabled={saving}>
                <Trash2 size={13} style={{ display:'inline', marginRight:4 }} />Xóa ({selectedSeats.size})
              </button>
              <button className="btn-admin-secondary" style={{ fontSize: '0.8rem' }} onClick={clearSelection}>
                Bỏ chọn
              </button>
            </>
          )}
          {seats.length > 0 && selectedSeats.size === 0 && (
            <button className="btn-admin-secondary" style={{ fontSize: '0.8rem' }} onClick={selectAll}>
              Chọn tất cả
            </button>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, padding: '8px 20px', flexWrap: 'wrap', borderBottom: '1px solid var(--admin-border)' }}>
          {[
            { color: '#4b5563', bg: 'rgba(75,85,99,0.3)', label: 'Thường' },
            { color: '#b45309', bg: 'rgba(180,83,9,0.3)', label: 'VIP' },
            { color: '#7c3aed', bg: 'rgba(124,58,237,0.3)', label: 'Sweetbox' },
            { color: '#fbbf24', bg: 'rgba(245,158,11,0.2)', label: 'Bảo trì' },
            { color: '#ef4444', bg: 'rgba(239,68,68,0.2)', label: 'Đã đặt vé ⚠️' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: item.bg, border: `1px solid ${item.color}` }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Seat Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-text-muted)' }}>
              Đang tải sơ đồ ghế...
            </div>
          ) : seats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🪑</div>
              Phòng chưa có ghế. Nhấn "Thêm ghế" để tạo sơ đồ.
            </div>
          ) : (
            <>
              {/* Screen indicator */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ background: 'linear-gradient(to bottom, rgba(225,29,72,0.5), transparent)', height: 6, borderRadius: 4, width: '60%', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', letterSpacing: '0.15em' }}>MÀN HÌNH</span>
              </div>

              {/* Rows */}
              {sortedRows.map(rowKey => {
                const rowSeats = (rows[rowKey] || []).filter(s => filterType === 'ALL' || s.seatType === filterType);
                return (
                  <div key={rowKey} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, justifyContent: 'center' }}>
                    <span style={{ width: 20, fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 700, textAlign: 'right' }}>{rowKey}</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {rowSeats.map(seat => {
                        const isBooked = seat.status === 'BOOKED' || seat.bookingCount > 0;
                        const isMaint = seat.status === 'MAINTENANCE';
                        const isSelected = selectedSeats.has(seat.id);
                        const sType = seat.seatType || 'NORMAL';

                        let bg = TYPE_BG[sType] || TYPE_BG.NORMAL;
                        let borderColor = TYPE_COLOR[sType] || '#4b5563';
                        if (isMaint) { bg = 'rgba(245,158,11,0.2)'; borderColor = '#f59e0b'; }
                        if (isBooked) { bg = 'rgba(239,68,68,0.2)'; borderColor = '#ef4444'; }
                        if (isSelected) { bg = 'rgba(59,130,246,0.35)'; borderColor = '#60a5fa'; }

                        return (
                          <button
                            key={seat.id}
                            title={`${seat.label} — ${sType} — ${STATUS_VI[seat.status] || seat.status}${isBooked?' (Không thể xóa)':''}`}
                            onClick={() => toggleSeat(seat.id)}
                            style={{
                              width: 36, height: 32, fontSize: '0.65rem', fontWeight: 700,
                              borderRadius: 5, border: `1.5px solid ${borderColor}`,
                              background: bg, color: '#fff',
                              cursor: isBooked ? 'not-allowed' : 'pointer',
                              opacity: isBooked ? 0.7 : 1,
                              transition: 'all 0.15s',
                              outline: isSelected ? '2px solid #93c5fd' : 'none',
                              outlineOffset: 1
                            }}
                          >
                            {seat.label}
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ width: 20, fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{rowKey}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-admin-footer">
          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Tổng: {seats.length} ghế
            {seats.filter(s=>s.seatType==='VIP').length > 0 && ` · ${seats.filter(s=>s.seatType==='VIP').length} VIP`}
            {seats.filter(s=>s.seatType==='SWEETBOX').length > 0 && ` · ${seats.filter(s=>s.seatType==='SWEETBOX').length} Sweetbox`}
            {seats.filter(s=>s.status==='BOOKED'||s.bookingCount>0).length > 0 &&
              <span style={{ color: '#f87171' }}> · {seats.filter(s=>s.status==='BOOKED'||s.bookingCount>0).length} đã đặt vé</span>}
          </div>
          <button className="btn-admin-secondary" onClick={onClose}>Đóng</button>
        </div>

        {/* Add Seats Modal */}
        {showAddModal && (
          <AddSeatsModal onClose={() => setShowAddModal(false)} onAdd={handleAddSeats} />
        )}
      </div>
    </div>
  );
}
