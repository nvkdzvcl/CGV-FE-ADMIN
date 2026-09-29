import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AdminApi } from '../services/adminApi';
import { downloadShowtimeImportTemplate } from '../services/exportExcel';

const SHOWTIME_HEADER_ALIASES = {
  movieTitle: ['movietitle', 'movie', 'tênphim', 'phim', 'title'],
  cinemaName: ['cinemaname', 'cinema', 'tênrạp', 'cụmrạp', 'rạp'],
  roomName: ['roomname', 'room', 'phòngchiếu', 'phòng', 'tenphong'],
  showDate: ['showdate', 'date', 'ngàychiếu', 'ngày', 'ngaychieu'],
  startTime: ['starttime', 'start', 'giờchiếu', 'bắtđầu', 'giochieu', 'batdau'],
  endTime: ['endtime', 'end', 'kếtthúc', 'ketthuc'],
  basePrice: ['baseprice', 'price', 'giávé', 'giave', 'totalprice', 'giá'],
  viewingMode: ['viewingmode', 'format', 'địnhdạng', 'dinhdang']
};

function mapShowtimeHeader(headerKey) {
  if (!headerKey) return null;
  const raw = String(headerKey).trim();
  const insideParen = (raw.match(/\(([^)]+)\)/)?.[1] || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (insideParen) {
    for (const [field, aliasList] of Object.entries(SHOWTIME_HEADER_ALIASES)) {
      if (aliasList.some(a => a.toLowerCase().replace(/[^a-z0-9]/g, '') === insideParen)) {
        return field;
      }
    }
  }

  const cleaned = raw.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  for (const [field, aliasList] of Object.entries(SHOWTIME_HEADER_ALIASES)) {
    if (aliasList.some(a => a.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '') === cleaned)) {
      return field;
    }
  }

  const sortedFields = Object.keys(SHOWTIME_HEADER_ALIASES).sort((a, b) => b.length - a.length);
  for (const field of sortedFields) {
    const aliasList = SHOWTIME_HEADER_ALIASES[field];
    if (aliasList.some(a => cleaned.includes(a.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '')))) {
      return field;
    }
  }
  return null;
}

function parseDateFlexible(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split('T')[0];
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;

  const dmyShortMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmyShortMatch) {
    const yy = dmyShortMatch[3];
    const year = parseInt(yy, 10) > 50 ? `19${yy}` : `20${yy}`;
    return `${year}-${dmyShortMatch[2].padStart(2, '0')}-${dmyShortMatch[1].padStart(2, '0')}`;
  }

  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

export default function ExcelImportShowtimeModal({ onClose, onImportDone, movies = [], cinemas = [] }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle File Upload & Parsing (Both XLSX and CSV)
  const handleFileChange = (e) => {
    setErrorMsg('');
    setImportResult(null);
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('File rỗng hoặc không có dữ liệu lịch chiếu.');
          return;
        }

        const rows = [];
        for (let i = 0; i < rawJson.length; i++) {
          const item = rawJson[i];
          const obj = {};
          Object.entries(item).forEach(([k, v]) => {
            const field = mapShowtimeHeader(k);
            if (field) obj[field] = v;
          });

          const mTitle = String(obj.movieTitle ?? '').trim();
          const cName = String(obj.cinemaName ?? '').trim();
          const rName = String(obj.roomName ?? '').trim();
          const sDate = parseDateFlexible(obj.showDate);
          const sTime = String(obj.startTime ?? '').trim();
          const eTime = String(obj.endTime ?? '').trim();
          const bPrice = Number(String(obj.basePrice ?? '90000').replace(/[^0-9]/g, '')) || 90000;

          if (mTitle && (sDate || sTime)) {
            // Match with loaded catalog
            const matchedMovie = movies.find(m => m.title.toLowerCase().includes(mTitle.toLowerCase())) || movies[0];
            const matchedCinema = cinemas.find(c => c.name.toLowerCase().includes(cName.toLowerCase())) || cinemas[0];
            const matchedRoom = matchedCinema?.rooms?.find(r => r.name.toLowerCase().includes(rName.toLowerCase())) || matchedCinema?.rooms?.[0];

            rows.push({
              movieTitle: matchedMovie ? matchedMovie.title : mTitle,
              movieId: matchedMovie?.id || '21000000-0000-0000-0000-000000000001',
              cinemaName: matchedCinema ? matchedCinema.name : cName,
              roomName: matchedRoom ? matchedRoom.name : rName,
              roomId: matchedRoom?.id || '23000000-0000-0000-0000-000000000001',
              date: sDate || new Date().toISOString().split('T')[0],
              startTime: sTime || '18:00',
              endTime: eTime || '20:30',
              basePrice: bPrice > 0 ? bPrice : 90000
            });
          }
        }

        if (rows.length === 0) {
          setErrorMsg('Không tìm thấy dòng lịch chiếu hợp lệ nào trong file.');
          return;
        }

        setParsedRows(rows);
      } catch (err) {
        setErrorMsg('Không thể đọc file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Execute Batch Import
  const handleStartImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const st = parsedRows[i];
      try {
        const startIso = new Date(`${st.date}T${st.startTime}:00+07:00`).toISOString();
        const endIso = new Date(`${st.date}T${st.endTime}:00+07:00`).toISOString();

        await AdminApi.createShowtime({
          movieId: st.movieId,
          roomId: st.roomId,
          showDate: st.date,
          startTime: startIso,
          endTime: endIso,
          basePrice: st.basePrice,
          status: 'SCHEDULED'
        });
        successCount++;
      } catch (err) {
        failCount++;
      }

      const pct = Math.min(100, Math.round(((i + 1) / parsedRows.length) * 100));
      setProgress(pct);
    }

    setImporting(false);
    setImportResult({
      total: parsedRows.length,
      success: successCount,
      failed: failCount
    });

    if (onImportDone) onImportDone();
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={20} color="var(--admin-primary)" />
            Import Lịch Chiếu Phim Từ File Excel / CSV
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-admin-body">
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)',
            borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 12
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>File mẫu lịch chiếu:</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                Các cột: movieTitle, cinemaName, roomName, showDate, startTime, endTime, totalPrice
              </div>
            </div>
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={downloadShowtimeImportTemplate}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Download size={14} /> Tải file mẫu có ComboBox (.XLSX)
            </button>
          </div>

          <div style={{
            marginTop: 16, border: '2px dashed var(--admin-border)',
            borderRadius: 12, padding: 24, textAlign: 'center',
            background: 'rgba(9, 13, 22, 0.4)', position: 'relative'
          }}>
            <Upload size={36} color="var(--admin-primary)" style={{ margin: '0 auto 8px' }} />
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
              {file ? file.name : 'Kéo thả hoặc nhấn để chọn file Excel / CSV lịch chiếu'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Hỗ trợ định dạng CSV, XLSX. Hệ thống tự động match với Danh mục Phim & Cụm Rạp.
            </div>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer'
              }}
            />
          </div>

          {errorMsg && (
            <div style={{
              marginTop: 12, padding: 10, borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
              color: '#f87171', fontSize: '0.82rem'
            }}>
              {errorMsg}
            </div>
          )}

          {parsedRows.length > 0 && !importResult && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                  Đã đọc {parsedRows.length} suất chiếu:
                </span>
                <span className="status-pill success">Đã map Rạp & Phim</span>
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                <table className="admin-data-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Phim</th>
                      <th>Cụm Rạp & Phòng</th>
                      <th>Ngày</th>
                      <th>Khung giờ</th>
                      <th>Giá vé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((r, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: '#fff' }}>{r.movieTitle}</strong></td>
                        <td>{r.cinemaName} • {r.roomName}</td>
                        <td>{r.date}</td>
                        <td>{r.startTime} — {r.endTime}</td>
                        <td>{r.basePrice.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importing && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#fff', marginBottom: 6 }}>
                <span>Đang điều phối và lưu lịch chiếu vào CatalogService...</span>
                <strong>{progress}%</strong>
              </div>
              <div style={{ height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--admin-primary)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          )}

          {importResult && (
            <div style={{
              marginTop: 16, padding: 14, borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981',
              color: '#34d399', fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                <CheckCircle size={20} />
                Đã hoàn tất nạp lịch chiếu vào Catalog!
              </div>
              <div>Tổng: <strong>{importResult.total}</strong> | Thành công: <strong>{importResult.success}</strong> | Thất bại: <strong>{importResult.failed}</strong></div>
            </div>
          )}
        </div>

        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={onClose}>
            Đóng
          </button>
          {parsedRows.length > 0 && !importResult && (
            <button
              className="btn-admin-primary"
              disabled={importing}
              onClick={handleStartImport}
            >
              <Check size={16} />
              {importing ? `Đang nạp (${progress}%)...` : `Nạp ${parsedRows.length} Suất Chiếu`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
