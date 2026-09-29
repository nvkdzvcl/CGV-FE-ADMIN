import React, { useState } from 'react';
import { X, Gift, Check } from 'lucide-react';

export default function PromotionModal({ onClose, onSave }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountValue, setDiscountValue] = useState(50000);
  const [minOrderValue, setMinOrderValue] = useState(150000);
  const [applicableTier, setApplicableTier] = useState('MEMBER');
  const [usageLimit, setUsageLimit] = useState(1000);
  const [validFrom, setValidFrom] = useState('2026-09-24');
  const [validTo, setValidTo] = useState('2026-12-31');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fromIso = new Date(`${validFrom}T00:00:00+07:00`).toISOString();
    const toIso = new Date(`${validTo}T23:59:59+07:00`).toISOString();

    const promoPayload = {
      code: code.toUpperCase().trim(),
      name: name || `Khuyến mãi ${code.toUpperCase().trim()}`,
      description: description || 'Áp dụng giảm giá khi đặt vé tại CGV',
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      applicableTier,
      usageLimit: Number(usageLimit),
      maxUsesPerUser: 1,
      validFrom: fromIso,
      validTo: toIso,
      isActive: true
    };

    setSubmitting(true);
    try {
      await onSave(promoPayload);
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo khuyến mãi.');
    } finally {
      setSubmitting(false);
    }
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
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px', borderRadius: 8, color: '#f87171', fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="form-row">
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
              <div className="form-field">
                <label>Tên chương trình khuyến mãi</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 50K Chào Hè CGV"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
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
                <label>Ngày bắt đầu</label>
                <input
                  type="date"
                  required
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Ngày hết hạn</label>
              <input
                type="date"
                required
                value={validTo}
                onChange={e => setValidTo(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-admin-primary" disabled={submitting}>
              <Check size={16} /> {submitting ? 'Đang lưu...' : 'Lưu voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}