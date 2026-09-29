import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Plus, Clock, RefreshCw, CheckCircle, AlertCircle,
  FileSpreadsheet, Download, Search, Filter, X, ChevronLeft, ChevronRight,
  Film, Building2, Layers, AlertTriangle
} from 'lucide-react';
import ShowtimeModal from '../components/ShowtimeModal';
import ExcelImportShowtimeModal from '../components/ExcelImportShowtimeModal';
import { AdminApi } from '../services/adminApi';
import { exportShowtimesToExcel } from '../services/exportExcel';
import { realtime, REALTIME_EVENTS } from '../services/realtimeService';

const STATUS_COLOR_MAP = {
  SCHEDULED: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6', label: 'Đã lên lịch' },
  OPEN: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981', label: 'Đang mở bán vé' },
  COMPLETED: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#64748b', label: 'Đã chiếu xong' },
  CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: '#ef4444', label: 'Đã hủy' },
  CLOSED: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: '#f59e0b', label: 'Đã đóng' }
};

export default function ShowtimesAdminPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // ─── BỘ LỌC TÌM KIẾM NÂNG CAO ───
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('ALL');
  const [selectedCinemaId, setSelectedCinemaId] = useState('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // ─── PHÂN TRANG ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [stData, mData, cData] = await Promise.all([
        AdminApi.getShowtimes({ size: 300 }),
        AdminApi.getMovies(),
        AdminApi.getCinemas()
      ]);
      setShowtimes(stData);
      setMovies(mData);
      setCinemas(cData);
    } catch (err) {
      showNotice('error', 'Lỗi tải lịch chiếu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ Realtime khi có thay đổi từ Admin hoặc Background
  useEffect(() => {
    loadData();

    const unsub = realtime.subscribe(msg => {
      if (
        msg.type === REALTIME_EVENTS.SHOWTIME_CHANGED ||
        msg.type === REALTIME_EVENTS.ROOM_STATUS_CHANGED ||
        msg.type === REALTIME_EVENTS.CINEMA_STATUS_CHANGED ||
        msg.type === REALTIME_EVENTS.MOVIE_STATUS_CHANGED
      ) {
        console.log('[ShowtimesAdminPage] 🔄 Nhận sự kiện Realtime, tự động tải lại dữ liệu...', msg);
        loadData();
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Danh sách các phòng chiếu khả dụng theo Rạp đang chọn
  const availableRooms = useMemo(() => {
    if (selectedCinemaId === 'ALL') {
      const allR = [];
      cinemas.forEach(c => {
        (c.rooms || []).forEach(r => allR.push({ ...r, cinemaName: c.name }));
      });
      return allR;
    }
    const currentCinema = cinemas.find(c => c.id === selectedCinemaId);
    return currentCinema?.rooms || [];
  }, [cinemas, selectedCinemaId]);

  // Reset roomId nếu rạp thay đổi
  useEffect(() => {
    setSelectedRoomId('ALL');
  }, [selectedCinemaId]);

  // Bộ lọc nâng cao đa tiêu chí
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(st => {
      // 1. Từ khóa: Tên phim, tên rạp, tên phòng
      const q = searchKeyword.trim().toLowerCase();
      if (q) {
        const matchTitle = st.movieTitle && st.movieTitle.toLowerCase().includes(q);
        const matchCinema = st.cinemaName && st.cinemaName.toLowerCase().includes(q);
        const matchRoom = st.roomName && st.roomName.toLowerCase().includes(q);
        if (!matchTitle && !matchCinema && !matchRoom) return false;
      }

      // 2. Theo phim
      if (selectedMovieId !== 'ALL' && st.movieId !== selectedMovieId) {
        return false;
      }

      // 3. Theo rạp
      if (selectedCinemaId !== 'ALL' && st.cinemaId !== selectedCinemaId) {
        return false;
      }

      // 4. Theo phòng chiếu
      if (selectedRoomId !== 'ALL' && st.roomId !== selectedRoomId) {
        return false;
      }

      // 5. Theo ngày chiếu
      if (selectedDate && st.date !== selectedDate) {
        return false;
      }

      // 6. Theo định dạng (2D / 3D / IMAX / 4DX)
      if (selectedFormat !== 'ALL') {
        const fmt = (st.format || '2D').toUpperCase();
        if (!fmt.includes(selectedFormat.toUpperCase())) return false;
      }

      // 7. Theo trạng thái
      if (selectedStatus !== 'ALL') {
        const stStatus = st.status || 'OPEN';
        if (stStatus !== selectedStatus) return false;
      }

      return true;
    });
  }, [showtimes, searchKeyword, selectedMovieId, selectedCinemaId, selectedRoomId, selectedDate, selectedFormat, selectedStatus]);

  // Tự động về trang 1 khi thay đổi bất kỳ bộ lọc nào
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, selectedMovieId, selectedCinemaId, selectedRoomId, selectedDate, selectedFormat, selectedStatus, pageSize]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredShowtimes.length / pageSize));
  const paginatedShowtimes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShowtimes.slice(start, start + pageSize);
  }, [filteredShowtimes, currentPage, pageSize]);

  const handleSaveShowtime = async (newShowtime) => {
    try {
      await AdminApi.createShowtime(newShowtime);
      showNotice('success', 'Đã xếp lịch suất chiếu mới thành công!');
      loadData();
    } catch (err) {
      showNotice('error', 'Không thể tạo suất chiếu: ' + err.message);
      throw err;
    }
  };

  const handleQuickDateToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedMovieId('ALL');
    setSelectedCinemaId('ALL');
    setSelectedRoomId('ALL');
    setSelectedDate('');
    setSelectedFormat('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchKeyword ||
    selectedMovieId !== 'ALL' ||
    selectedCinemaId !== 'ALL' ||
    selectedRoomId !== 'ALL' ||
    selectedDate ||
    selectedFormat !== 'ALL' ||
    selectedStatus !== 'ALL'
  );

  return (
    <div className="showtimes-admin-page">
      {/* Toast Notification */}
      {notification && (
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
      )}

      <div className="table-panel">
        {/* Top Header & Action Buttons */}
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Điều Phối Lịch Chiếu (Showtimes)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Hệ thống realtime đồng bộ lịch chiếu, tự động cảnh báo phòng bảo trì & bảo vệ vé đã bán
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-admin-secondary" onClick={loadData} title="Làm mới dữ liệu">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-admin-secondary" onClick={() => exportShowtimesToExcel(filteredShowtimes)} title="Xuất danh sách đang lọc ra file Excel">
              <Download size={15} /> Xuất Excel ({filteredShowtimes.length})
            </button>
            <button className="btn-admin-secondary" onClick={() => setIsImportModalOpen(true)}>
              <FileSpreadsheet size={16} /> Import Excel / CSV
            </button>
            <button className="btn-admin-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Thêm Suất Chiếu
            </button>
          </div>
        </div>

        {/* ─── THANH TÌM KIẾM NÂNG CAO (ADVANCED SEARCH TOOLBAR) ─── */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--admin-border)',
          background: 'rgba(255,255,255,0.015)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Row 1: Search Keyword & Quick Date Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên phim, rạp chiếu, phòng chiếu..."
                style={{
                  width: '100%',
                  padding: '9px 32px 9px 36px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Movie */}
            <div>
              <select
                value={selectedMovieId}
                onChange={e => setSelectedMovieId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: '0.83rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🎬 Tất cả các phim ({movies.length})</option>
                {movies.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Filter by Cinema */}
            <div>
              <select
                value={selectedCinemaId}
                onChange={e => setSelectedCinemaId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: '0.83rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🏢 Tất cả cụm rạp ({cinemas.length})</option>
                {cinemas.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-admin-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                title="Xóa toàn bộ bộ lọc"
              >
                <X size={14} /> Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Row 2: Room, Date Picker, Format, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            {/* Filter by Room */}
            <div>
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🚪 Tất cả phòng chiếu</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.format || '2D'}) {r.status === 'MAINTENANCE' ? '[Bảo trì]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker Input */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              />
              <button
                type="button"
                onClick={handleQuickDateToday}
                className="btn-admin-secondary"
                style={{ padding: '8px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                title="Lọc hôm nay"
              >
                Hôm nay
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                  title="Xem tất cả các ngày"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Format */}
            <div>
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🎞️ Mọi định dạng (2D/3D/IMAX/4DX)</option>
                <option value="2D">2D Digital</option>
                <option value="3D">3D Digital</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🔘 Mọi trạng thái suất</option>
                <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                <option value="OPEN">Đang mở bán vé (OPEN)</option>
                <option value="COMPLETED">Đã chiếu xong (COMPLETED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                <option value="CLOSED">Đã đóng (CLOSED)</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
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
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── BẢNG DỮ LIỆU LỊCH CHIẾU ─── */}
        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Ngày Chiếu</th>
                <th>Khung Giờ</th>
                <th>Tên Phim</th>
                <th>Cụm Rạp</th>
                <th>Phòng Chiếu</th>
                <th>Định Dạng</th>
                <th>Giá Sàn</th>
                <th>Ghế Trống</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {loading && showtimes.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-text-muted)' }}>
                    Đang đồng bộ dữ liệu suất chiếu từ Catalog Service...
                  </td>
                </tr>
              ) : filteredShowtimes.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-text-muted)' }}>
                    Không tìm thấy suất chiếu nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedShowtimes.map(st => {
                  const statusInfo = STATUS_COLOR_MAP[st.status] || {
                    bg: 'rgba(59, 130, 246, 0.15)',
                    text: '#60a5fa',
                    border: '#3b82f6',
                    label: st.status || 'OPEN'
                  };

                  const isRoomMaintenance = st.roomStatus === 'MAINTENANCE';

                  return (
                    <tr key={st.id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{st.date}</strong>
                      </td>
                      <td>
                        <span className="status-pill info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {st.startTime} — {st.endTime}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#fff' }}>{st.movieTitle}</strong>
                      </td>
                      <td>
                        <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{st.cinemaName}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600 }}>{st.roomName}</span>
                          {isRoomMaintenance && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}
                              title="Phòng chiếu này đang bảo trì kỹ thuật, người dùng không thể đặt vé"
                            >
                              <AlertTriangle size={11} /> Bảo trì
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: '#e2e8f0'
                        }}>
                          {st.format || '2D'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#34d399' }}>
                          {Number(st.basePrice || 0).toLocaleString('vi-VN')} đ
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: '#94a3b8', fontSize: '0.84rem' }}>
                          {st.availableSeats != null ? `${st.availableSeats} chỗ` : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: statusInfo.bg,
                          color: statusInfo.text,
                          border: `1px solid ${statusInfo.border}`
                        }}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION BAR) ─── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          borderTop: '1px solid var(--admin-border)',
          background: 'rgba(255,255,255,0.015)',
          fontSize: '0.82rem',
          color: 'var(--admin-text-secondary)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            Hiển thị <strong style={{ color: '#fff' }}>
              {filteredShowtimes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong> đến <strong style={{ color: '#fff' }}>
              {Math.min(currentPage * pageSize, filteredShowtimes.length)}
            </strong> trong tổng số <strong style={{ color: '#fff' }}>{filteredShowtimes.length}</strong> suất chiếu
            {filteredShowtimes.length !== showtimes.length && (
              <span style={{ marginLeft: 6, color: 'var(--admin-text-muted)' }}>
                (lọc từ {showtimes.length} suất ban đầu)
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--admin-bg-input, #1e293b)',
                  border: '1px solid var(--admin-border, #334155)',
                  color: currentPage <= 1 ? '#475569' : '#cbd5e1',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <ChevronLeft size={14} /> Trước
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
                          padding: '6px 11px',
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
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'var(--admin-bg-input, #1e293b)',
                  border: '1px solid var(--admin-border, #334155)',
                  color: currentPage >= totalPages ? '#475569' : '#cbd5e1',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ShowtimeModal
          movies={movies}
          cinemas={cinemas}
          existingShowtimes={showtimes}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveShowtime}
        />
      )}

      {isImportModalOpen && (
        <ExcelImportShowtimeModal
          movies={movies}
          cinemas={cinemas}
          onClose={() => setIsImportModalOpen(false)}
          onImportDone={() => {
            showNotice('success', 'Đã cập nhật lịch chiếu sau khi import thành công.');
            loadData();
          }}
        />
      )}
    </div>
  );
}