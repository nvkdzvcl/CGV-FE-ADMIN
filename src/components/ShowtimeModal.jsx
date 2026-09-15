import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Check } from 'lucide-react';
import { INITIAL_MOVIES, INITIAL_CINEMAS } from '../data/adminMockData';

export default function ShowtimeModal({ onClose, onSave, existingShowtimes = [] }) {
  const [movieId, setMovieId] = useState(INITIAL_MOVIES[0]?.id || '');
  const [cinemaId, setCinemaId] = useState(INITIAL_CINEMAS[0]?.id || '');
  const [roomId, setRoomId] = useState(INITIAL_CINEMAS[0]?.rooms[0]?.id || '');
  const [date, setDate] = useState('2026-09-15');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:15');
  const [basePrice, setBasePrice] = useState(110000);
  const [conflictError, setConflictError] = useState('');

  const selectedCinema = INITIAL_CINEMAS.find(c => c.id === cinemaId) || INITIAL_CINEMAS[0];

  const handleCinemaChange = (cId) => {
    setCinemaId(cId);
    const cin = INITIAL_CINEMAS.find(c => c.id === cId);
    if (cin && cin.rooms.length > 0) {
      setRoomId(cin.rooms[0].id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConflictError('');

    // Conflict Check: prevent overlapping showtime in the same room on the same date
    const conflict = existingShowtimes.find(st => {
      return st.date === date && (
        (startTime >= st.startTime && startTime < st.endTime) ||
        (endTime > st.startTime && endTime <= st.endTime)
      );
    });

    if (conflict) {
      setConflictError(`Xung đột lịch chiếu! Phòng này đã có suất "${conflict.movieTitle}" từ ${conflict.startTime} đến ${conflict.endTime}.`);
      return;
    }

    const movie = INITIAL_MOVIES.find(m => m.id === movieId);
    const room = selectedCinema.rooms.find(r => r.id === roomId);

    onSave({
      id: 'st-' + Date.now().toString().slice(-4),
      movieTitle: movie.title,
      cinemaName: selectedCinema.name,
      roomName: room.name,
      date,
      startTime,
      endTime,
      basePrice: Number(basePrice),
      status: 'ACTIVE'
    });
    onClose();
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Xếp Lịch Chiếu Phim Mới</h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body">
            {conflictError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 16px', borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertTriangle size={18} />
                <span>{conflictError}</span>
              </div>
            )}

            <div className="form-field">
              <label>Chọn Phim</label>
              <select value={movieId} onChange={e => setMovieId(e.target.value)}>
                {INITIAL_MOVIES.map(m => (
                  <option key={m.id} value={m.id}>{m.title} ({m.duration}m)</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Cụm rạp</label>
                <select value={cinemaId} onChange={e => handleCinemaChange(e.target.value)}>
                  {INITIAL_CINEMAS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Phòng chiếu</label>
                <select value={roomId} onChange={e => setRoomId(e.target.value)}>
                  {selectedCinema.rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Ngày chiếu</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Giá vé sàn (base_price)</label>
                <input type="number" required value={basePrice} onChange={e => setBasePrice(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Giờ bắt đầu</label>
                <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Giờ kết thúc</label>
                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-admin-primary">
              <Check size={16} /> Lưu suất chiếu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}