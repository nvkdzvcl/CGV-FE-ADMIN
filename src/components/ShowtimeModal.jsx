import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, AlertTriangle, Check, Search, Film, Clock, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

const AGE_RATING_CONFIG = {
  P: { label: 'P - Phổ biến', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', desc: 'Mọi lứa tuổi' },
  K: { label: 'K - Dưới 13', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', desc: 'Khán giả dưới 13 tuổi kèm người giám hộ' },
  T13: { label: 'T13 - 13+', color: '#eab308', bg: 'rgba(234,179,8,0.15)', desc: 'Khán giả từ đủ 13 tuổi trở lên' },
  T16: { label: 'T16 - 16+', color: '#f97316', bg: 'rgba(249,115,22,0.15)', desc: 'Khán giả từ đủ 16 tuổi trở lên' },
  T18: { label: 'T18 - 18+', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', desc: 'Khán giả từ đủ 18 tuổi trở lên (Cấm < 18)' }
};

export default function ShowtimeModal({
  onClose,
  onSave,
  existingShowtimes = [],
  movies = [],
  cinemas = []
}) {
  const [movieSearch, setMovieSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(movies[0] || null);
  const searchContainerRef = useRef(null);

  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id || '');
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:15');
  const [basePrice, setBasePrice] = useState(90000);
  const [conflictError, setConflictError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter movies by search term (name, original title, director, actors)
  const filteredMovies = movies.filter(m => {
    if (!movieSearch.trim()) return true;
    const term = movieSearch.toLowerCase();
    return (m.title && m.title.toLowerCase().includes(term)) ||
           (m.originalTitle && m.originalTitle.toLowerCase().includes(term)) ||
           (m.director && m.director.toLowerCase().includes(term));
  });

  const selectedCinema = cinemas.find(c => c.id === cinemaId) || cinemas[0] || { name: 'CGV Cinema' };

  // Auto-calculate end time based on movie duration + 15 mins cleanup
  const calculateEndTime = (start, durationMins) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + (Number(durationMins) || 120) + 15;
    const endH = Math.floor((totalMinutes / 60) % 24);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // Fetch rooms whenever cinemaId changes
  useEffect(() => {
    if (!cinemaId) return;
    setLoadingRooms(true);
    AdminApi.getCinemaRooms(cinemaId)
      .then(fetchedRooms => {
        if (Array.isArray(fetchedRooms) && fetchedRooms.length > 0) {
          setRooms(fetchedRooms);
          setRoomId(fetchedRooms[0].id);
        } else {
          setRooms([]);
          setRoomId('');
        }
      })
      .catch(err => {
        console.warn('Error fetching rooms for cinema:', err);
        setRooms([]);
        setRoomId('');
      })
      .finally(() => setLoadingRooms(false));
  }, [cinemaId]);

  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    const dur = selectedMovie?.duration || selectedMovie?.durationMinutes || 120;
    const end = calculateEndTime(newStartTime, dur);
    if (end) setEndTime(end);
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setIsSearchOpen(false);
    setMovieSearch('');
    if (startTime) {
      const dur = movie.duration || movie.durationMinutes || 120;
      const end = calculateEndTime(startTime, dur);
      if (end) setEndTime(end);
    }
    // Ngăn chặn chọn ngày trước ngày khởi chiếu: tự động nhảy đến ngày khởi chiếu nếu ngày hiện tại trước ngày phát hành
    if (movie.releaseDate && date < movie.releaseDate) {
      setDate(movie.releaseDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (!selectedMovie?.id) {
      setConflictError('Vui lòng chọn phim chiếu.');
      return;
    }
    if (!roomId) {
      setConflictError('Vui lòng chọn phòng chiếu (Rạp cần có ít nhất 1 phòng chiếu).');
      return;
    }

    // Kiểm tra ràng buộc ngày khởi chiếu của phim
    if (selectedMovie.releaseDate && date < selectedMovie.releaseDate) {
      setConflictError(`Không thể tạo suất chiếu trước ngày khởi chiếu! Phim "${selectedMovie.title}" dự kiến khởi chiếu từ ngày ${selectedMovie.releaseDate}.`);
      return;
    }

    // Local overlap check
    const conflict = existingShowtimes.find(st => {
      const matchRoom = String(st.roomId) === String(roomId);
      const matchDate = st.date === date || st.showDate === date;
      const isOverlap = (startTime >= st.startTime && startTime < st.endTime) ||
                        (endTime > st.startTime && endTime <= st.endTime);
      return matchRoom && matchDate && isOverlap;
    });

    if (conflict) {
      setConflictError(`Xung đột lịch chiếu! Phòng này đã có suất "${conflict.movieTitle}" từ ${conflict.startTime} đến ${conflict.endTime}.`);
      return;
    }

    const room = rooms.find(r => String(r.id) === String(roomId));

    // Build payload conforming to CatalogService ShowtimeCreateRequest (Instant UTC ISO-8601)
    const startIso = new Date(`${date}T${startTime}:00+07:00`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00+07:00`).toISOString();

    const showtimeData = {
      movieId: selectedMovie.id,
      roomId,
      showDate: date,
      startTime: startIso,
      endTime: endIso,
      basePrice: Number(basePrice),
      status: 'SCHEDULED', // Valid backend enum: SCHEDULED, CANCELLED, COMPLETED
      viewingMode: (room?.format === '3D') ? 'THREE_D' : 'TWO_D',
      format: room?.format || '2D',
      movieTitle: selectedMovie?.title || 'Phim CGV',
      cinemaName: selectedCinema?.name || 'CGV Cinema',
      roomName: room?.name || 'Phòng Chiếu'
    };

    setSubmitting(true);
    try {
      await onSave(showtimeData);
      onClose();
    } catch (err) {
      setConflictError(err.message || 'Không thể tạo suất chiếu trên hệ thống.');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingInfo = AGE_RATING_CONFIG[selectedMovie?.ageRating] || AGE_RATING_CONFIG.P;

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '95vw' }}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--admin-primary)" />
            Xếp Lịch Chiếu Phim Mới
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
            {conflictError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 16px', borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14
              }}>
                <AlertTriangle size={18} />
                <span>{conflictError}</span>
              </div>
            )}

            {/* Smart Autocomplete Movie Search (No Combobox Select) */}
            <div className="form-field" ref={searchContainerRef} style={{ position: 'relative' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>🎬 Chọn Phim Chiếu *</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                  Tổng cộng {movies.length} phim trong hệ thống
                </span>
              </label>

              {/* Search Bar with Instant Autocomplete */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Gõ tên phim để tìm kiếm nhanh (Tên Việt, Tiếng Anh, Đạo diễn)..."
                  value={movieSearch}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={e => {
                    setMovieSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  style={{
                    paddingLeft: 36, paddingRight: 36, fontSize: '0.88rem', width: '100%',
                    background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--radius-md)', color: '#fff', height: 42,
                    boxShadow: isSearchOpen ? '0 0 0 2px var(--admin-primary)' : 'none'
                  }}
                />
                {movieSearch && (
                  <button
                    type="button"
                    onClick={() => { setMovieSearch(''); setIsSearchOpen(false); }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              {isSearchOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  marginTop: 4, maxHeight: 300, overflowY: 'auto',
                  background: '#111827', border: '1px solid #374151', borderRadius: 8,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                }}>
                  {filteredMovies.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                      Không tìm thấy phim phù hợp với từ khóa "{movieSearch}"
                    </div>
                  ) : (
                    filteredMovies.map(m => {
                      const mRating = AGE_RATING_CONFIG[m.ageRating] || AGE_RATING_CONFIG.P;
                      const isCurr = selectedMovie?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMovie(m)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: isCurr ? 'rgba(225, 29, 72, 0.15)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={e => { if (!isCurr) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (!isCurr) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {m.posterUrl ? (
                            <img src={m.posterUrl} alt={m.title}
                              style={{ width: 38, height: 54, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 38, height: 54, background: '#1e293b', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Film size={18} color="#94a3b8" />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.title}
                            </div>
                            {m.originalTitle && m.originalTitle !== m.title && (
                              <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: 4 }}>
                                {m.originalTitle}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                                color: mRating.color, background: mRating.bg, border: `1px solid ${mRating.color}40`
                              }}>
                                {mRating.label}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> {m.duration || m.durationMinutes || 120} phút
                              </span>
                              {m.genres && (
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {Array.isArray(m.genres) ? m.genres.slice(0, 2).join(', ') : m.genres}
                                </span>
                              )}
                            </div>
                          </div>
                          {isCurr && <Check size={18} color="var(--admin-primary)" style={{ flexShrink: 0 }} />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Rich Selected Movie Card */}
              {selectedMovie && (
                <div style={{
                  display: 'flex', gap: 16, marginTop: 10, padding: '14px',
                  borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  {selectedMovie.posterUrl ? (
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      style={{ width: 68, height: 98, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                    />
                  ) : (
                    <div style={{ width: 68, height: 98, background: '#1e293b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Film size={28} color="#94a3b8" />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '1rem', lineHeight: 1.3 }}>
                          {selectedMovie.title}
                        </h4>
                        {selectedMovie.originalTitle && selectedMovie.originalTitle !== selectedMovie.title && (
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                            {selectedMovie.originalTitle}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(true)}
                        style={{
                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                          color: '#e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Search size={12} /> Đổi phim khác
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        color: ratingInfo.color, background: ratingInfo.bg, border: `1px solid ${ratingInfo.color}50`
                      }}>
                        {ratingInfo.label}
                      </span>
                      <span style={{
                        fontSize: '0.78rem', color: '#f1f5f9', background: 'rgba(0,0,0,0.3)',
                        padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <Clock size={13} color="#38bdf8" /> {selectedMovie.duration || selectedMovie.durationMinutes || 120} phút
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        ● {selectedMovie.showingStatus === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
                      </span>
                      {selectedMovie.releaseDate && (
                        <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          📅 Khởi chiếu: {selectedMovie.releaseDate}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                      {ratingInfo.desc}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cinema and Room Select */}
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-field">
                <label>Cụm rạp *</label>
                <select value={cinemaId} onChange={e => setCinemaId(e.target.value)}>
                  {cinemas.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phòng chiếu *</span>
                  {loadingRooms && <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Đang nạp phòng...</span>}
                </label>
                <select
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  style={{
                    borderColor: rooms.length > 0 ? 'var(--admin-border)' : '#f59e0b',
                    color: '#fff'
                  }}
                >
                  {rooms.length === 0 ? (
                    <option value="" disabled>Chưa có phòng chiếu (Vui lòng thêm phòng vào cụm rạp trước)</option>
                  ) : (
                    rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} — ({r.format || '2D'}, {r.capacity || r.totalSeats || 120} ghế)
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Date & Base Price */}
            <div className="form-row">
              <div className="form-field">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ngày chiếu *</span>
                  {selectedMovie?.releaseDate && (
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                      (Khởi chiếu từ: {selectedMovie.releaseDate})
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  min={selectedMovie?.releaseDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Giá vé sàn (base_price VND) *</label>
                <input type="number" required step="5000" min="45000" value={basePrice}
                  onChange={e => setBasePrice(e.target.value)} />
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="form-row">
              <div className="form-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> Giờ bắt đầu *
                </label>
                <input type="time" required value={startTime} onChange={e => handleStartTimeChange(e.target.value)} />
              </div>
              <div className="form-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> Giờ kết thúc (tự động tính + 15p dọn phòng)
                </label>
                <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-admin-primary" disabled={submitting || !roomId}>
              <Check size={16} /> {submitting ? 'Đang lưu...' : 'Lưu suất chiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}