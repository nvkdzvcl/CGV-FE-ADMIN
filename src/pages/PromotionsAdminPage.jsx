import React, { useState } from 'react';
import { Gift, Plus, Upload, CheckCircle } from 'lucide-react';
import PromotionModal from '../components/PromotionModal';
import { INITIAL_PROMOTIONS } from '../data/adminMockData';
import { AdminApi } from '../services/adminApi';

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState(INITIAL_PROMOTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [batchResult, setBatchResult] = useState(null);

  const handleStartBatch = () => {
    setBatchResult(null);
    setBatchProgress(0);
    AdminApi.triggerBatchImport(
      (prog) => setBatchProgress(prog),
      (res) => {
        setBatchProgress(null);
        setBatchResult(res);
      }
    );
  };

  return (
    <div className="promotions-admin-page">
      {/* Spring Batch Card */}
      <div className="chart-card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(225,29,72,0.1), var(--admin-bg-card))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Spring Batch Processing (1.000.000 Vouchers)</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              Đọc stream file CSV hàng triệu mã giảm giá với cấu hình Chunk Processing (&lt; 256MB RAM)
            </p>
          </div>

          <button
            className="btn-admin-primary"
            disabled={batchProgress !== null}
            onClick={handleStartBatch}
          >
            <Upload size={16} />
            {batchProgress !== null ? `Đang xử lý: ${batchProgress}%` : 'Kích hoạt Batch Import 1M Voucher'}
          </button>
        </div>

        {batchProgress !== null && (
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${batchProgress}%`, background: 'var(--admin-primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {batchResult && (
          <div style={{
            marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <CheckCircle size={18} />
            <span>
              Job hoàn tất thành công! Đã nạp <strong>{batchResult.processedRows.toLocaleString('vi-VN')}</strong> bản ghi vào PostgreSQL trong {batchResult.executionTimeMs}ms.
            </span>
          </div>
        )}
      </div>

      {/* Promotions Table */}
      <div className="table-panel">
        <div className="table-toolbar">
          <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Danh Sách Voucher Đang Kích Hoạt</h3>
          <button className="btn-admin-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Tạo Voucher Mới
          </button>
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Hình Thức Giảm</th>
                <th>Giá Trị</th>
                <th>Hạng Áp Dụng</th>
                <th>Đã Dùng / Giới Hạn</th>
                <th>Hạn Dùng</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(p => (
                <tr key={p.id}>
                  <td><span className="badge-tag">{p.code}</span></td>
                  <td>{p.discountType === 'FIXED' ? 'Tiền mặt (VNĐ)' : 'Phần trăm (%)'}</td>
                  <td>
                    <strong style={{ color: '#fff' }}>
                      {p.discountType === 'FIXED' ? `${p.discountValue.toLocaleString('vi-VN')}đ` : `${p.discountValue}%`}
                    </strong>
                  </td>
                  <td><span className="status-pill warning">{p.applicableTier}+</span></td>
                  <td>
                    {p.usageCount.toLocaleString('vi-VN')} / {p.usageLimit.toLocaleString('vi-VN')}
                  </td>
                  <td>{p.validTo}</td>
                  <td><span className="status-pill success">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <PromotionModal
          onClose={() => setIsModalOpen(false)}
          onSave={(newP) => setPromotions([newP, ...promotions])}
        />
      )}
    </div>
  );
}