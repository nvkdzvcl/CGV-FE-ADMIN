import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Building2, Plus, Edit2, Trash2, RefreshCw, CheckCircle, AlertCircle, MapPin, X, Check, Wrench, Power, Search, ChevronRight, ChevronLeft, Navigation, Map, Filter } from 'lucide-react';
import { AdminApi } from '../services/adminApi';
import SeatsManagementModal from '../components/SeatsManagementModal';
import { VN_PROVINCES, getAllWardsOfProvince } from '../data/vietnamAddressData';
import { realtime, REALTIME_EVENTS } from '../services/realtimeService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_VI = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngưng hoạt động',
  MAINTENANCE: 'Đang bảo trì',
  SEAT_RESERVED: 'Ghế đang được giữ',
  OPEN: 'Đang mở',
  CLOSED: 'Đã đóng',
  FULL: 'Hết chỗ',
};

const STATUS_COLOR = {
  ACTIVE: 'success',
  OPEN: 'success',
  INACTIVE: 'danger',
  CLOSED: 'danger',
  MAINTENANCE: 'warning',
  FULL: 'warning',
  SEAT_RESERVED: 'info',
};

const ROOM_FORMATS = ['2D', '3D', 'IMAX', '4DX', 'GOLD_CLASS', 'SCREENX'];

const EMPTY_CINEMA = { name: '', address: '', city: '', phoneNumber: '', latitude: '', longitude: '', status: 'ACTIVE' };
const EMPTY_ROOM = { name: '', capacity: 120, format: '2D', status: 'ACTIVE' };

function Toast({ notification }) {
  if (!notification) return null;
  return (
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
  );
}

function CinemaMapPicker({ lat, lng, onChangeCoordinates }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const initialLat = parseFloat(lat) || 10.77613;
    const initialLng = parseFloat(lng) || 106.70098;

    const cinemaIcon = L.divIcon({
      className: 'custom-cinema-marker',
      html: `<div style="
        background: #e11d48;
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(225,29,72,0.6);
        border: 2px solid #ffffff;
      "><span style="transform: rotate(45deg); font-size: 15px; line-height: 1;">🎬</span></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        icon: cinemaIcon,
        draggable: true
      }).addTo(map);

      marker.bindPopup(`<b>Vị trí rạp</b><br>Kéo ghim hoặc click trên bản đồ để đổi vị trí`).openPopup();

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onChangeCoordinates(pos.lat.toFixed(6), pos.lng.toFixed(6));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        marker.openPopup();
        onChangeCoordinates(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([parsedLat, parsedLng]);
      mapInstanceRef.current.panTo([parsedLat, parsedLng]);
    }
  }, [lat, lng]);

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: '#0b1120', marginBottom: 16 }}>
      <div style={{
        padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.82rem'
      }}>
        <span style={{ color: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={15} color="#e11d48" /> Bản đồ vị trí (Click/chạm bất kỳ điểm nào hoặc kéo ghim để chọn tọa độ)
        </span>
        <a
          href={`https://maps.google.com/?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: '0.78rem',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
            fontWeight: 600,
            background: 'rgba(56,189,248,0.1)',
            padding: '3px 10px',
            borderRadius: 6,
            border: '1px solid rgba(56,189,248,0.3)'
          }}
        >
          Mở trên Google Maps ↗
        </a>
      </div>
      <div ref={mapContainerRef} style={{ height: 260, width: '100%', zIndex: 1 }} />
      <div style={{
        padding: '7px 14px', background: 'rgba(15,23,42,0.95)',
        fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>Tọa độ đã ghim: <strong style={{ color: '#34d399' }}>{lat || '—'}, {lng || '—'}</strong></span>
        <span style={{ color: '#93c5fd' }}>💡 Click bất kỳ vị trí nào trên bản đồ để tự động lấy tọa độ</span>
      </div>
    </div>
  );
}

function CinemaModal({ cinema, onClose, onSave }) {
  const isEdit = Boolean(cinema?.id);

  const initProvince = cinema?.province || cinema?.city || 'TP. Hồ Chí Minh';
  const [form, setForm] = useState({
    name: cinema?.name || '',
    building: cinema?.building || '',
    floor: cinema?.floor || '',
    province: initProvince,
    district: cinema?.district || 'Quận 1',
    ward: cinema?.ward || 'Phường Bến Nghé',
    city: initProvince,
    phoneNumber: cinema?.phone || cinema?.phoneNumber || '',
    openingHours: cinema?.openingHours || '08:00 - 24:00',
    latitude: cinema?.latitude ? String(cinema.latitude) : '10.776130',
    longitude: cinema?.longitude ? String(cinema.longitude) : '106.700981',
    status: cinema?.status || 'ACTIVE',
  });

  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);

  // Dữ liệu phân cấp duy nhất: Tỉnh / Thành phố -> Quận / Huyện -> Phường / Xã
  const selectedProvinceData = VN_PROVINCES.find(p => p.name === form.province) || VN_PROVINCES[0];
  const availableDistricts = selectedProvinceData?.districts || [];
  const selectedDistrictData = availableDistricts.find(d => d.name === form.district) || availableDistricts[0];
  const availableWards = selectedDistrictData?.wards || [];

  const handleProvinceChange = (provinceName) => {
    const pData = VN_PROVINCES.find(p => p.name === provinceName);
    const firstDist = pData?.districts?.[0];
    const firstWard = firstDist?.wards?.[0] || '';
    setForm(prev => ({
      ...prev,
      province: provinceName,
      city: provinceName,
      district: firstDist?.name || '',
      ward: firstWard,
      latitude: pData?.lat ? pData.lat.toFixed(6) : prev.latitude,
      longitude: pData?.lng ? pData.lng.toFixed(6) : prev.longitude
    }));
  };

  const handleDistrictChange = (districtName) => {
    const dData = availableDistricts.find(d => d.name === districtName);
    const firstWard = dData?.wards?.[0] || '';
    setForm(prev => ({
      ...prev,
      district: districtName,
      ward: firstWard
    }));
  };

  const handleWardChange = (wardName) => {
    setForm(prev => ({ ...prev, ward: wardName }));
  };

  const buildAddress = () => {
    const parts = [
      form.building && form.floor ? `Tầng ${form.floor}, ${form.building}` : form.building,
      form.ward,
      form.district,
      form.province || form.city
    ].filter(Boolean);
    return parts.join(', ');
  };

  const fullAddress = buildAddress();

  const handleGeocode = async () => {
    const addr = fullAddress;
    if (!addr.trim()) { setGeocodeError('Vui lòng chọn hoặc nhập địa chỉ trước!'); return; }
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const query = encodeURIComponent(addr + ', Vietnam');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=vn`,
        { headers: { 'Accept-Language': 'vi', 'User-Agent': 'CGV-Admin/1.0' } }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        const fallbackQuery = encodeURIComponent(`${form.ward || form.district}, ${form.province}, Vietnam`);
        const fbRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1&countrycodes=vn`,
          { headers: { 'Accept-Language': 'vi', 'User-Agent': 'CGV-Admin/1.0' } }
        );
        const fbData = await fbRes.json();
        if (fbData && fbData.length > 0) {
          const { lat, lon } = fbData[0];
          setForm(p => ({ ...p, latitude: parseFloat(lat).toFixed(6), longitude: parseFloat(lon).toFixed(6) }));
          return;
        }
        setGeocodeError('Không tìm thấy tọa độ tự động. Bạn có thể kéo ghim trên bản đồ để chọn tọa độ.');
        return;
      }
      const { lat, lon } = data[0];
      setForm(p => ({ ...p, latitude: parseFloat(lat).toFixed(6), longitude: parseFloat(lon).toFixed(6) }));
      setGeocodeError(null);
    } catch (err) {
      setGeocodeError('Lỗi tra cứu: ' + err.message);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      address: fullAddress,
    };
    if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
    if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 740, width: '95vw' }}>
        <div className="modal-admin-header">
          <h3 style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="var(--admin-primary)" />
            {isEdit ? 'Chỉnh sửa cụm rạp' : 'Thêm cụm rạp mới'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
            <div className="form-field">
              <label>Tên cụm rạp *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="CGV Vincom Landmark 81" />
            </div>

            {/* Chọn địa chỉ theo phân cấp duy nhất */}
            <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 14, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                  📍 Địa bàn & Hành chính (Phân cấp Tỉnh ➔ Quận/Huyện ➔ Phường/Xã)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                <div className="form-field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>1. Tỉnh / Thành phố *</label>
                  <select value={form.province} onChange={e => handleProvinceChange(e.target.value)}>
                    {VN_PROVINCES.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>2. Quận / Huyện / TP * ({availableDistricts.length})</label>
                  <select value={form.district} onChange={e => handleDistrictChange(e.target.value)}>
                    {availableDistricts.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>3. Phường / Xã * ({availableWards.length})</label>
                  <select value={form.ward} onChange={e => handleWardChange(e.target.value)}>
                    {availableWards.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Building, Floor, Phone */}
              <div className="form-row" style={{ marginTop: 10 }}>
                <div className="form-field">
                  <label style={{ fontSize: '0.78rem' }}>Tên tòa nhà / Số nhà, Tên đường</label>
                  <input value={form.building} onChange={e => setForm(p => ({ ...p, building: e.target.value }))}
                    placeholder="Landmark 81, 720A Điện Biên Phủ" />
                </div>
                <div className="form-field" style={{ maxWidth: 100 }}>
                  <label style={{ fontSize: '0.78rem' }}>Tầng</label>
                  <input value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
                    placeholder="B1" />
                </div>
                <div className="form-field">
                  <label style={{ fontSize: '0.78rem' }}>Số điện thoại rạp</label>
                  <input value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="1900 6017" />
                </div>
              </div>

              {/* Preview địa chỉ chuẩn */}
              {fullAddress && (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                  Địa chỉ chuẩn hóa: <strong style={{ color: '#fff' }}>{fullAddress}</strong>
                </div>
              )}

              {/* Geocode button */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                <button type="button" className="btn-admin-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  onClick={handleGeocode} disabled={geocoding || !fullAddress.trim()}>
                  {geocoding ? (
                    <><RefreshCw size={13} className="spin" /> Đang tra cứu tọa độ...</>
                  ) : (
                    <><Search size={13} /> Tra cứu tọa độ tự động</>
                  )}
                </button>
                {form.latitude && form.longitude && (
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                    📍 Tọa độ: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                  </span>
                )}
              </div>
              {geocodeError && (
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#f87171' }}>⚠️ {geocodeError}</div>
              )}
            </div>

            {/* Google Maps Preview & Ghim Tọa độ */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, color: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span>🗺️ Bản đồ Google Maps & Ghim Vị trí</span>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress || form.latitude + ',' + form.longitude)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                >
                  Mở trên Google Maps tab mới ↗
                </a>
              </label>

              {/* Google Maps iframe directly showing address location */}
              {fullAddress && (
                <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ padding: '6px 12px', background: '#1e293b', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Google Maps xem trước vị trí: <strong style={{ color: '#fff' }}>{fullAddress}</strong>
                  </div>
                  <iframe
                    title="Google Maps"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="220"
                    style={{ border: 0, display: 'block', background: '#0f172a' }}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Interactive Leaflet Map with Click-to-Pin */}
              <CinemaMapPicker
                lat={form.latitude}
                lng={form.longitude}
                onChangeCoordinates={(newLat, newLng) => {
                  setForm(p => ({ ...p, latitude: newLat, longitude: newLng }));
                }}
              />
            </div>

            {/* Coordinates Lat/Lng input */}
            <div className="form-row">
              <div className="form-field">
                <label>Vĩ độ (Latitude)</label>
                <input type="text" value={form.latitude}
                  onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                  placeholder="10.776130" />
              </div>
              <div className="form-field">
                <label>Kinh độ (Longitude)</label>
                <input type="text" value={form.longitude}
                  onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                  placeholder="106.700981" />
              </div>
            </div>

            <div className="form-field">
              <label>Trạng thái vận hành rạp *</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="ACTIVE">Hoạt động bình thường</option>
                <option value="INACTIVE">Ngưng hoạt động</option>
                <option value="MAINTENANCE">Đang bảo trì kỹ thuật</option>
              </select>
            </div>
          </div>
          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-admin-primary"><Check size={16} /> Lưu cụm rạp</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoomModal({ room, cinemaId, onClose, onSave }) {
  const isEdit = Boolean(room?.id);
  const [form, setForm] = useState({
    name: room?.name || '',
    capacity: room?.capacity || 96,
    format: room?.format || '2D',
    status: room?.status || 'ACTIVE',
  });

  // Seat configuration states for new room
  const [autoInitSeats, setAutoInitSeats] = useState(true);
  const [endRow, setEndRow] = useState('H'); // A -> H (8 rows)
  const [seatsPerRow, setSeatsPerRow] = useState(12); // 12 columns (1 -> 12)
  const [layoutPreset, setLayoutPreset] = useState('CGV_STANDARD'); // CGV_STANDARD | BALANCED | ALL_NORMAL | ALL_VIP

  const rowLetters = useMemo(() => {
    const letters = [];
    const endCharCode = (endRow || 'H').toUpperCase().charCodeAt(0);
    for (let c = 65; c <= endCharCode; c++) {
      letters.push(String.fromCharCode(c));
    }
    return letters;
  }, [endRow]);

  const generatedSeats = useMemo(() => {
    if (!autoInitSeats || isEdit) return [];
    const list = [];
    const totalRows = rowLetters.length;

    rowLetters.forEach((r, rowIdx) => {
      for (let col = 1; col <= Number(seatsPerRow); col++) {
        let type = 'NORMAL';
        if (layoutPreset === 'CGV_STANDARD') {
          if (rowIdx === totalRows - 1) {
            type = 'SWEETBOX';
          } else if (rowIdx >= Math.max(1, Math.floor(totalRows * 0.35))) {
            type = 'VIP';
          } else {
            type = 'NORMAL';
          }
        } else if (layoutPreset === 'BALANCED') {
          if (rowIdx >= Math.floor(totalRows / 2)) {
            type = 'VIP';
          } else {
            type = 'NORMAL';
          }
        } else if (layoutPreset === 'ALL_VIP') {
          type = 'VIP';
        } else {
          type = 'NORMAL';
        }

        list.push({
          rowLabel: r,
          columnNumber: col,
          label: `${r}${col}`,
          seatType: type,
          status: 'ACTIVE'
        });
      }
    });
    return list;
  }, [autoInitSeats, isEdit, rowLetters, seatsPerRow, layoutPreset]);

  // Sync capacity
  useEffect(() => {
    if (!isEdit && autoInitSeats) {
      setForm(p => ({ ...p, capacity: generatedSeats.length }));
    }
  }, [generatedSeats.length, autoInitSeats, isEdit]);

  const normalCount = generatedSeats.filter(s => s.seatType === 'NORMAL').length;
  const vipCount = generatedSeats.filter(s => s.seatType === 'VIP').length;
  const sweetboxCount = generatedSeats.filter(s => s.seatType === 'SWEETBOX').length;

  // Calculate dynamic seat dimensions for preview so it never overflows
  const seatWidth = Math.max(8, Math.min(13, Math.floor(210 / Number(seatsPerRow))));
  const seatHeight = Math.max(7, seatWidth - 2);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      rowCount: rowLetters.length,
      columnCount: Number(seatsPerRow),
      initialSeats: autoInitSeats && !isEdit ? generatedSeats : []
    });
    onClose();
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose} style={{ padding: 16 }}>
      <div
        className="modal-admin-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: isEdit ? 480 : 860,
          width: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.08)'
        }}
      >
        {/* Header */}
        <div className="modal-admin-header" style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
              <Building2 size={18} />
            </div>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>
                {isEdit ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu & Sơ đồ ghế'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                {isEdit ? 'Cập nhật tên, định dạng hoặc trạng thái phòng' : 'Thiết lập thông tin và cấu hình dãy ghế phòng chiếu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--admin-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div
            className="modal-admin-body"
            style={{
              padding: isEdit ? 20 : '18px 22px',
              overflowY: 'auto',
              overflowX: 'hidden',
              maxHeight: 'calc(92vh - 135px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            {isEdit ? (
              /* Single column edit layout */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-field" style={{ minWidth: 0 }}>
                  <label>Tên phòng chiếu *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ví dụ: Cinema 1, IMAX Hall 01..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
                  <div className="form-field" style={{ minWidth: 0 }}>
                    <label>Định dạng phòng</label>
                    <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))} style={{ width: '100%' }}>
                      {ROOM_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-field" style={{ minWidth: 0 }}>
                    <label>Trạng thái</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%' }}>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="MAINTENANCE">Đang bảo trì</option>
                      <option value="INACTIVE">Ngưng hoạt động</option>
                    </select>
                  </div>
                </div>
                <div className="form-field" style={{ minWidth: 0 }}>
                  <label>Sức chứa (Tổng ghế)</label>
                  <input
                    type="number"
                    value={form.capacity || 0}
                    disabled
                    readOnly
                    style={{ opacity: 0.75, cursor: 'not-allowed', background: 'rgba(255,255,255,0.06)', fontWeight: 600, color: '#38bdf8' }}
                  />
                </div>
              </div>
            ) : (
              /* 2-column layout for New Room creation */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
                  gap: 18,
                  alignItems: 'start',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* CỘT TRÁI: THÔNG TIN & THIẾT LẬP DÃY GHẾ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                  {/* Nhóm 1: Thông tin phòng */}
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      1. Thông tin phòng chiếu
                    </div>
                    <div className="form-field" style={{ marginBottom: 10, minWidth: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Tên phòng chiếu *</label>
                      <input
                        required
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ví dụ: Cinema 1, IMAX Hall 01..."
                        style={{ padding: '7px 11px', fontSize: '0.84rem' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
                      <div className="form-field" style={{ minWidth: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Định dạng</label>
                        <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))} style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%' }}>
                          {ROOM_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="form-field" style={{ minWidth: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Trạng thái</label>
                        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ padding: '7px 10px', fontSize: '0.82rem', width: '100%' }}>
                          <option value="ACTIVE">Hoạt động</option>
                          <option value="MAINTENANCE">Đang bảo trì</option>
                          <option value="INACTIVE">Ngưng hoạt động</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Nhóm 2: Cấu hình dãy ghế */}
                  <div style={{ padding: '12px 14px', background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', margin: 0, fontWeight: 700, color: '#93c5fd', fontSize: '0.82rem' }}>
                        <input
                          type="checkbox"
                          checked={autoInitSeats}
                          onChange={e => setAutoInitSeats(e.target.checked)}
                          style={{ width: 15, height: 15, accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                        2. Tự động tạo dãy ghế ban đầu
                      </label>
                      {autoInitSeats && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                          {rowLetters.length} hàng × {seatsPerRow} ghế
                        </span>
                      )}
                    </div>

                    {autoInitSeats && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
                          <div className="form-field" style={{ minWidth: 0 }}>
                            <label style={{ fontSize: '0.76rem' }}>Hàng từ A đến</label>
                            <select value={endRow} onChange={e => setEndRow(e.target.value)} style={{ padding: '7px 8px', fontSize: '0.8rem', width: '100%' }}>
                              <option value="F">Hàng F (6 hàng: A-F)</option>
                              <option value="H">Hàng H (8 hàng: A-H)</option>
                              <option value="J">Hàng J (10 hàng: A-J)</option>
                              <option value="K">Hàng K (11 hàng: A-K)</option>
                              <option value="L">Hàng L (12 hàng: A-L)</option>
                              <option value="M">Hàng M (13 hàng: A-M)</option>
                            </select>
                          </div>
                          <div className="form-field" style={{ minWidth: 0 }}>
                            <label style={{ fontSize: '0.76rem' }}>Số ghế mỗi hàng</label>
                            <select value={seatsPerRow} onChange={e => setSeatsPerRow(Number(e.target.value))} style={{ padding: '7px 8px', fontSize: '0.8rem', width: '100%' }}>
                              <option value={10}>10 ghế/hàng</option>
                              <option value={12}>12 ghế/hàng (Chuẩn)</option>
                              <option value={14}>14 ghế/hàng</option>
                              <option value={16}>16 ghế/hàng</option>
                              <option value={18}>18 ghế/hàng</option>
                              <option value={20}>20 ghế/hàng</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-field" style={{ minWidth: 0 }}>
                          <label style={{ fontSize: '0.76rem' }}>Mẫu phân loại ghế</label>
                          <select value={layoutPreset} onChange={e => setLayoutPreset(e.target.value)} style={{ padding: '7px 8px', fontSize: '0.8rem', width: '100%' }}>
                            <option value="CGV_STANDARD">Chuẩn CGV (Thường, VIP, Sweetbox cuối)</option>
                            <option value="BALANCED">Cân đối (Nửa trước Thường, nửa sau VIP)</option>
                            <option value="ALL_NORMAL">Toàn bộ là ghế Thường (NORMAL)</option>
                            <option value="ALL_VIP">Toàn bộ là ghế VIP (+15k)</option>
                          </select>
                        </div>

                        {/* Sức chứa & Tỷ lệ ghế gọn gàng */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>Sức chứa:</span>
                            <strong style={{ fontSize: '0.88rem', color: '#38bdf8' }}>{form.capacity} ghế</strong>
                          </div>
                          <div style={{ display: 'flex', gap: 6, fontSize: '0.72rem' }}>
                            <span style={{ color: '#cbd5e1' }}>⚪ {normalCount}</span>
                            {vipCount > 0 && <span style={{ color: '#fbbf24' }}>⭐ {vipCount}</span>}
                            {sweetboxCount > 0 && <span style={{ color: '#c084fc' }}>💜 {sweetboxCount}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI: MÔ PHỎNG SƠ ĐỒ RẠP CHIẾU */}
                <div style={{ background: '#070b13', borderRadius: 12, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      🎬 Mô phỏng sơ đồ rạp
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                      Dãy {rowLetters[0]}1 → {rowLetters[rowLetters.length - 1]}{seatsPerRow}
                    </span>
                  </div>

                  {autoInitSeats ? (
                    <>
                      {/* Màn hình cong CGV */}
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ height: 4, background: 'linear-gradient(to right, transparent, #e11d48, transparent)', width: '70%', margin: '0 auto 3px', borderRadius: 3, boxShadow: '0 0 10px rgba(225,29,72,0.5)' }} />
                        <span style={{ fontSize: '0.58rem', color: '#94a3b8', letterSpacing: '0.2em', fontWeight: 600 }}>MÀN HÌNH CHÍNH</span>
                      </div>

                      {/* Lưới sơ đồ ghế thu nhỏ */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', margin: '4px 0 10px' }}>
                        {rowLetters.map(r => {
                          const rowSeats = generatedSeats.filter(s => s.rowLabel === r);
                          return (
                            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 12, fontSize: '0.58rem', color: '#64748b', textAlign: 'right', fontWeight: 700 }}>{r}</span>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {rowSeats.map(s => {
                                  const c = s.seatType === 'SWEETBOX' ? '#7c3aed' : (s.seatType === 'VIP' ? '#f59e0b' : '#475569');
                                  return (
                                    <div
                                      key={s.label}
                                      title={`${s.label} — ${s.seatType}`}
                                      style={{
                                        width: seatWidth,
                                        height: seatHeight,
                                        borderRadius: 2,
                                        background: c,
                                        opacity: 0.9,
                                        transition: 'transform 0.1s'
                                      }}
                                    />
                                  );
                                })}
                              </div>
                              <span style={{ width: 12, fontSize: '0.58rem', color: '#64748b', fontWeight: 700 }}>{r}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chú thích màu sắc */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#94a3b8' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#475569' }} />
                          <span>Thường</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#fbbf24' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} />
                          <span>VIP (+15k)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#c084fc' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#7c3aed' }} />
                          <span>Sweetbox (+30k)</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.68rem', color: '#64748b' }}>
                        💡 Sau khi tạo, có thể vào "Sơ đồ ghế" để xóa ô làm lối đi
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b', fontSize: '0.8rem' }}>
                      Đã tắt tính năng tự động tạo ghế.<br />Phòng chiếu sẽ được tạo ở trạng thái chưa có ghế.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-admin-footer" style={{ padding: '12px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10, 15, 26, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
              {!isEdit && autoInitSeats && (
                <span>Tự động sinh: <strong style={{ color: '#fff' }}>{generatedSeats.length} ghế</strong> ({rowLetters[0]}1 → {rowLetters[rowLetters.length - 1]}{seatsPerRow})</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-admin-secondary" onClick={onClose} style={{ fontSize: '0.84rem', padding: '7px 16px' }}>
                Hủy
              </button>
              <button type="submit" className="btn-admin-primary" style={{ fontSize: '0.84rem', padding: '7px 20px', background: 'linear-gradient(135deg, #e11d48, #be123c)' }}>
                <Check size={16} /> {isEdit ? 'Lưu thay đổi' : `Lưu phòng (${autoInitSeats ? generatedSeats.length : 0} ghế)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CinemasAdminPage() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modal states
  const [cinemaModal, setCinemaModal] = useState(null); // null | 'add' | cinema_obj (edit)
  const [roomModal, setRoomModal] = useState(null); // null | 'add' | room_obj (edit)
  const [seatsModal, setSeatsModal] = useState(null); // null | room_obj
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, name }

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCinemas = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getCinemas();
      setCinemas(data);
      if (!selectedCinema && data.length > 0) setSelectedCinema(data[0]);
      else if (selectedCinema) {
        const found = data.find(c => c.id === selectedCinema.id);
        setSelectedCinema(found || data[0] || null);
      }
    } catch (err) {
      showNotice('error', 'Lỗi tải danh sách rạp: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCinemas();
    const unsub = realtime.subscribe(msg => {
      if (
        msg.type === REALTIME_EVENTS.CINEMA_STATUS_CHANGED ||
        msg.type === REALTIME_EVENTS.ROOM_STATUS_CHANGED ||
        msg.type === REALTIME_EVENTS.SHOWTIME_CHANGED
      ) {
        console.log('[CinemasAdminPage] 🔄 Realtime event detected, updating cinemas...', msg);
        loadCinemas();
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Danh sách các Tỉnh/Thành phố có rạp
  const availableProvinces = useMemo(() => {
    const set = new Set();
    cinemas.forEach(c => {
      const p = c.province || c.city;
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [cinemas]);

  // Bộ lọc nâng cao: Tìm theo tên, địa chỉ, tỉnh/thành, trạng thái
  const filteredCinemas = useMemo(() => {
    return cinemas.filter(c => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q));

      const matchesProvince = provinceFilter === 'ALL' || (c.province === provinceFilter || c.city === provinceFilter);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesProvince && matchesStatus;
    });
  }, [cinemas, searchQuery, provinceFilter, statusFilter]);

  // Tự động về trang 1 khi thay đổi điều kiện tìm kiếm/bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, provinceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCinemas.length / pageSize));
  const paginatedCinemas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCinemas.slice(start, start + pageSize);
  }, [filteredCinemas, currentPage, pageSize]);

  // Tự động chọn rạp đầu tiên nếu rạp đang chọn bị lọc mất
  useEffect(() => {
    if (filteredCinemas.length > 0) {
      const isStillInList = filteredCinemas.some(c => c.id === selectedCinema?.id);
      if (!isStillInList) {
        setSelectedCinema(paginatedCinemas[0] || filteredCinemas[0]);
      }
    }
  }, [filteredCinemas, paginatedCinemas, selectedCinema]);

  // Cinema CRUD
  const handleSaveCinema = async (formData) => {
    try {
      if (cinemaModal?.id) {
        await AdminApi.updateCinema(cinemaModal.id, formData);
        showNotice('success', `Đã cập nhật cụm rạp "${formData.name}".`);
      } else {
        await AdminApi.createCinema(formData);
        showNotice('success', `Đã thêm cụm rạp "${formData.name}" thành công.`);
      }
      await loadCinemas();
    } catch (err) {
      showNotice('error', 'Lỗi lưu cụm rạp: ' + err.message);
    }
  };

  const handleDeleteCinema = async (id) => {
    try {
      await AdminApi.deleteCinema(id);
      showNotice('success', 'Xoá cụm rạp thành công.');
      setSelectedCinema(null);
      await loadCinemas();
    } catch (err) {
      showNotice('error', 'Lỗi xoá cụm rạp: ' + err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  // Room CRUD
  const handleSaveRoom = async (formData) => {
    if (!selectedCinema) return;
    try {
      if (roomModal?.id) {
        await AdminApi.updateRoom(roomModal.id, formData);
        showNotice('success', `Đã cập nhật phòng "${formData.name}".`);
      } else {
        const newRoom = await AdminApi.createRoom(selectedCinema.id, formData);
        const newRoomId = newRoom?.id || newRoom?.data?.id || (typeof newRoom === 'object' && newRoom?.id);
        if (newRoomId && formData.initialSeats && formData.initialSeats.length > 0) {
          await AdminApi.addSeats(newRoomId, formData.initialSeats);
          showNotice('success', `Đã thêm phòng "${formData.name}" và tự động tạo ${formData.initialSeats.length} ghế!`);
        } else {
          showNotice('success', `Đã thêm phòng chiếu "${formData.name}".`);
        }
      }
      await loadCinemas();
    } catch (err) {
      showNotice('error', 'Lỗi lưu phòng chiếu: ' + err.message);
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      await AdminApi.deleteRoom(id);
      showNotice('success', 'Xoá phòng chiếu thành công.');
      await loadCinemas();
    } catch (err) {
      showNotice('error', 'Lỗi xoá phòng: ' + err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleRoomStatus = async (room) => {
    const nextStatus = room.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
    try {
      await AdminApi.updateRoomStatus(room.id, nextStatus);
      showNotice('success', `Phòng "${room.name}" → ${STATUS_VI[nextStatus] || nextStatus}`);
      await loadCinemas();
    } catch (err) {
      showNotice('error', 'Không thể đổi trạng thái: ' + err.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'cinema') handleDeleteCinema(confirmDelete.id);
    else handleDeleteRoom(confirmDelete.id);
  };

  return (
    <div className="cinemas-admin-page">
      <Toast notification={notification} />

      {/* Seat Type Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[['Ghế Thường (NORMAL)', '+ 0 đ', 'Chuẩn', 'info'],
          ['Phụ thu Ghế VIP', '+ 15.000 đ', 'Phụ thu', 'warning'],
          ['Phụ thu Sweetbox (Đôi)', '+ 30.000 đ', 'Cao cấp', 'success']
        ].map(([label, val, tag, color]) => (
          <div key={label} className="kpi-card" style={{ padding: 16 }}>
            <div>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{val}</div>
            </div>
            <span className={`status-pill ${color}`}>{tag}</span>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
        {/* Left: Cinema List with Advanced Search & Pagination */}
        <div className="table-panel" style={{ height: 'fit-content' }}>
          <div className="table-toolbar">
            <div>
              <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Cụm Rạp ({cinemas.length})</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                Hiển thị {filteredCinemas.length} rạp phù hợp
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-admin-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setCinemaModal('add')}>
                <Plus size={13} /> Thêm
              </button>
              <button className="btn-admin-secondary" onClick={loadCinemas} title="Làm mới">
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* Advanced Search & Filter Bar */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--admin-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm rạp theo tên, địa chỉ..."
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 32px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <select
                  value={provinceFilter}
                  onChange={e => setProvinceFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'var(--admin-bg-input, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    borderRadius: 6,
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Toàn quốc (Tất cả)</option>
                  {availableProvinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: 'var(--admin-bg-input, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    borderRadius: 6,
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="MAINTENANCE">Đang bảo trì</option>
                  <option value="INACTIVE">Ngưng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paginated Cinema Cards */}
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && cinemas.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                Đang nạp dữ liệu cụm rạp...
              </div>
            ) : filteredCinemas.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                Không tìm thấy cụm rạp phù hợp bộ lọc.
              </div>
            ) : paginatedCinemas.map(c => (
              <div key={c.id}
                onClick={() => setSelectedCinema(c)}
                style={{
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                  background: selectedCinema?.id === c.id ? 'var(--admin-primary-light)' : 'rgba(255,255,255,0.02)',
                  border: selectedCinema?.id === c.id ? '1px solid var(--admin-primary)' : '1px solid var(--admin-border)',
                  transition: 'all 0.2s ease'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{c.name}</div>
                  <span className={`status-pill ${STATUS_COLOR[c.status] || 'info'}`} style={{ fontSize: '0.7rem', padding: '2px 7px', flexShrink: 0 }}>
                    {STATUS_VI[c.status] || c.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', marginTop: 4, lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.address}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-secondary)' }}>
                    🏢 {c.rooms?.length || 0} phòng chiếu
                  </span>
                  {selectedCinema?.id === c.id && (
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setCinemaModal(c)}
                        title="Sửa rạp"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-primary)', padding: 3 }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete({ type: 'cinema', id: c.id, name: c.name })}
                        title="Xóa rạp"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 3 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
                {c.latitude && c.longitude && (
                  <a href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: '0.72rem', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}
                    onClick={e => e.stopPropagation()}>
                    <MapPin size={11} /> Xem trên bản đồ
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderTop: '1px solid var(--admin-border)',
              background: 'rgba(255,255,255,0.02)',
              fontSize: '0.78rem',
              color: 'var(--admin-text-secondary)'
            }}>
              <span>Trang {currentPage} / {totalPages}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'var(--admin-bg-input, #1e293b)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: currentPage <= 1 ? '#475569' : '#cbd5e1',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <ChevronLeft size={13} /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: currentPage === p ? 'var(--admin-primary, #e11d48)' : 'var(--admin-bg-input, #1e293b)',
                      border: '1px solid ' + (currentPage === p ? 'var(--admin-primary, #e11d48)' : 'var(--admin-border, #334155)'),
                      color: '#fff',
                      fontWeight: currentPage === p ? 700 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'var(--admin-bg-input, #1e293b)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: currentPage >= totalPages ? '#475569' : '#cbd5e1',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  Sau <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Rooms */}
        <div className="table-panel">
          <div className="table-toolbar">
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>
                {selectedCinema ? `Phòng Chiếu: ${selectedCinema.name}` : 'Chi Tiết Phòng Chiếu'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                {selectedCinema?.address || 'Chọn một cụm rạp bên trái để xem danh sách phòng'}
              </p>
            </div>
            {selectedCinema && (
              <button className="btn-admin-primary" style={{ padding: '7px 14px', fontSize: '0.83rem' }}
                onClick={() => setRoomModal('add')}>
                <Plus size={14} /> Thêm phòng
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Mã phòng</th>
                  <th>Tên phòng chiếu</th>
                  <th>Định dạng</th>
                  <th>Sức chứa</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {!selectedCinema ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Chọn một cụm rạp bên trái
                  </td></tr>
                ) : !selectedCinema.rooms || selectedCinema.rooms.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Chưa có phòng chiếu. Nhấn "Thêm phòng" để tạo mới.
                  </td></tr>
                ) : (
                  selectedCinema.rooms.map(r => (
                    <tr key={r.id}>
                      <td><code>{String(r.id).length > 10 ? `${String(r.id).substring(0, 8)}...` : r.id}</code></td>
                      <td><strong style={{ color: '#fff' }}>{r.name}</strong></td>
                      <td>
                        <span className={`status-pill ${String(r.format).includes('IMAX') ? 'warning' : String(r.format).includes('4DX') ? 'danger' : 'info'}`}>
                          {r.format}
                        </span>
                      </td>
                      <td>{r.capacity || 120} ghế</td>
                      <td>
                        <span className={`status-pill ${STATUS_COLOR[r.status] || 'info'}`}>
                          {STATUS_VI[r.status] || r.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-btns">
                          {/* Quản lý ghế */}
                          <button className="btn-table-icon"
                            title="Quản lý sơ đồ ghế"
                            onClick={() => setSeatsModal(r)}
                            style={{ color: '#a78bfa', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 5, border: '1px solid #7c3aed', background: 'rgba(124,58,237,0.1)' }}>
                            🪑 Ghế
                          </button>
                          <button className="btn-table-icon" title={r.status === 'MAINTENANCE' ? 'Khôi phục hoạt động' : 'Đặt bảo trì'}
                            onClick={() => handleToggleRoomStatus(r)}
                            style={{ color: r.status === 'MAINTENANCE' ? '#34d399' : '#f59e0b' }}>
                            {r.status === 'MAINTENANCE' ? <Power size={14} /> : <Wrench size={14} />}
                          </button>
                          <button className="btn-table-icon" onClick={() => setRoomModal(r)} title="Sửa">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-table-icon" style={{ color: '#ef4444' }}
                            onClick={() => setConfirmDelete({ type: 'room', id: r.id, name: r.name })} title="Xoá">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cinema Modal */}
      {cinemaModal && (
        <CinemaModal
          cinema={cinemaModal === 'add' ? null : cinemaModal}
          onClose={() => setCinemaModal(null)}
          onSave={handleSaveCinema}
        />
      )}

      {/* Room Modal */}
      {roomModal && (
        <RoomModal
          room={roomModal === 'add' ? null : roomModal}
          cinemaId={selectedCinema?.id}
          onClose={() => setRoomModal(null)}
          onSave={handleSaveRoom}
        />
      )}

      {/* Seats Management Modal */}
      {seatsModal && (
        <SeatsManagementModal
          room={seatsModal}
          onClose={() => setSeatsModal(null)}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-admin-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-admin-header">
              <h3 style={{ color: '#f87171' }}>Xác nhận xoá</h3>
              <button onClick={() => setConfirmDelete(null)} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
            </div>
            <div className="modal-admin-body">
              <p style={{ color: '#cbd5e1' }}>
                Bạn có chắc muốn xoá <strong style={{ color: '#fff' }}>"{confirmDelete.name}"</strong> không?
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="modal-admin-footer">
              <button className="btn-admin-secondary" onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className="btn-admin-primary" style={{ background: '#dc2626' }} onClick={handleConfirmDelete}>
                <Trash2 size={14} /> Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}