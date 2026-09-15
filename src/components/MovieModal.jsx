import React, { useState } from 'react';
import { X, Film, Check } from 'lucide-react';

export default function MovieModal({ movie, onClose, onSave }) {
  const isEdit = Boolean(movie);
  const [formData, setFormData] = useState(movie || {
    id: 'mov-' + Date.now().toString().slice(-4),
    title: '',
    originalTitle: '',
    director: '',
    duration: 120,
    genre: 'Hành động, Phiêu lưu',
    ageRating: 'T16',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2026-09-15',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop',
    rating: 8.5,
    revenue: 0
  });

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
            {isEdit ? 'Chỉnh Sửa Thông Tin Phim' : 'Thêm Phim Mới Vào Catalog'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body">
            <div className="form-field">
              <label>Tên phim (Tiếng Việt)</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="Ví dụ: Thế Giới Khủng Long: Tái Sinh"
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Tên gốc (Tiếng Anh)</label>
                <input
                  type="text"
                  value={formData.originalTitle}
                  onChange={e => handleChange('originalTitle', e.target.value)}
                  placeholder="Jurassic World Rebirth"
                />
              </div>
              <div className="form-field">
                <label>Đạo diễn</label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={e => handleChange('director', e.target.value)}
                  placeholder="Gareth Edwards"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Thời lượng (phút)</label>
                <input
                  type="number"
                  required
                  value={formData.duration}
                  onChange={e => handleChange('duration', Number(e.target.value))}
                />
              </div>
              <div className="form-field">
                <label>Phân loại độ tuổi</label>
                <select
                  value={formData.ageRating}
                  onChange={e => handleChange('ageRating', e.target.value)}
                >
                  <option value="P">P — Phổ thông mọi lứa tuổi</option>
                  <option value="T13">T13 — Khán giả từ 13 tuổi</option>
                  <option value="T16">T16 — Khán giả từ 16 tuổi</option>
                  <option value="T18">T18 — Khán giả từ 18 tuổi</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Thể loại</label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={e => handleChange('genre', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Trạng thái phát hành</label>
                <select
                  value={formData.showingStatus}
                  onChange={e => handleChange('showingStatus', e.target.value)}
                >
                  <option value="NOW_SHOWING">Đang chiếu (NOW_SHOWING)</option>
                  <option value="COMING_SOON">Sắp chiếu (COMING_SOON)</option>
                  <option value="INACTIVE">Tạm dừng chiếu</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Link Poster (MinIO / S3 URL)</label>
              <input
                type="url"
                value={formData.posterUrl}
                onChange={e => handleChange('posterUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-admin-primary">
              <Check size={16} /> Lưu phim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}