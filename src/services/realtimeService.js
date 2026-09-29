// Realtime SSE & Broadcast Channel Bus for CGV Admin System
const CHANNEL_NAME = 'cgv_realtime_channel';
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_GATEWAY_URL) || 'http://localhost:8000';

export const REALTIME_EVENTS = {
  MOVIE_STATUS_CHANGED: 'MOVIE_STATUS_CHANGED',
  CINEMA_STATUS_CHANGED: 'CINEMA_STATUS_CHANGED',
  ROOM_STATUS_CHANGED: 'ROOM_STATUS_CHANGED',
  SHOWTIME_CHANGED: 'SHOWTIME_CHANGED',
  TICKET_CHECKED_IN: 'TICKET_CHECKED_IN',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_REFUNDED: 'BOOKING_REFUNDED',
  BOOKING_CREATED: 'BOOKING_CREATED'
};

class RealtimeService {
  constructor() {
    this.subscribers = new Set();
    this.channel = null;
    this.catalogEventSource = null;
    this.bookingEventSource = null;
    this.reconnectTimerCatalog = null;
    this.reconnectTimerBooking = null;

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data) {
              this.notify(event.data);
            }
          };
        }
      } catch (e) {
        console.warn('[Admin Realtime] BroadcastChannel init error:', e);
      }

      // Storage event fallback for cross-tab sync
      window.addEventListener('storage', (e) => {
        if (e.key === 'cgv_realtime_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notify(data);
          } catch (err) {
            // ignore
          }
        }
      });

      // Connect to backend SSE streams
      this.initCatalogSse();
      this.initBookingSse();
    }
  }

  initCatalogSse() {
    if (typeof window === 'undefined') return;
    try {
      if (this.catalogEventSource) {
        this.catalogEventSource.close();
      }

      const sseUrl = `${API_BASE}/api/v1/catalogs/realtime/stream`;
      this.catalogEventSource = new EventSource(sseUrl);

      this.catalogEventSource.onopen = () => {
        this.isCatalogConnected = true;
        console.log('%c[Admin Realtime] 🟢 Đã kết nối Catalog SSE Stream thành công:', 'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 6px; border-radius: 4px;', sseUrl);
        this.notify({ type: 'SSE_STATUS_CHANGED', payload: { service: 'catalog', connected: true } });
      };

      const handleCatalogEvent = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          const type = parsed.type || e.type;
          if (type === 'CONNECTED') {
            console.log('[Admin Realtime] Handshake OK:', parsed.payload);
            return;
          }
          if (type === 'PING') return;
          console.log(`%c[Admin Realtime SSE] ⚡ Nhận sự kiện: ${type}`, 'color: #38bdf8; font-weight: bold;', parsed.payload || parsed);
          this.notify({
            type,
            payload: parsed.payload || parsed,
            timestamp: parsed.timestamp || Date.now(),
            source: 'BACKEND_CATALOG_SSE'
          });
        } catch (err) {
          // ignore parse errors for ping
        }
      };

      this.catalogEventSource.onmessage = handleCatalogEvent;
      this.catalogEventSource.addEventListener('MOVIE_STATUS_CHANGED', handleCatalogEvent);
      this.catalogEventSource.addEventListener('CINEMA_STATUS_CHANGED', handleCatalogEvent);
      this.catalogEventSource.addEventListener('ROOM_STATUS_CHANGED', handleCatalogEvent);
      this.catalogEventSource.addEventListener('SHOWTIME_CHANGED', handleCatalogEvent);

      this.catalogEventSource.onerror = (err) => {
        this.isCatalogConnected = false;
        console.warn('[Admin Realtime] ⚠️ Mất kết nối Catalog SSE, sẽ thử kết nối lại sau 5s...');
        this.notify({ type: 'SSE_STATUS_CHANGED', payload: { service: 'catalog', connected: false } });
        this.catalogEventSource.close();
        clearTimeout(this.reconnectTimerCatalog);
        this.reconnectTimerCatalog = setTimeout(() => this.initCatalogSse(), 5000);
      };
    } catch (e) {
      console.warn('[Admin Realtime] SSE Catalog connection failed:', e);
    }
  }

  initBookingSse() {
    if (typeof window === 'undefined') return;
    try {
      if (this.bookingEventSource) {
        this.bookingEventSource.close();
      }

      const sseUrl = `${API_BASE}/api/v1/bookings/realtime/stream`;
      this.bookingEventSource = new EventSource(sseUrl);

      this.bookingEventSource.onopen = () => {
        this.isBookingConnected = true;
        console.log('%c[Admin Realtime] 🟢 Đã kết nối Booking & Soát vé SSE Stream:', 'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 6px; border-radius: 4px;', sseUrl);
        this.notify({ type: 'SSE_STATUS_CHANGED', payload: { service: 'booking', connected: true } });
      };

      const handleBookingEvent = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          const type = parsed.type || e.type;
          if (type === 'CONNECTED') {
            console.log('[Admin Realtime Booking] Handshake OK:', parsed.payload);
            return;
          }
          if (type === 'PING') return;
          console.log(`%c[Admin Realtime SSE] 🎫 Nhận sự kiện Vé: ${type}`, 'color: #f59e0b; font-weight: bold;', parsed.payload || parsed);
          this.notify({
            type,
            payload: parsed.payload || parsed,
            timestamp: parsed.timestamp || Date.now(),
            source: 'BACKEND_BOOKING_SSE'
          });
        } catch (err) {
          // ignore
        }
      };

      this.bookingEventSource.onmessage = handleBookingEvent;
      this.bookingEventSource.addEventListener('TICKET_CHECKED_IN', handleBookingEvent);
      this.bookingEventSource.addEventListener('PAYMENT_CONFIRMED', handleBookingEvent);
      this.bookingEventSource.addEventListener('BOOKING_REFUNDED', handleBookingEvent);

      this.bookingEventSource.onerror = () => {
        this.isBookingConnected = false;
        console.warn('[Admin Realtime] ⚠️ Mất kết nối Booking SSE, sẽ thử kết nối lại sau 5s...');
        this.notify({ type: 'SSE_STATUS_CHANGED', payload: { service: 'booking', connected: false } });
        this.bookingEventSource.close();
        clearTimeout(this.reconnectTimerBooking);
        this.reconnectTimerBooking = setTimeout(() => this.initBookingSse(), 5000);
      };
    } catch (e) {
      console.warn('[Admin Realtime] SSE Booking connection failed:', e);
    }
  }

  notify(data) {
    this.subscribers.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error('[Admin Realtime] Error in subscriber callback:', err);
      }
    });
  }

  emit(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      sender: 'FE-ADMIN'
    };

    // Notify local subscribers in this tab
    this.notify(message);

    // Broadcast to other tabs via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('[Admin Realtime] postMessage error:', err);
      }
    }

    // Storage fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cgv_realtime_event', JSON.stringify(message));
      } catch (e) {}
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

export const realtime = new RealtimeService();
