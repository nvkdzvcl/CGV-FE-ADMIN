import {
  DASHBOARD_STATS, INITIAL_MOVIES, INITIAL_CINEMAS,
  INITIAL_SHOWTIMES, INITIAL_BOOKINGS, INITIAL_RENTALS,
  INITIAL_PROMOTIONS, INITIAL_USERS, INITIAL_PAYMENTS
} from '../data/adminMockData';

const API_BASE = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

export const AdminApi = {
  getDashboardStats: async () => DASHBOARD_STATS,
  
  getMovies: async () => INITIAL_MOVIES,
  getCinemas: async () => INITIAL_CINEMAS,
  getShowtimes: async () => INITIAL_SHOWTIMES,
  getBookings: async () => INITIAL_BOOKINGS,
  getRentals: async () => INITIAL_RENTALS,
  getPromotions: async () => INITIAL_PROMOTIONS,
  getUsers: async () => INITIAL_USERS,
  getPayments: async () => INITIAL_PAYMENTS,

  // Ticket check-in verification
  verifyTicketQr: async (ticketCode) => {
    const booking = INITIAL_BOOKINGS.find(b => b.id.toUpperCase() === ticketCode.trim().toUpperCase());
    if (!booking) {
      return { valid: false, message: 'Mã vé không tồn tại trên hệ thống.' };
    }
    if (booking.status !== 'PAID') {
      return { valid: false, message: 'Vé chưa được thanh toán thành công.' };
    }
    if (booking.checkinStatus === 'CHECKED_IN') {
      return { valid: false, message: 'Vé đã được quét sử dụng trước đó.' };
    }
    booking.checkinStatus = 'CHECKED_IN';
    return { valid: true, booking, message: 'Xác thực vé thành công! Cho phép vào phòng chiếu.' };
  },

  // Batch Job Simulator (1M Vouchers)
  triggerBatchImport: (onProgress, onDone) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        onDone({
          jobId: 'BATCH-JOB-' + Math.floor(Math.random() * 10000),
          processedRows: 1000000,
          status: 'COMPLETED',
          executionTimeMs: 1420
        });
      }
    }, 400);
  }
};