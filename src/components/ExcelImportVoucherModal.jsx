import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AdminApi } from '../services/adminApi';
import { downloadVoucherImportTemplate } from '../services/exportExcel';

const VOUCHER_HEADER_ALIASES = {
  code: ['code', 'mãvoucher', 'mãkhuyếnmãi', 'mã', 'mavoucher'],
  name: ['name', 'tênkhuyếnmãi', 'tênvoucher', 'tênchươngtrình', 'tenkhuyenmai'],
  discountType: ['discounttype', 'hìnhthứcgiảm', 'loạigiảmgiá', 'hinhthucgiam', 'loaigiam'],
  discountValue: ['discountvalue', 'giátrịgiảm', 'mứcgiảm', 'giatri', 'giatrigiam'],
  minOrderValue: ['minordervalue', 'đơntốithiểu', 'tốithiểu', 'dontoithieu'],
  applicableTier: ['applicabletier', 'hạngápdụng', 'hạngthànhviên', 'hangapdung'],
  usageLimit: ['usagelimit', 'sốlượngpháthành', 'giớihạnsửdụng', 'soluong'],
  validFrom: ['validfrom', 'hiệulựctừ', 'từngày', 'hieuluctu', 'tungay'],
  validTo: ['validto', 'hiệulựcđến', 'đếnngày', 'hieulucden', 'denngay']
};

function mapVoucherHeader(headerKey) {
  if (!headerKey) return null;
  const raw = String(headerKey).trim();
  const insideParen = (raw.match(/\(([^)]+)\)/)?.[1] || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (insideParen) {
    for (const [field, aliasList] of Object.entries(VOUCHER_HEADER_ALIASES)) {
      if (aliasList.some(a => a.toLowerCase().replace(/[^a-z0-9]/g, '') === insideParen)) {
        return field;
      }
    }
  }

  const cleaned = raw.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  for (const [field, aliasList] of Object.entries(VOUCHER_HEADER_ALIASES)) {
    if (aliasList.some(a => a.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '') === cleaned)) {
      return field;
    }
  }

  const sortedFields = Object.keys(VOUCHER_HEADER_ALIASES).sort((a, b) => b.length - a.length);
  for (const field of sortedFields) {
    const aliasList = VOUCHER_HEADER_ALIASES[field];
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

export default function ExcelImportVoucherModal({ onClose, onImportDone }) {
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
          setErrorMsg('File rỗng hoặc không có bản ghi dữ liệu.');
          return;
        }

        const rows = [];
        for (let i = 0; i < rawJson.length; i++) {
          const item = rawJson[i];
          const obj = {};
          Object.entries(item).forEach(([k, v]) => {
            const field = mapVoucherHeader(k);
            if (field) obj[field] = v;
          });

          const code = String(obj.code ?? '').trim();
          const name = String(obj.name ?? code).trim() || code;
          const discType = String(obj.discountType ?? 'FIXED').toUpperCase().includes('PERCENT') ? 'PERCENT' : 'FIXED';
          const discVal = Number(String(obj.discountValue ?? '0').replace(/[^0-9]/g, '')) || 0;
          const minOrder = Number(String(obj.minOrderValue ?? '0').replace(/[^0-9]/g, '')) || 0;
          const tier = String(obj.applicableTier ?? 'MEMBER').trim().toUpperCase() || 'MEMBER';
          const limit = Number(String(obj.usageLimit ?? '1000').replace(/[^0-9]/g, '')) || 1000;
          const vFrom = parseDateFlexible(obj.validFrom) || new Date().toISOString().split('T')[0];
          const vTo = parseDateFlexible(obj.validTo) || '2026-12-31';

          if (code) {
            rows.push({
              code: code.toUpperCase(),
              name: name,
              discountType: discType,
              discountValue: discVal,
              minOrderValue: minOrder,
              applicableTier: tier,
              usageLimit: limit,
              validFrom: vFrom,
              validTo: vTo
            });
          }
        }

        if (rows.length === 0) {
          setErrorMsg('Không tìm thấy dòng voucher hợp lệ nào trong file.');
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

    // Chunk size processing
    const chunkSize = 5;
    for (let i = 0; i < parsedRows.length; i += chunkSize) {
      const chunk = parsedRows.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (promo) => {
        try {
          const fromIso = new Date(`${promo.validFrom}T00:00:00+07:00`).toISOString();
          const toIso = new Date(`${promo.validTo}T23:59:59+07:00`).toISOString();

          await AdminApi.createPromotion({
            ...promo,
            validFrom: fromIso,
            validTo: toIso,
            maxUsesPerUser: 1,
            isActive: true
          });
          successCount++;
        } catch (e) {
          failCount++;
        }
      }));

      const pct = Math.min(100, Math.round(((i + chunkSize) / parsedRows.length) * 100));
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
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={20} color="var(--admin-primary)" />
            Import Batch Voucher Từ Excel / CSV
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-admin-body">
          {/* Top Info & Template Download */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)',
            borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 12
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Cấu trúc file mẫu chuẩn:</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                Định dạng CSV/Excel UTF-8: code, name, discountType, discountValue, usageLimit...
              </div>
            </div>
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={downloadVoucherImportTemplate}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Download size={14} /> Tải file mẫu có ComboBox (.XLSX)
            </button>
          </div>

          {/* Upload Zone */}
          <div style={{
            marginTop: 16, border: '2px dashed var(--admin-border)',
            borderRadius: 12, padding: 24, textAlign: 'center',
            background: 'rgba(9, 13, 22, 0.4)', position: 'relative'
          }}>
            <Upload size={36} color="var(--admin-primary)" style={{ margin: '0 auto 8px' }} />
            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
              {file ? file.name : 'Kéo thả hoặc nhấn để chọn file Excel / CSV'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Hỗ trợ file CSV, XLSX (Dung lượng tối đa 50MB hoặc 1.000.000 dòng)
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

          {/* Preview Parsed Rows */}
          {parsedRows.length > 0 && !importResult && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                  Xem trước dữ liệu ({parsedRows.length} vouchers đã nhận diện):
                </span>
                <span className="status-pill info">Chunk Processing Sẵn Sàng</span>
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                <table className="admin-data-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên CTKM</th>
                      <th>Loại</th>
                      <th>Giá trị</th>
                      <th>Hạn mức</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((r, idx) => (
                      <tr key={idx}>
                        <td><code>{r.code}</code></td>
                        <td>{r.name}</td>
                        <td>{r.discountType}</td>
                        <td>{r.discountValue.toLocaleString('vi-VN')}</td>
                        <td>{r.usageLimit.toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: 4, textAlign: 'center' }}>
                  ... và {parsedRows.length - 10} dòng khác.
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {importing && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#fff', marginBottom: 6 }}>
                <span>Đang xử lý nạp batch vào database...</span>
                <strong>{progress}%</strong>
              </div>
              <div style={{ height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--admin-primary)', transition: 'width 0.2s ease' }} />
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div style={{
              marginTop: 16, padding: 14, borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981',
              color: '#34d399', fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                <CheckCircle size={20} />
                Hoàn tất quá trình Batch Import!
              </div>
              <div>Tổng cộng: <strong>{importResult.total}</strong> | Thành công: <strong>{importResult.success}</strong> | Lỗi: <strong>{importResult.failed}</strong></div>
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
              {importing ? `Đang Import (${progress}%)...` : `Nạp ${parsedRows.length} Voucher Vào DB`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
