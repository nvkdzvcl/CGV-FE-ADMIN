import React, { useState, useRef } from 'react';
import { X, Download, Upload, Film, CheckCircle, AlertCircle, AlertTriangle, FileSpreadsheet, Check, RefreshCw, Eye, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AdminApi } from '../services/adminApi';
import { downloadMovieImportTemplate, generateLargeMovieTestFile } from '../services/exportExcel';

// Từ điển ánh xạ tiêu đề cột (Hỗ trợ cả Tiếng Việt, Tiếng Anh và định dạng kèm chú thích trong ngoặc đơn)
const HEADER_ALIASES = {
  originalTitle: ['originaltitle', 'original_title', 'têngốc', 'tengoc', 'sub_title', 'subtitle'],
  title: ['title', 'tiêuđề', 'tênphim', 'tenphim', 'tieude'],
  director: ['director', 'đạodiễn', 'daodien'],
  durationMinutes: ['durationminutes', 'duration', 'thờilượng', 'thoiluong', 'phút', 'phut'],
  ageRating: ['agerating', 'age_rating', 'độtuổi', 'dotuoi', 'rating'],
  showingStatus: ['showingstatus', 'showing_status', 'trạngthái', 'trangthai', 'status'],
  releaseDate: ['releasedate', 'release_date', 'ngàykhởichiếu', 'ngaykhoichieu', 'khởichiếu', 'khoichieu', 'ngàychiếu'],
  genreNames: ['genrenames', 'genre_names', 'genres', 'genre', 'thểloại', 'theloai'],
  language: ['language', 'ngônngữ', 'ngonngu'],
  isFeatured: ['isfeatured', 'is_featured', 'nổibật', 'noibat', 'featured'],
  posterUrl: ['posterurl', 'poster_url', 'poster'],
  trailerYoutubeUrl: ['traileryoutubeurl', 'trailer_youtube_url', 'trailer', 'youtube'],
  synopsis: ['synopsis', 'tómtắt', 'tomtat', 'môtả', 'mota', 'nộidung', 'noidung'],
  cast_names: ['cast_names', 'castnames', 'cast', 'diễnviên', 'dienvien'],
  cast_roles: ['cast_roles', 'castroles', 'vaitrò', 'vaitro']
};

function mapHeaderToField(headerKey) {
  if (!headerKey) return null;
  const raw = String(headerKey).trim();
  // 1. Kiểm tra chuỗi bên trong ngoặc đơn, vd: "Tiêu đề phim (title)" -> "title"
  const insideParen = (raw.match(/\(([^)]+)\)/)?.[1] || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (insideParen) {
    for (const [field, aliasList] of Object.entries(HEADER_ALIASES)) {
      if (aliasList.some(a => a.toLowerCase().replace(/[^a-z0-9]/g, '') === insideParen)) {
        return field;
      }
    }
  }

  const cleaned = raw.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  // 2. So khớp chính xác
  for (const [field, aliasList] of Object.entries(HEADER_ALIASES)) {
    if (aliasList.some(a => a.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '') === cleaned)) {
      return field;
    }
  }

  // 3. So khớp chuỗi con (ưu tiên các trường có alias dài hơn trước)
  const sortedFields = Object.keys(HEADER_ALIASES).sort((a, b) => b.length - a.length);
  for (const field of sortedFields) {
    const aliasList = HEADER_ALIASES[field];
    if (aliasList.some(a => cleaned.includes(a.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '')))) {
      return field;
    }
  }

  return null;
}

// Xử lý linh hoạt mọi định dạng ngày: YYYY-MM-DD, DD/MM/YYYY, DD/MM/YY (như 15/10/26), Excel Serial Number, Date Object
function parseDateFlexible(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split('T')[0];
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD/MM/YYYY hoặc DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;

  // DD/MM/YY (ví dụ: 15/10/26 trong Excel)
  const dmyShortMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmyShortMatch) {
    const yy = dmyShortMatch[3];
    const year = parseInt(yy, 10) > 50 ? `19${yy}` : `20${yy}`;
    return `${year}-${dmyShortMatch[2].padStart(2, '0')}-${dmyShortMatch[1].padStart(2, '0')}`;
  }

  // Excel serial number (ví dụ 46310)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

// Chuẩn hóa Enum trạng thái (hỗ trợ cả Tiếng Anh và Tiếng Việt)
function normalizeStatus(val) {
  const s = String(val || '').trim().toUpperCase();
  if (s.includes('NOW') || s.includes('ĐANG') || s.includes('DANG')) return 'NOW_SHOWING';
  if (s.includes('SOON') || s.includes('SẮP') || s.includes('SAP')) return 'COMING_SOON';
  if (s.includes('END') || s.includes('NGỪNG') || s.includes('NGUNG')) return 'END_SHOWING';
  return 'NOW_SHOWING';
}

// Chuẩn hóa độ tuổi
function normalizeAge(val) {
  const s = String(val || '').trim().toUpperCase();
  if (s.includes('18')) return 'T18';
  if (s.includes('16')) return 'T16';
  if (s.includes('13')) return 'T13';
  if (s.includes('K')) return 'K';
  if (s.includes('C')) return 'C';
  return 'P';
}

// Chuẩn hóa cờ nổi bật
function normalizeFeatured(val) {
  const s = String(val || '').trim().toUpperCase();
  return s === 'CÓ' || s === 'TRUE' || s === '1' || s === 'YES';
}

// Phân tích dữ liệu & Kiểm tra tính hợp lệ trong RAM (Hỗ trợ cả XLSX và CSV)
function parseAndValidateMovieRows(rawRows) {
  if (!rawRows || rawRows.length === 0) throw new Error('File không chứa dòng dữ liệu nào.');

  const seenTitles = new Map(); // RAM check duplicate
  const rows = [];

  rawRows.forEach((rawObj, index) => {
    const lineNumber = index + 2;

    // Ánh xạ tất cả các cột sang tên trường chuẩn
    const obj = {};
    Object.entries(rawObj).forEach(([k, v]) => {
      const field = mapHeaderToField(k);
      if (field) {
        obj[field] = v;
      }
    });

    const title = String(obj.title ?? '').trim();
    const duration = parseInt(String(obj.durationMinutes ?? '0').replace(/[^0-9]/g, ''), 10);
    const releaseDate = parseDateFlexible(obj.releaseDate);

    // Validation trong RAM
    const errors = [];
    if (!title) {
      errors.push('Thiếu tiêu đề phim');
    } else {
      const normalizedTitle = title.trim().toLowerCase();
      if (seenTitles.has(normalizedTitle)) {
        errors.push(`Trùng tiêu đề với dòng ${seenTitles.get(normalizedTitle)} trong file`);
      } else {
        seenTitles.set(normalizedTitle, lineNumber);
      }
    }

    if (isNaN(duration) || duration <= 0) {
      errors.push('Thời lượng không hợp lệ (phải > 0)');
    }

    const movie = {
      lineNumber,
      title,
      originalTitle: String(obj.originalTitle ?? title).trim() || title,
      director: String(obj.director ?? '').trim(),
      durationMinutes: duration > 0 ? duration : 120,
      ageRating: normalizeAge(obj.ageRating),
      showingStatus: normalizeStatus(obj.showingStatus),
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      posterUrl: String(obj.posterUrl ?? '').trim(),
      trailerYoutubeUrl: String(obj.trailerYoutubeUrl ?? '').trim(),
      synopsis: String(obj.synopsis ?? '').trim(),
      language: String(obj.language ?? 'Tiếng Việt').trim(),
      isFeatured: normalizeFeatured(obj.isFeatured),
      status: 'ACTIVE',
      cast: (obj.cast_names || obj.cast) ? String(obj.cast_names || obj.cast).split(';').map((name, idx) => ({
        actorName: name.trim(),
        role: String(obj.cast_roles || '').split(';')[idx]?.trim() || 'ACTOR',
        displayOrder: idx + 1
      })).filter(c => c.actorName) : [],
      genreNames: obj.genreNames ? String(obj.genreNames).split(',').map(g => g.trim()).filter(Boolean) : [],
      isValid: errors.length === 0,
      errors: errors
    };

    rows.push(movie);
  });

  return rows;
}

export default function ExcelImportMovieModal({ onClose, onImportComplete }) {
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'VALID' | 'ERROR'
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResults(null);
    setParsedRows([]);
    setPage(1);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawJson || rawJson.length === 0) throw new Error('Không tìm thấy dữ liệu trong file.');
        const rows = parseAndValidateMovieRows(rawJson);
        setParsedRows(rows);
      } catch (err) {
        setError('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const handleImport = async () => {
    if (validRows.length === 0) {
      alert('Không có dòng hợp lệ nào để import!');
      return;
    }

    setImporting(true);
    setProgress(0);
    setResults(null);

    const rowResults = [];
    const CHUNK_SIZE = 10; // Xử lý 10 bản ghi song song theo lô để tối ưu tốc độ

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map(async (row) => {
        try {
          await AdminApi.createMovie({
            title: row.title,
            originalTitle: row.originalTitle,
            director: row.director,
            durationMinutes: row.durationMinutes,
            ageRating: row.ageRating,
            showingStatus: row.showingStatus,
            releaseDate: row.releaseDate,
            posterUrl: row.posterUrl,
            trailerYoutubeUrl: row.trailerYoutubeUrl,
            synopsis: row.synopsis,
            language: row.language,
            isFeatured: row.isFeatured,
            status: row.status,
            cast: row.cast,
            genreNames: row.genreNames
          });
          return {
            lineNumber: row.lineNumber,
            title: row.title,
            success: true,
            error: null
          };
        } catch (err) {
          return {
            lineNumber: row.lineNumber,
            title: row.title,
            success: false,
            error: err.message || 'Lỗi lưu trữ DB (có thể do trùng lặp)'
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      rowResults.push(...chunkResults);
      setProgress(Math.round((rowResults.length / validRows.length) * 100));
      // Cho UI event loop cập nhật thanh progress mượt mà
      await new Promise(r => setTimeout(r, 10));
    }

    setResults(rowResults);
    setImporting(false);

    const dbSuccess = rowResults.filter(r => r.success).length;
    if (dbSuccess > 0 && onImportComplete) {
      onImportComplete();
    }
  };

  const displayedRows = parsedRows.filter(r => {
    if (filterMode === 'VALID') return r.isValid;
    if (filterMode === 'ERROR') return !r.isValid;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = displayedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const dbSuccessCount = results?.filter(r => r.success).length || 0;
  const dbFailCount = results?.filter(r => !r.success).length || 0;

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 880, width: '95vw' }}>
        <div className="modal-admin-header">
          <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={20} color="var(--admin-primary)" />
            Import Phim từ File CSV / Excel (Chống trùng & Bypass lỗi)
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>

        <div className="modal-admin-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Hướng dẫn & Tải mẫu */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', flexWrap: 'wrap', gap: 10
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.88rem' }}>
                💡 Cơ chế Import thông minh & Siêu tải (High Performance):
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>
                Kiểm tra RAM O(1) → Tự động phân trang chống đơ DOM → Nạp song song theo batch 10 dòng/lần.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-admin-secondary" style={{ fontSize: '0.8rem' }} onClick={downloadMovieImportTemplate}>
                <Download size={14} /> Tải Excel mẫu có ComboBox (.xlsx)
              </button>
              <button
                className="btn-admin-secondary"
                style={{ fontSize: '0.8rem', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.4)' }}
                onClick={() => generateLargeMovieTestFile(1000)}
                title="Tải về 1.000 dòng phim mẫu để kiểm thử tải lớn"
              >
                <FlaskConical size={14} /> 🧪 Tạo file test lớn (1.000 dòng)
              </button>
            </div>
          </div>

          {/* Upload Box */}
          <div
            style={{
              border: '2px dashed var(--admin-border)', borderRadius: 10,
              padding: '20px', textAlign: 'center', cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)', marginBottom: 16
            }}
            onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={handleFileChange} />
            <Film size={32} color="var(--admin-primary)" style={{ margin: '0 auto 8px' }} />
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Chọn file Excel (.xlsx) hoặc CSV phim để xem trước & kiểm tra</div>
            <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
              Hỗ trợ định dạng .xlsx, .xls, .csv. Nhấn để duyệt file từ máy tính.
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: '0.85rem' }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> {error}
            </div>
          )}

          {/* Results Summary after DB import */}
          {results && (
            <div style={{
              marginBottom: 16, padding: '14px 16px', borderRadius: 8,
              background: dbFailCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${dbFailCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`
            }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', marginBottom: 4 }}>
                Kết quả nạp DB: <span style={{ color: '#34d399' }}>{dbSuccessCount} thành công</span>
                {dbFailCount > 0 && <span style={{ color: '#f87171' }}>, {dbFailCount} thất bại</span>}
              </div>
              {invalidRows.length > 0 && (
                <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
                  (Đã tự động bypass {invalidRows.length} dòng lỗi từ file trước khi ghi xuống DB)
                </div>
              )}
            </div>
          )}

          {/* Preview Table with row-level error highlights */}
          {parsedRows.length > 0 && !results && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                  Xem trước: {parsedRows.length} dòng ({validRows.length} hợp lệ, {invalidRows.length} lỗi)
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`btn-admin-secondary ${filterMode === 'ALL' ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => { setFilterMode('ALL'); setPage(1); }}>
                    Tất cả ({parsedRows.length})
                  </button>
                  <button
                    className={`btn-admin-secondary ${filterMode === 'VALID' ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#34d399' }}
                    onClick={() => { setFilterMode('VALID'); setPage(1); }}>
                    Hợp lệ ({validRows.length})
                  </button>
                  {invalidRows.length > 0 && (
                    <button
                      className={`btn-admin-secondary ${filterMode === 'ERROR' ? 'active' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#f87171' }}
                      onClick={() => { setFilterMode('ERROR'); setPage(1); }}>
                      Dòng lỗi ({invalidRows.length})
                    </button>
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid var(--admin-border)', borderRadius: 8, overflow: 'hidden' }}>
                <table className="admin-data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Dòng</th>
                      <th>Tiêu đề phim</th>
                      <th>Thời lượng</th>
                      <th>Độ tuổi</th>
                      <th>Khởi chiếu</th>
                      <th>Trạng thái kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.lineNumber} style={{
                        background: row.isValid ? 'transparent' : 'rgba(239,68,68,0.08)'
                      }}>
                        <td><code>#{row.lineNumber}</code></td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{row.title || '— (Trống)'}</div>
                          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.72rem' }}>{row.originalTitle}</div>
                        </td>
                        <td>{row.durationMinutes ? `${row.durationMinutes} ph` : '—'}</td>
                        <td><span className="status-pill info" style={{ fontSize: '0.7rem' }}>{row.ageRating}</span></td>
                        <td>{row.releaseDate}</td>
                        <td>
                          {row.isValid ? (
                            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <CheckCircle size={13} /> Sẵn sàng
                            </span>
                          ) : (
                            <div style={{ color: '#f87171' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                <AlertTriangle size={13} /> Lỗi xác thực
                              </div>
                              <ul style={{ margin: '2px 0 0 14px', padding: 0, fontSize: '0.72rem', color: '#fca5a5' }}>
                                {row.errors.map((err, eIdx) => <li key={eIdx}>{err}</li>)}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls for Large Files */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6, fontSize: '0.8rem', color: '#94a3b8'
                }}>
                  <div>
                    Hiển thị dòng {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, displayedRows.length)} / {displayedRows.length} dòng
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn-admin-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      disabled={currentPage <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={14} /> Trước
                    </button>
                    <span style={{ color: '#fff', fontWeight: 600, padding: '0 4px' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      className="btn-admin-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      Sau <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#fff', fontSize: '0.85rem' }}>Đang nạp vào cơ sở dữ liệu...</span>
                <span style={{ color: 'var(--admin-primary)', fontWeight: 700 }}>{progress}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${progress}%`, height: 8, borderRadius: 4, background: 'var(--admin-primary)', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-admin-footer">
          <button className="btn-admin-secondary" onClick={onClose} disabled={importing}>
            {results ? 'Đóng' : 'Hủy'}
          </button>
          {!results && parsedRows.length > 0 && (
            <button
              className="btn-admin-primary"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {importing ? <RefreshCw size={15} className="spin" /> : <Upload size={15} />}
              {`Import ${validRows.length} dòng hợp lệ ${invalidRows.length > 0 ? `(Bypass ${invalidRows.length} dòng lỗi)` : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
