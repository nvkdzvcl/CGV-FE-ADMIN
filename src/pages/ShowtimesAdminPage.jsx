import React, { useState } from 'react';
import { CalendarDays, Plus, Clock, AlertTriangle } from 'lucide-react';
import ShowtimeModal from '../components/ShowtimeModal';
import { INITIAL_SHOWTIMES } from '../data/adminMockData';

export default function ShowtimesAdminPage() {
  const [showtimes, setShowtimes] = useState(INITIAL_SHOWTIMES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveShowtime = (newShowtime) => {
    setShowtimes([newShowtime, ...showtimes]);
  };

  return (
    <div className="showtimes-admin-page">
      <div className="table-panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Điều Phối Lịch Chiếu (Showtimes)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
              Tự động kiểm tra xung đột khung giờ và xếp phòng
            </p>
          </div>

          <button className="btn-admin-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Thêm Suất Chiếu
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Ngày Chiếu</th>
                <th>Khung Giờ</th>
                <th>Tên Phim</th>
                <th>Cụm Rạp</th>
                <th>Phòng Chiếu</th>
                <th>Giá Sàn (base_price)</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {showtimes.map(st => (
                <tr key={st.id}>
                  <td><strong>{st.date}</strong></td>
                  <td>
                    <span className="status-pill info">
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {st.startTime} — {st.endTime}
                    </span>
                  </td>
                  <td><strong style={{ color: '#fff' }}>{st.movieTitle}</strong></td>
                  <td>{st.cinemaName}</td>
                  <td>{st.roomName}</td>
                  <td>{st.basePrice.toLocaleString('vi-VN')} đ</td>
                  <td>
                    <span className={`status-pill ${st.status === 'COMPLETED' ? 'info' : 'success'}`}>
                      {st.status === 'COMPLETED' ? 'Đã chiếu xong' : 'Đang mở bán'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ShowtimeModal
          existingShowtimes={showtimes}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveShowtime}
        />
      )}
    </div>
  );
}