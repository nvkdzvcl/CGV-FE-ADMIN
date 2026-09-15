import React, { useState } from 'react';
import { Ticket, QrCode, Building, Check, X } from 'lucide-react';
import QrScannerModal from '../components/QrScannerModal';
import { INITIAL_BOOKINGS, INITIAL_RENTALS } from '../data/adminMockData';

export default function BookingsAdminPage() {
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [rentals, setRentals] = useState(INITIAL_RENTALS);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleApproveRental = (id) => {
    setRentals(rentals.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
  };

  const handleRejectRental = (id) => {
    setRentals(rentals.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
  };

  return (
    <div className="bookings-admin-page">
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          className={`btn-admin-secondary ${tab === 'bookings' ? 'btn-admin-primary' : ''}`}
          onClick={() => setTab('bookings')}
        >
          <Ticket size={16} /> Đơn Vé & Soát Vé Quầy
        </button>
        <button
          className={`btn-admin-secondary ${tab === 'rentals' ? 'btn-admin-primary' : ''}`}
          onClick={() => setTab('rentals')}
        >
          <Building size={16} /> Đơn Thuê Rạp Sự Kiện ({rentals.filter(r => r.status === 'PENDING').length})
        </button>
      </div>

      {tab === 'bookings' ? (
        <div className="table-panel">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Danh Sách Đơn Đặt Vé</h3>
            <button className="btn-admin-primary" onClick={() => setIsQrModalOpen(true)}>
              <QrCode size={16} /> Soát Vé QR (Box Office Staff)
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Mã Vé</th>
                  <th>Khách Hàng</th>
                  <th>Phim</th>
                  <th>Rạp & Phòng</th>
                  <th>Vị Trí Ghế</th>
                  <th>Số Tiền</th>
                  <th>Thanh Toán</th>
                  <th>Soát Vé Cửa</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><code>{b.id}</code></td>
                    <td>{b.userEmail}</td>
                    <td><strong style={{ color: '#fff' }}>{b.movieTitle}</strong></td>
                    <td>{b.cinemaName} • {b.roomName}</td>
                    <td><span className="badge-tag">{b.seats.join(', ')}</span></td>
                    <td>{b.totalAmount.toLocaleString('vi-VN')}đ</td>
                    <td>
                      <span className={`status-pill ${b.status === 'PAID' ? 'success' : 'warning'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${b.checkinStatus === 'CHECKED_IN' ? 'success' : 'danger'}`}>
                        {b.checkinStatus === 'CHECKED_IN' ? 'Đã vào rạp' : 'Chưa quét vé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="table-panel">
          <div className="table-toolbar">
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Đơn Đăng Ký Thuê Rạp Sự Kiện</h3>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Đơn Vị Đăng Ký</th>
                  <th>Liên Hệ</th>
                  <th>Cụm Rạp</th>
                  <th>Dịch Vụ Yêu Cầu</th>
                  <th>Số Lượng Khách</th>
                  <th>Ngày Thuê</th>
                  <th>Trạng Thái</th>
                  <th>Xử Lý Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map(r => (
                  <tr key={r.id}>
                    <td><strong style={{ color: '#fff' }}>{r.contactName}</strong></td>
                    <td>{r.phone} • {r.email}</td>
                    <td>{r.cinemaName}</td>
                    <td>{r.serviceType}</td>
                    <td>{r.guestCount} khách</td>
                    <td>{r.rentalDate}</td>
                    <td>
                      <span className={`status-pill ${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'info'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-admin-primary btn-admin-sm"
                            style={{ background: '#10b981' }}
                            onClick={() => handleApproveRental(r.id)}
                            title="Duyệt đơn"
                          >
                            <Check size={14} /> Duyệt
                          </button>
                          <button
                            className="btn-table-icon delete"
                            onClick={() => handleRejectRental(r.id)}
                            title="Từ chối"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isQrModalOpen && (
        <QrScannerModal onClose={() => setIsQrModalOpen(false)} />
      )}
    </div>
  );
}