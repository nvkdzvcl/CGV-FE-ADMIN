import React, { useState, useEffect, useRef } from 'react';
import { X, Film, Check, Plus, Trash2, Upload, Play, User } from 'lucide-react';
import { AdminApi } from '../services/adminApi';

const SUPPORTED_MODES = ['2D', '3D', 'IMAX', '4DX', 'GOLD_CLASS'];
const LANGUAGES = ['Tiếng Việt', 'English', 'Song ngữ (Vi-Anh)', 'Phương ngữ khác'];
const CAST_ROLES = ['ACTOR', 'ACTRESS', 'DIRECTOR', 'PRODUCER', 'WRITER', 'COMPOSER'];

function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function MovieModal({ movie, onClose, onSave }) {
  const isEdit = Boolean(movie);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: movie?.title || '',
    originalTitle: movie?.originalTitle || '',
    director: movie?.director || '',
    durationMinutes: movie?.duration || movie?.durationMinutes || 120,
    ageRating: movie?.ageRating || 'P',
    showingStatus: movie?.showingStatus || 'NOW_SHOWING',
    releaseDate: movie?.releaseDate ? String(movie.releaseDate).substring(0, 10) : new Date().toISOString().split('T')[0],
    endDate: movie?.endDate ? String(movie.endDate).substring(0, 10) : '',
    posterUrl: movie?.posterUrl || movie?.poster || '',
    trailerYoutubeUrl: movie?.trailerYoutubeUrl || '',
    synopsis: movie?.synopsis || '',
    language: movie?.language || 'Tiếng Việt',
    subtitle: movie?.subtitle || '',
    supportedModes: Array.isArray(movie?.supportedModes)
      ? movie.supportedModes
      : (typeof movie?.supportedModes === 'string'
        ? movie.supportedModes.split(',').map(s => s.trim()).filter(Boolean)
        : ['2D']),
    isFeatured: movie?.isFeatured || false,
    genreIds: [],
    status: movie?.status || 'ACTIVE'
  });

  const [genres, setGenres] = useState([]);
  const [castList, setCastList] = useState([]);
  const [newCast, setNewCast] = useState({ actorName: '', role: 'ACTOR', characterName: '', avatarUrl: '', displayOrder: 1 });
  const [showCastForm, setShowCastForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadStep, setUploadStep] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'cast' | 'media'

  useEffect(() => {
    AdminApi.getGenres().then(data => {
      setGenres(data);
      // Pre-select genres from movie
      if (movie?.genres && Array.isArray(movie.genres)) {
        const ids = movie.genres.map(g => g.id || g).filter(Boolean);
        setFormData(prev => ({ ...prev, genreIds: ids }));
      } else if (movie?.genreIds && Array.isArray(movie.genreIds)) {
        setFormData(prev => ({ ...prev, genreIds: movie.genreIds }));
      }
    }).catch(() => {});

    if (isEdit && movie?.id) {
      AdminApi.getMovieCast(movie.id).then(cast => {
        setCastList(Array.isArray(cast) ? cast : []);
      }).catch(() => {});
    }
  }, []);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const toggleGenre = (genreId) => {
    setFormData(prev => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter(id => id !== genreId)
        : [...prev.genreIds, genreId]
    }));
  };

  const toggleMode = (mode) => {
    setFormData(prev => ({
      ...prev,
      supportedModes: prev.supportedModes.includes(mode)
        ? prev.supportedModes.filter(m => m !== mode)
        : [...prev.supportedModes, mode]
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSubmitError('');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCast = () => {
    if (!newCast.actorName.trim()) return;
    setCastList(prev => [...prev, { ...newCast, id: `temp-${Date.now()}` }]);
    setNewCast({ actorName: '', role: 'ACTOR', characterName: '', avatarUrl: '', displayOrder: castList.length + 2 });
    setShowCastForm(false);
  };

  const handleRemoveCast = (castId) => {
    setCastList(prev => prev.filter(c => c.id !== castId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      let finalPosterUrl = formData.posterUrl;

      // ─── CHỈ KHI ẤN NÚT LƯU MỚI TIẾN HÀNH UPLOAD LÊN S3 ───
      if (selectedFile) {
        setUploadStep('Đang tải ảnh lên S3...');
        const uploadResult = await AdminApi.uploadMedia(selectedFile);
        finalPosterUrl = uploadResult?.url || uploadResult?.fileUrl || uploadResult?.publicUrl || uploadResult;
      }

      setUploadStep('Đang lưu thông tin phim...');
      const payload = {
        ...formData,
        posterUrl: finalPosterUrl,
        releaseDate: formData.releaseDate ? formData.releaseDate : null,
        endDate: formData.endDate ? formData.endDate : null,
        durationMinutes: Number(formData.durationMinutes || 120),
        cast: castList.map(c => ({
          actorName: c.actorName,
          role: c.role,
          characterName: c.characterName,
          avatarUrl: c.avatarUrl,
          displayOrder: c.displayOrder
        }))
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Lỗi lưu thông tin phim');
    } finally {
      setSubmitting(false);
      setUploadStep('');
    }
  };

  const ytId = extractYoutubeId(formData.trailerYoutubeUrl);

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    background: activeTab === tab ? 'var(--admin-primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--admin-text-muted)',
    transition: 'all 0.2s'
  });

  return (
    <div className="modal-admin-overlay" onClick={onClose}>
      <div className="modal-admin-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 780, width: '95vw' }}>
        <div className="modal-admin-header">
          <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
            <Film size={18} style={{ display: 'inline', marginRight: 8 }} />
            {isEdit ? 'Chỉnh Sửa Thông Tin Phim' : 'Thêm Phim Mới Vào Catalog'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--admin-text-muted)' }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', borderBottom: '1px solid var(--admin-border)' }}>
          <button style={tabStyle('basic')} onClick={() => setActiveTab('basic')}>Thông tin cơ bản</button>
          <button style={tabStyle('cast')} onClick={() => setActiveTab('cast')}>Diễn viên ({castList.length})</button>
          <button style={tabStyle('media')} onClick={() => setActiveTab('media')}>Poster & Trailer</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-admin-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>

            {submitError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px', borderRadius: 8, color: '#f87171', fontSize: '0.85rem',
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8
              }}>
                ⚠️ <span>{submitError}</span>
              </div>
            )}

            {/* TAB 1: Basic Info */}
            {activeTab === 'basic' && (
              <div>
                <div className="form-field">
                  <label>Tên phim (Tiếng Việt) *</label>
                  <input type="text" required value={formData.title}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder="Ví dụ: Thế Giới Khủng Long: Tái Sinh" />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Tên gốc (Tiếng Anh)</label>
                    <input type="text" value={formData.originalTitle}
                      onChange={e => handleChange('originalTitle', e.target.value)}
                      placeholder="Jurassic World Rebirth" />
                  </div>
                  <div className="form-field">
                    <label>Đạo diễn</label>
                    <input type="text" value={formData.director}
                      onChange={e => handleChange('director', e.target.value)}
                      placeholder="Gareth Edwards" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Thời lượng (phút) *</label>
                    <input type="number" required value={formData.durationMinutes}
                      onChange={e => handleChange('durationMinutes', Number(e.target.value))} />
                  </div>
                  <div className="form-field">
                    <label>Phân loại độ tuổi</label>
                    <select value={formData.ageRating} onChange={e => handleChange('ageRating', e.target.value)}>
                      <option value="P">P — Phổ thông mọi lứa tuổi</option>
                      <option value="K">K — Dưới 13 tuổi có phụ huynh</option>
                      <option value="T13">T13 — Từ 13 tuổi</option>
                      <option value="T16">T16 — Từ 16 tuổi</option>
                      <option value="T18">T18 — Từ 18 tuổi</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Ngôn ngữ</label>
                    <select value={formData.language} onChange={e => handleChange('language', e.target.value)}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Phụ đề</label>
                    <input type="text" value={formData.subtitle}
                      onChange={e => handleChange('subtitle', e.target.value)}
                      placeholder="Phụ đề tiếng Việt" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Ngày khởi chiếu</label>
                    <input type="date" value={formData.releaseDate}
                      onChange={e => handleChange('releaseDate', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Ngày kết thúc chiếu (dự kiến)</label>
                    <input type="date" value={formData.endDate}
                      onChange={e => handleChange('endDate', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label>Trạng thái phát hành</label>
                    <select value={formData.showingStatus} onChange={e => handleChange('showingStatus', e.target.value)}>
                      <option value="NOW_SHOWING">Đang chiếu</option>
                      <option value="COMING_SOON">Sắp chiếu</option>
                      <option value="ENDED">Đã kết thúc / Ngừng chiếu</option>
                    </select>
                  </div>
                </div>

                {/* Formats */}
                <div className="form-field">
                  <label>Phiên bản chiếu (chọn nhiều)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {SUPPORTED_MODES.map(mode => (
                      <button key={mode} type="button"
                        onClick={() => toggleMode(mode)}
                        style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                          cursor: 'pointer', border: '1px solid',
                          background: formData.supportedModes.includes(mode) ? 'var(--admin-primary)' : 'transparent',
                          borderColor: formData.supportedModes.includes(mode) ? 'var(--admin-primary)' : 'var(--admin-border)',
                          color: formData.supportedModes.includes(mode) ? '#fff' : 'var(--admin-text-muted)'
                        }}>
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                <div className="form-field">
                  <label>Thể loại phim (chọn nhiều)</label>
                  {genres.length === 0 ? (
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', marginTop: 6 }}>Nhập thể loại thủ công:</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                      {genres.map(g => (
                        <button key={g.id} type="button"
                          onClick={() => toggleGenre(g.id)}
                          style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                            cursor: 'pointer', border: '1px solid',
                            background: formData.genreIds.includes(g.id) ? 'rgba(225,29,72,0.2)' : 'transparent',
                            borderColor: formData.genreIds.includes(g.id) ? '#e11d48' : 'var(--admin-border)',
                            color: formData.genreIds.includes(g.id) ? '#fb7185' : 'var(--admin-text-muted)'
                          }}>
                          {g.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* isFeatured */}
                <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ margin: 0 }}>Nổi bật (Featured)</label>
                  <button type="button"
                    onClick={() => handleChange('isFeatured', !formData.isFeatured)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: formData.isFeatured ? 'var(--admin-primary)' : '#374151',
                      position: 'relative', transition: 'background 0.2s'
                    }}>
                    <span style={{
                      position: 'absolute', top: 2, left: formData.isFeatured ? 22 : 2,
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s', display: 'block'
                    }} />
                  </button>
                  <span style={{ fontSize: '0.82rem', color: formData.isFeatured ? '#34d399' : 'var(--admin-text-muted)' }}>
                    {formData.isFeatured ? 'Hiện thị trang chủ' : 'Không nổi bật'}
                  </span>
                </div>

                <div className="form-field">
                  <label>Tóm tắt cốt truyện (Synopsis)</label>
                  <textarea rows={4} value={formData.synopsis}
                    onChange={e => handleChange('synopsis', e.target.value)}
                    style={{
                      width: '100%', background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                      borderRadius: 'var(--radius-md)', padding: '8px 12px', color: '#fff', fontSize: '0.85rem',
                      resize: 'vertical'
                    }}
                    placeholder="Nội dung tóm tắt phim..." />
                </div>
              </div>
            )}

            {/* TAB 2: Cast */}
            {activeTab === 'cast' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Diễn viên và đội ngũ sản xuất</span>
                  <button type="button" className="btn-admin-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    onClick={() => setShowCastForm(!showCastForm)}>
                    <Plus size={14} /> Thêm diễn viên
                  </button>
                </div>

                {showCastForm && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid var(--admin-border)' }}>
                    <div className="form-row">
                      <div className="form-field">
                        <label>Tên diễn viên *</label>
                        <input type="text" value={newCast.actorName}
                          onChange={e => setNewCast(p => ({ ...p, actorName: e.target.value }))}
                          placeholder="Ngô Thanh Vân" />
                      </div>
                      <div className="form-field">
                        <label>Vai trò</label>
                        <select value={newCast.role} onChange={e => setNewCast(p => ({ ...p, role: e.target.value }))}>
                          {CAST_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-field">
                      <label>Tên nhân vật</label>
                      <input type="text" value={newCast.characterName}
                        onChange={e => setNewCast(p => ({ ...p, characterName: e.target.value }))}
                        placeholder="Tên nhân vật trong phim" />
                    </div>
                    <div className="form-field">
                      <label>Link ảnh đại diện (Avatar URL)</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {newCast.avatarUrl && (
                          <img src={newCast.avatarUrl} alt="preview"
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--admin-border)' }}
                            onError={e => e.target.style.display = 'none'} />
                        )}
                        <input type="url" value={newCast.avatarUrl} style={{ flex: 1 }}
                          onChange={e => setNewCast(p => ({ ...p, avatarUrl: e.target.value }))}
                          placeholder="https://... (URL ảnh đại diện diễn viên)" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                      <button type="button" className="btn-admin-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        onClick={() => setShowCastForm(false)}>Hủy</button>
                      <button type="button" className="btn-admin-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        onClick={handleAddCast}><Check size={14} /> Lưu diễn viên</button>
                    </div>
                  </div>
                )}

                {castList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--admin-text-muted)' }}>
                    <User size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    Chưa có diễn viên nào. Nhấn ""Thêm diễn viên" để bắt đầu.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {castList.map(cast => (
                      <div key={cast.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)'
                      }}>
                        {cast.avatarUrl ? (
                          <img src={cast.avatarUrl} alt={cast.actorName}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--admin-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="var(--admin-primary)" />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{cast.actorName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                            {cast.role} {cast.characterName ? `— "${cast.characterName}"` : ''}
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveCast(cast.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Media */}
            {activeTab === 'media' && (
              <div>
                {/* Poster Upload */}
                <div className="form-field">
                  <label>Poster phim</label>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 8 }}>
                    {(previewUrl || formData.posterUrl) && (
                      <div style={{ position: 'relative' }}>
                        <img src={previewUrl || formData.posterUrl} alt="poster"
                          style={{ width: 85, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--admin-border)' }} />
                        {selectedFile && (
                          <span style={{
                            position: 'absolute', bottom: 4, left: 4, right: 4,
                            background: '#10b981', color: '#000', fontSize: '0.65rem',
                            fontWeight: 800, textAlign: 'center', borderRadius: 4, padding: '2px 0'
                          }}>
                            Chờ tải lên
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <input type="url" value={formData.posterUrl}
                        onChange={e => {
                          handleChange('posterUrl', e.target.value);
                          if (selectedFile) handleRemoveFile();
                        }}
                        placeholder="https://... (dán URL ảnh hoặc chọn file từ máy)"
                        style={{ width: '100%', marginBottom: 8 }} />
                      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
                        onChange={handleFileSelect} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" className="btn-admin-secondary"
                          style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                          onClick={() => fileInputRef.current?.click()}>
                          <Upload size={14} /> {selectedFile ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}
                        </button>

                        {selectedFile && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.25)' }}>
                            <span>📁 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB) — Sẽ tải lên S3 khi bạn bấm nút Lưu</span>
                            <button type="button" onClick={handleRemoveFile}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex' }}
                              title="Hủy chọn file">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* YouTube Trailer */}
                <div className="form-field">
                  <label>Link Trailer YouTube</label>
                  <input type="url" value={formData.trailerYoutubeUrl}
                    onChange={e => handleChange('trailerYoutubeUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
                  {ytId && (
                    <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,0,0,0.1)', borderBottom: '1px solid var(--admin-border)' }}>
                        <Play size={14} color="#ef4444" />
                        <span style={{ fontSize: '0.78rem', color: '#f87171' }}>Xem trước trailer YouTube</span>
                      </div>
                      <iframe
                        width="100%" height="220"
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="YouTube trailer preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ display: 'block' }}
                      />
                    </div>
                  )}
                  {formData.trailerYoutubeUrl && !ytId && (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#f59e0b' }}>
                      ⚠️ URL YouTube không hợp lệ. Vui lòng kiểm tra lại.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-admin-footer">
            <button type="button" className="btn-admin-secondary" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" className="btn-admin-primary" disabled={submitting}>
              <Check size={16} /> {submitting ? (uploadStep || 'Đang lưu...') : (isEdit ? 'Cập nhật phim' : 'Tạo phim mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}