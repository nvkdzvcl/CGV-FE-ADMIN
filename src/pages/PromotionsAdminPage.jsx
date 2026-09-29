import React, { useState, useEffect, useMemo } from 'react';
import {
  Gift, Plus, CheckCircle, RefreshCw, Trash2, AlertCircle,
  FileSpreadsheet, Download, Search, X, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import PromotionModal from '../components/PromotionModal';
import ExcelImportVoucherModal from '../components/ExcelImportVoucherModal';
import { AdminApi } from '../services/adminApi';
import { exportPromotionsToExcel } from '../services/exportExcel';

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getPromotions();
      setPromotions(data);
    } catch (err) {
      showNotice('error', 'Lỗi tải danh sách khuyến mãi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCreatePromotion = async (promoData) => {
    try {
      await AdminApi.createPromotion(promoData);
      showNotice('success', `Đã tạo voucher "${promoData.code}" thành công!`);
      loadPromotions();
    } catch (err) {
      showNotice('error', 'Không thể tạo voucher: ' + err.message);
      throw err;
    }
  };

  const handleDeletePromotion = async (promo) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khuyến mãi "${promo.code}"?`)) {
      return;
    }
    try {
      await AdminApi.deletePromotion(promo.id);
      showNotice('success', `Đã xóa khuyến mãi "${promo.code}" thành công.`);
      loadPromotions();
    } catch (err) {
      showNotice('error', err.message || 'Không thể xóa khuyến mãi.');
    }
  };

  // ─── BỘ LỌC TÌM KIẾM ĐA TIÊU CHÍ ───
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      // 1. Tìm theo Mã hoặc Tên voucher
      const q = search.trim().toLowerCase();
      if (q) {
        const matchCode = p.code && p.code.toLowerCase().includes(q);
        const matchName = p.name && p.name.toLowerCase().includes(q);
        const matchDesc = p.description && p.description.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDesc) return false;
      }

      // 2. Hình thức giảm
      if (discountTypeFilter !== 'ALL') {
        const dt = (p.discountType || '').toUpperCase();
        if (discountTypeFilter === 'PERCENTAGE' && !dt.includes('PERCENT')) return false;
        if (discountTypeFilter === 'FIXED' && !dt.includes('FIXED')) return false;
      }

      // 3. Hạng áp dụng
      if (tierFilter !== 'ALL') {
        const t = (p.applicableTier || 'ALL').toUpperCase();
        if (t !== tierFilter) return false;
      }

      // 4. Trạng thái hoạt động
      if (statusFilter !== 'ALL') {
        const isActive = p.isActive ?? true;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      return true;
    });
  }, [promotions, search, discountTypeFilter, tierFilter, statusFilter]);

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [search, discountTypeFilter, tierFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / pageSize));
  const paginatedPromotions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPromotions.slice(start, start + pageSize);
  }, [filteredPromotions, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setDiscountTypeFilter('ALL');
    setTierFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || discountTypeFilter !== 'ALL' || tierFilter !== 'ALL' || statusFilter !== 'ALL');

  return (
    <div className="promotions-admin-page">
      {/* Toast Notification */}
      {notification && (
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
      )}

      {/* Promotions Table */}
      <div className="table-panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Danh Sách Voucher & Khuyến Mãi ({promotions.length})</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Chống Race-Condition giữ voucher Redis Lua Script & kiểm soát hạn mức chiết khấu
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-admin-secondary" onClick={loadPromotions} title="Làm mới">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-admin-secondary" onClick={() => exportPromotionsToExcel(filteredPromotions)} title="Xuất Excel">
              <Download size={16} /> Xuất Excel ({filteredPromotions.length})
            </button>
            <button className="btn-admin-secondary" onClick={() => setIsImportModalOpen(true)}>
              <FileSpreadsheet size={16} /> Import Excel / CSV
            </button>
            <button className="btn-admin-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Tạo Voucher Mới
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc nâng cao */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--admin-border)',
          background: 'rgba(255,255,255,0.015)',
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr 1fr 1fr auto',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              className="table-search-input"
              style={{ width: '100%', paddingLeft: 36, paddingRight: 32 }}
              placeholder="Tìm theo mã voucher hoặc tên chương trình..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Discount Type Filter */}
          <div>
            <select
              value={discountTypeFilter}
              onChange={e => setDiscountTypeFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">🎁 Mọi hình thức giảm</option>
              <option value="PERCENTAGE">Phần trăm (%)</option>
              <option value="FIXED">Số tiền cố định (VNĐ)</option>
            </select>
          </div>

          {/* Applicable Tier Filter */}
          <div>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">👑 Mọi hạng thành viên</option>
              <option value="MEMBER">Hạng MEMBER</option>
              <option value="VIP">Hạng VIP</option>
              <option value="VVIP">Hạng VVIP</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">🔘 Mọi trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm khóa / Hết hạn</option>
            </select>
          </div>

          {/* Quick Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn-admin-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              title="Xóa bộ lọc"
            >
              <X size={14} /> Xóa lọc
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Tên Chương Trình</th>
                <th>Hình Thức Giảm</th>
                <th>Giá Trị</th>
                <th>Hạng Áp Dụng</th>
                <th>Đã Dùng / Giới Hạn</th>
                <th>Hạn Dùng</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Đang tải danh sách khuyến mãi từ Marketing Service...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Không tìm thấy khuyến mãi nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedPromotions.map(p => (
                  <tr key={p.id}>
                    <td><span className="badge-tag">{p.code}</span></td>
                    <td><strong style={{ color: '#fff' }}>{p.name}</strong></td>
                    <td>{p.discountType === 'FIXED' || p.discountType === 'FIXED_AMOUNT' ? 'Tiền mặt (VNĐ)' : 'Phần trăm (%)'}</td>
                    <td>
                      <strong style={{ color: '#34d399' }}>
                        {p.discountType === 'FIXED' || p.discountType === 'FIXED_AMOUNT'
                          ? `${Number(p.discountValue || 0).toLocaleString('vi-VN')} đ`
                          : `${p.discountValue}%`}
                      </strong>
                    </td>
                    <td><span className="status-pill warning">{p.applicableTier || 'ALL'}+</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {Number(p.usedCount || 0).toLocaleString('vi-VN')} / {Number(p.usageLimit || 0).toLocaleString('vi-VN')}
                      </div>
                      <div style={{
                        width: '100%', height: 4, background: 'rgba(255,255,255,0.1)',
                        borderRadius: 2, marginTop: 4, overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          background: '#10b981',
                          width: `${Math.min(100, ((Number(p.usedCount || 0) / Math.max(1, Number(p.usageLimit || 1))) * 100))}%`
                        }} />
                      </div>
                    </td>
                    <td>{p.validTo ? String(p.validTo).substring(0, 10) : 'Vô thời hạn'}</td>
                    <td>
                      <span className={`status-pill ${p.isActive ? 'success' : 'danger'}`}>
                        {p.isActive ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-table-icon delete"
                        onClick={() => handleDeletePromotion(p)}
                        title="Xóa voucher"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          borderTop: '1px solid var(--admin-border)',
          background: 'rgba(255,255,255,0.015)',
          fontSize: '0.82rem',
          color: 'var(--admin-text-secondary)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            Hiển thị <strong style={{ color: '#fff' }}>
              {filteredPromotions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong> đến <strong style={{ color: '#fff' }}>
              {Math.min(currentPage * pageSize, filteredPromotions.length)}
            </strong> trong số <strong style={{ color: '#fff' }}>{filteredPromotions.length}</strong> voucher
            {filteredPromotions.length !== promotions.length && (
              <span style={{ marginLeft: 6, color: 'var(--admin-text-muted)' }}>
                (lọc từ {promotions.length} voucher ban đầu)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  background: 'var(--admin-bg-input, #0f172a)',
                  border: '1px solid var(--admin-border, #334155)',
                  borderRadius: 6,
                  color: '#cbd5e1',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: 'var(--admin-bg-input, #1e293b)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: currentPage <= 1 ? '#475569' : '#cbd5e1',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <ChevronLeft size={13} /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsisBefore && <span style={{ padding: '0 4px', color: '#64748b' }}>...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: currentPage === p ? 'var(--admin-primary, #e11d48)' : 'var(--admin-bg-input, #1e293b)',
                            border: '1px solid ' + (currentPage === p ? 'var(--admin-primary, #e11d48)' : 'var(--admin-border, #334155)'),
                            color: '#fff',
                            fontWeight: currentPage === p ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: 'var(--admin-bg-input, #1e293b)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: currentPage >= totalPages ? '#475569' : '#cbd5e1',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  Sau <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <PromotionModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreatePromotion}
        />
      )}

      {isImportModalOpen && (
        <ExcelImportVoucherModal
          onClose={() => setIsImportModalOpen(false)}
          onImportDone={() => {
            showNotice('success', 'Đã cập nhật danh sách voucher sau khi import.');
            loadPromotions();
          }}
        />
      )}
    </div>
  );
}