import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ticket, QrCode, Check, X, Search, RefreshCw, RotateCcw,
  CheckCircle, AlertCircle, Eye, Download, ChevronLeft, ChevronRight,
  Filter, Calendar, Phone, Mail, User
} from 'lucide-react';
import QrScannerModal from '../components/QrScannerModal';
import { AdminApi } from '../services/adminApi';
import { realtime, REALTIME_EVENTS } from '../services/realtimeService';
import { exportBookingsToExcel } from '../services/exportExcel';

export default function BookingsAdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [checkinFilter, setCheckinFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchBookings = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      // Nạp danh sách vé từ backend
      const data = await AdminApi.searchBookings(searchQuery, 0, 200);
      setBookings(data);
    } catch (err) {
      showNotice('error', 'Lỗi tải danh sách vé: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(keyword);

    const unsubscribe = realtime.subscribe((msg) => {
      if (msg.type === REALTIME_EVENTS.TICKET_CHECKED_IN) {
        const id = msg.payload?.bookingId;
        if (id) {
          setBookings(prev => prev.map(b => b.id === id ? { ...b, checkinStatus: 'CHECKED_IN', rawStatus: 'USED', status: 'USED' } : b));
          showNotice('success', `Cổng soát vé vừa quét thành công đơn vé #${id}`);
        }
      }
      if (msg.type === REALTIME_EVENTS.BOOKING_REFUNDED) {
        const id = msg.payload?.bookingId;
        if (id) {
          setBookings(prev => prev.map(b => b.id === id ? { ...b, checkinStatus: 'REFUNDED', rawStatus: 'REFUNDED', status: 'REFUNDED' } : b));
        }
      }
      if (msg.type === REALTIME_EVENTS.PAYMENT_CONFIRMED || msg.type === REALTIME_EVENTS.BOOKING_CREATED) {
        fetchBookings(keyword);
      }
    });

    return () => unsubscribe();
  }, [fetchBookings, keyword]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(keyword);
  };

  const handleCheckIn = async (bookingId) => {
    setActionLoadingId(bookingId);
    try {
      await AdminApi.adminCheckIn(bookingId);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkinStatus: 'CHECKED_IN', rawStatus: 'USED', status: 'USED' } : b));
      showNotice('success', `Đã soát vé thành công cho đơn #${bookingId}. Khách được vào phòng chiếu.`);
    } catch (err) {
      showNotice('error', 'Soát vé thất bại: ' + (err.message || 'Vé không hợp lệ hoặc đã qua sử dụng.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefund = async (bookingId) => {
    if (!window.confirm(`Xác nhận hoàn vé và hủy đơn #${bookingId}? Ghế và voucher sẽ được tự động giải phóng.`)) {
      return;
    }
    setActionLoadingId(bookingId);
    try {
      await AdminApi.adminRefund(bookingId);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkinStatus: 'REFUNDED', rawStatus: 'REFUNDED', status: 'REFUNDED' } : b));
      showNotice('success', `Đã hoàn vé #${bookingId} thành công. Toàn bộ ghế đã được mở lại cho khách khác.`);
    } catch (err) {
      showNotice('error', 'Hoàn vé thất bại: ' + (err.message || 'Không thể hoàn vé đơn này.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── BỘ LỌC ĐA CHIỀU TRÊN CLIENT ───
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Keyword: mã vé, tên, sđt, email, phim, rạp
      const q = keyword.trim().toLowerCase();
      if (q) {
        const mId = String(b.id || '').toLowerCase().includes(q);
        const mName = String(b.userName || '').toLowerCase().includes(q);
        const mPhone = String(b.userPhone || '').toLowerCase().includes(q);
        const mEmail = String(b.userEmail || '').toLowerCase().includes(q);
        const mMovie = String(b.movieTitle || '').toLowerCase().includes(q);
        const mCinema = String(b.cinemaName || '').toLowerCase().includes(q);
        if (!mId && !mName && !mPhone && !mEmail && !mMovie && !mCinema) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'ALL') {
        const raw = b.rawStatus || b.status;
        if (statusFilter === 'PAID') {
          if (raw !== 'PAID' && raw !== 'CONFIRMED') return false;
        } else if (raw !== statusFilter) {
          return false;
        }
      }

      // 3. Check-in status filter
      if (checkinFilter !== 'ALL') {
        if (checkinFilter === 'CHECKED_IN') {
          if (b.checkinStatus !== 'CHECKED_IN' && b.rawStatus !== 'USED') return false;
        } else if (checkinFilter === 'PENDING') {
          if (b.checkinStatus === 'CHECKED_IN' || b.rawStatus === 'USED' || b.rawStatus === 'REFUNDED') return false;
        } else if (checkinFilter === 'REFUNDED') {
          if (b.rawStatus !== 'REFUNDED') return false;
        }
      }

      // 4. Date filter (match showtime start date or createdAt)
      if (dateFilter) {
        const dateStr = String(b.showtimeStart || b.createdAt || '');
        if (!dateStr.startsWith(dateFilter)) return false;
      }

      return true;
    });
  }, [bookings, keyword, statusFilter, checkinFilter, dateFilter]);

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, checkinFilter, dateFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  const handleResetFilters = () => {
    setKeyword('');
    setStatusFilter('ALL');
    setCheckinFilter('ALL');
    setDateFilter('');
    setCurrentPage(1);
    fetchBookings('');
  };

  const hasActiveFilters = Boolean(keyword || statusFilter !== 'ALL' || checkinFilter !== 'ALL' || dateFilter);

  return (
    <div className="bookings-admin-page">
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
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Quản Lý Vé Đã Đặt & Soát Vé QR</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Theo dõi trạng thái vé thời gian thực, đối soát thanh toán và hỗ trợ hoàn vé tự động
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-admin-secondary" onClick={() => fetchBookings(keyword)} title="Tải lại">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-admin-secondary" onClick={() => exportBookingsToExcel(filteredBookings)} title="Xuất Excel danh sách đặt vé đang lọc">
              <Download size={15} /> Xuất Excel ({filteredBookings.length})
            </button>
            <button className="btn-admin-primary" onClick={() => setIsQrModalOpen(true)}>
              <QrCode size={16} /> Soát Vé QR (Camera Scanner)
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc nâng cao */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--admin-border)',
          background: 'rgba(255,255,255,0.015)',
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 1fr 1fr auto',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              className="table-search-input"
              style={{ width: '100%', paddingLeft: 36, paddingRight: 32 }}
              placeholder="Tra cứu theo SĐT, Tên, Email hoặc Mã Vé..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchBookings(keyword)}
            />
            {keyword && (
              <button
                type="button"
                onClick={() => { setKeyword(''); fetchBookings(''); }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">💳 Mọi trạng thái thanh toán</option>
              <option value="PAID">Đã thanh toán (PAID/CONFIRMED)</option>
              <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
              <option value="PAYMENT_PENDING">Chờ thanh toán (PENDING)</option>
            </select>
          </div>

          {/* Check-in Door Status Filter */}
          <div>
            <select
              value={checkinFilter}
              onChange={e => setCheckinFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">🚪 Mọi trạng thái vào rạp</option>
              <option value="CHECKED_IN">Đã soát vé (Vào rạp)</option>
              <option value="PENDING">Chưa quét mã QR</option>
              <option value="REFUNDED">Vé đã hủy / hoàn tiền</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: 'var(--admin-bg-input)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                color: '#cbd5e1',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                title="Xóa lọc ngày"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-admin-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              title="Xóa toàn bộ bộ lọc"
            >
              <X size={14} /> Xóa lọc
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Vé</th>
                <th>Khách Hàng (Tên/SĐT/Email)</th>
                <th>Phim</th>
                <th>Rạp & Phòng</th>
                <th>Vị Trí Ghế</th>
                <th>Số Tiền</th>
                <th>Thanh Toán</th>
                <th>Soát Vé Cửa</th>
                <th>Thao Tác Quầy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Đang tải danh sách vé từ máy chủ...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Không tìm thấy đơn vé nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <code style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                        {String(b.id).length > 12 ? `${String(b.id).substring(0, 8)}...` : b.id}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{b.userName || 'Khách vãng lai'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--admin-primary-hover)' }}>{b.userPhone || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{b.userEmail}</div>
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{b.movieTitle}</strong>
                      {b.showtimeStart && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                          Suất: {String(b.showtimeStart).substring(0, 16).replace('T', ' ')}
                        </div>
                      )}
                    </td>
                    <td>{b.cinemaName} • {b.roomName}</td>
                    <td><span className="badge-tag">{Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}</span></td>
                    <td><strong>{Number(b.totalAmount || 0).toLocaleString('vi-VN')}đ</strong></td>
                    <td>
                      <span className={`status-pill ${b.rawStatus === 'PAID' || b.rawStatus === 'CONFIRMED' || b.status === 'PAID' ? 'success' : (b.rawStatus === 'REFUNDED' ? 'danger' : 'warning')}`}>
                        {b.rawStatus === 'CONFIRMED' || b.status === 'PAID' ? 'ĐÃ THANH TOÁN' : (b.rawStatus === 'REFUNDED' ? 'ĐÃ HOÀN TIỀN' : (b.rawStatus || b.status))}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${b.checkinStatus === 'CHECKED_IN' || b.rawStatus === 'USED' ? 'success' : (b.rawStatus === 'REFUNDED' ? 'danger' : 'warning')}`}>
                        {b.checkinStatus === 'CHECKED_IN' || b.rawStatus === 'USED' ? 'ĐÃ VÀO RẠP' : (b.rawStatus === 'REFUNDED' ? 'ĐÃ HỦY' : 'CHƯA QUÉT')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {b.rawStatus !== 'REFUNDED' && b.checkinStatus !== 'CHECKED_IN' && b.rawStatus !== 'USED' && (
                          <button
                            className="btn-admin-primary btn-admin-sm"
                            style={{ background: '#10b981', padding: '4px 8px', fontSize: '0.78rem' }}
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleCheckIn(b.id)}
                            title="Soát vé vào phòng chiếu"
                          >
                            <Check size={13} /> Vào
                          </button>
                        )}
                        {b.rawStatus !== 'REFUNDED' && (
                          <button
                            className="btn-admin-secondary btn-admin-sm"
                            style={{ color: '#ef4444', borderColor: '#ef4444', padding: '4px 8px', fontSize: '0.78rem' }}
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleRefund(b.id)}
                            title="Hoàn vé và hủy chỗ"
                          >
                            <RotateCcw size={13} /> Hoàn
                          </button>
                        )}
                        <button
                          className="btn-table-icon"
                          onClick={() => setSelectedBooking(b)}
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
              {filteredBookings.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong> đến <strong style={{ color: '#fff' }}>
              {Math.min(currentPage * pageSize, filteredBookings.length)}
            </strong> trong số <strong style={{ color: '#fff' }}>{filteredBookings.length}</strong> đơn vé
            {filteredBookings.length !== bookings.length && (
              <span style={{ marginLeft: 6, color: 'var(--admin-text-muted)' }}>
                (lọc từ {bookings.length} vé ban đầu)
              </span>
            )}
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
                <option value={20}>20</option>
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-admin-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-admin-header">
              <h3 style={{ color: '#fff' }}>Chi Tiết Vé #{selectedBooking.id}</h3>
              <button onClick={() => setSelectedBooking(null)} style={{ color: 'var(--admin-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-admin-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8,
                border: '1px solid var(--admin-border)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: 4 }}>THÔNG TIN PHIM & LỊCH CHIẾU</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{selectedBooking.movieTitle}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-primary-hover)', marginTop: 4 }}>
                  {selectedBooking.cinemaName} — {selectedBooking.roomName}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: 4 }}>
                  Suất chiếu: <strong>{selectedBooking.showtimeStart ? String(selectedBooking.showtimeStart).substring(0, 16).replace('T', ' ') : 'N/A'}</strong>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8,
                border: '1px solid var(--admin-border)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginBottom: 4 }}>THÔNG TIN KHÁCH HÀNG</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#fff' }}>
                  <User size={14} /> {selectedBooking.userName || 'Khách vãng lai'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#93c5fd', marginTop: 4 }}>
                  <Phone size={14} /> {selectedBooking.userPhone || 'Chưa cung cấp'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                  <Mail size={14} /> {selectedBooking.userEmail}
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8,
                border: '1px solid var(--admin-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>GHẾ ĐÃ CHỌN</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '1rem', marginTop: 2 }}>
                    {Array.isArray(selectedBooking.seats) ? selectedBooking.seats.join(', ') : selectedBooking.seats}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>TỔNG TIỀN</div>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '1.05rem', marginTop: 2 }}>
                    {Number(selectedBooking.totalAmount || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div>
                  Trạng thái soát vé: <strong style={{ color: selectedBooking.checkinStatus === 'CHECKED_IN' ? '#34d399' : '#f59e0b' }}>
                    {selectedBooking.checkinStatus === 'CHECKED_IN' ? 'Đã vào rạp' : 'Chưa quét'}
                  </strong>
                </div>
                {selectedBooking.rawStatus !== 'REFUNDED' && (
                  <button
                    className="btn-admin-secondary"
                    style={{ color: '#ef4444', borderColor: '#ef4444', padding: '6px 14px' }}
                    onClick={() => {
                      handleRefund(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                  >
                    <RotateCcw size={14} /> Hủy & Hoàn vé
                  </button>
                )}
              </div>
            </div>
            <div className="modal-admin-footer">
              <button className="btn-admin-secondary" onClick={() => setSelectedBooking(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isQrModalOpen && (
        <QrScannerModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onSuccessCheckIn={(bookingId, verifyResult) => {
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkinStatus: 'CHECKED_IN', rawStatus: 'USED', status: 'USED' } : b));
            const seatStr = verifyResult?.booking?.seats ? (Array.isArray(verifyResult.booking.seats) ? verifyResult.booking.seats.join(', ') : verifyResult.booking.seats) : '';
            showNotice('success', `Đã quét QR và duyệt soát vé thành công: Đơn #${bookingId}${seatStr ? ` (Ghế: ${seatStr})` : ''}`);
          }}
          onErrorCheckIn={(errorMsg, code) => {
            showNotice('error', `Soát vé thất bại: ${errorMsg}`);
          }}
        />
      )}
    </div>
  );
}