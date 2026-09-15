import React, { useState } from 'react';
import { X, Gift, Check } from 'lucide-react';

export default function PromotionModal({ onClose, onSave }) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountValue, setDiscountValue] = useState(50000);
  const [minOrderValue, setMinOrderValue] = useState(150000);
  const [applicableTier, setApplicableTier] = useState('MEMBER');
  const [usageLimit, setUsageLimit] = useState(10000);
  const [validTo, setValidTo] = useState('2026-12-31');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: 'promo-' + Date.now().toString().slice(-4),
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      applicableTier,
      usageLimit: Number(usageLimit),
      usageCount: 0,
      validTo,
      status: 'ACTIVE'
    });
    onClose();
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Tạo Mã Giảm Giá / Voucher Mới</h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body">
            <div className="form-field">
              <label>Mã Voucher (Code)</label>
              <input
                type="text"
                required
                placeholder="VD: CGVSUMMER50K"
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Hình thức giảm</label>
                <select value={discountType} onChange={e => setDiscountType(e.target.value)}>
                  <option value="FIXED">Giảm tiền mặt cố định (VNĐ)</option>
                  <option value="PERCENT">Giảm theo phần trăm (%)</option>
                </select>
              </div>
              <div className="form-field">
                <label>Giá trị giảm ({discountType === 'FIXED' ? 'VNĐ' : '%'})</label>
                <input
                  type="number"
                  required
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Đơn tối thiểu (VNĐ)</label>
                <input
                  type="number"
                  value={minOrderValue}
                  onChange={e => setMinOrderValue(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Áp dụng cho Hạng Thành Viên</label>
                <select value={applicableTier} onChange={e => setApplicableTier(e.target.value)}>
                  <option value="MEMBER">Tất cả hội viên (MEMBER+)</option>
                  <option value="VIP">Chỉ VIP & VVIP</option>
                  <option value="VVIP">Chỉ độc quyền VVIP (Bạch Kim)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Giới hạn số lượng (usage_limit)</label>
                <input
                  type="number"
                  required
                  value={usageLimit}
                  onChange={e => setUsageLimit(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Hạn sử dụng đến ngày</label>
                <input
                  type="date"
                  required
                  value={validTo}
                  onChange={e => setValidTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-admin-primary">
              <Check size={16} /> Tạo Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}