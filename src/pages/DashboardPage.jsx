import React from 'react';
import {
  DollarSign, Ticket, Calendar, Users, TrendingUp,
  Flame, ArrowUpRight, Film, ShieldCheck
} from 'lucide-react';
import { DASHBOARD_STATS, INITIAL_MOVIES, INITIAL_BOOKINGS } from '../data/adminMockData';

export default function DashboardPage() {
  const stats = DASHBOARD_STATS;
  const topMovies = [...INITIAL_MOVIES].sort((a, b) => b.revenue - a.revenue).slice(0, 4);

  return (
    <div className="dashboard-page">
      {/* KPI Cards Grid */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Doanh thu hôm nay</div>
            <div className="kpi-value">{stats.revenueToday.toLocaleString('vi-VN')}đ</div>
            <div className="kpi-growth">
              <TrendingUp size={14} /> {stats.growthRevenue} so với hôm qua
            </div>
          </div>
          <div className="kpi-icon-box" style={{ background: 'rgba(225, 29, 72, 0.15)', color: '#f43f5e' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Vé đã xuất hôm nay</div>
            <div className="kpi-value">{stats.ticketsSoldToday.toLocaleString('vi-VN')}</div>
            <div className="kpi-growth">
              <TrendingUp size={14} /> {stats.growthTickets} lượng đặt vé
            </div>
          </div>
          <div className="kpi-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Ticket size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Suất chiếu đang chạy</div>
            <div className="kpi-value">{stats.activeShowtimes}</div>
            <div className="kpi-growth" style={{ color: '#94a3b8' }}>
              Trên 3 cụm rạp hoạt động
            </div>
          </div>
          <div className="kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Tỷ lệ lấp đầy ghế</div>
            <div className="kpi-value">{stats.occupancyRate}</div>
            <div className="kpi-growth">
              <TrendingUp size={14} /> {stats.growthOccupancy} hiệu suất rạp
            </div>
          </div>
          <div className="kpi-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* 2-Column: Revenue Chart + Top Movies */}
      <div className="dashboard-2col">
        {/* Weekly Revenue Bar Graph */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Doanh Thu 7 Ngày Gần Nhất</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                Đỉnh điểm vào thứ 4 (Flash Sale) và cuối tuần
              </p>
            </div>
            <span className="status-pill success">Tăng trưởng ổn định</span>
          </div>

          <div className="revenue-bars">
            {stats.weeklyRevenue.map((item, idx) => (
              <div key={idx} className="bar-col">
                <span className="bar-amount">{item.label}</span>
                <div
                  className="bar-fill"
                  style={{ height: `${(item.amount / 400) * 100}%` }}
                  title={`Doanh thu: ${item.amount} triệu`}
                />
                <span className="bar-day">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Grossing Movies */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={18} color="var(--admin-primary)" />
              Top Phim Doanh Thu
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topMovies.map((m, idx) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={m.posterUrl} alt={m.title} style={{ width: 38, height: 50, borderRadius: 6, objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-primary-hover)', fontWeight: 600 }}>
                    {(m.revenue / 1000000).toLocaleString('vi-VN')} triệu VNĐ
                  </div>
                </div>
                <span className="status-pill info">#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Feed */}
      <div className="table-panel">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Đơn Vé Mới Nhất (Real-time Stream)</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Tự động đồng bộ với Kafka / Booking Service
          </span>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Phim</th>
                <th>Rạp & Phòng</th>
                <th>Ghế</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_BOOKINGS.map(b => (
                <tr key={b.id}>
                  <td><strong style={{ color: '#fff' }}>{b.id}</strong></td>
                  <td>{b.userEmail}</td>
                  <td>{b.movieTitle}</td>
                  <td>{b.cinemaName} • {b.roomName}</td>
                  <td><span className="badge-tag">{b.seats.join(', ')}</span></td>
                  <td>{b.totalAmount.toLocaleString('vi-VN')}đ</td>
                  <td>
                    <span className={`status-pill ${b.status === 'PAID' ? 'success' : 'warning'}`}>
                      {b.status === 'PAID' ? 'Đã thanh toán' : 'Giữ chỗ (Holding)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}