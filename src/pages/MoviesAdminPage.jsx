import React, { useState, useEffect, useMemo } from 'react';
import {
  Film, Plus, Edit2, Trash2, Search, Star, RefreshCw, CheckCircle,
  AlertCircle, FileSpreadsheet, Download, X, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import MovieModal from '../components/MovieModal';
import ExcelImportMovieModal from '../components/ExcelImportMovieModal';
import { AdminApi } from '../services/adminApi';
import { exportMoviesToExcel } from '../services/exportExcel';
import { realtime, REALTIME_EVENTS } from '../services/realtimeService';

export default function MoviesAdminPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ageRatingFilter, setAgeRatingFilter] = useState('ALL');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editingMovie, setEditingMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadMovies = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getMovies();
      setMovies(data);
    } catch (err) {
      showNotice('error', 'Lỗi tải danh mục phim: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
    const unsub = realtime.subscribe(msg => {
      if (msg.type === REALTIME_EVENTS.MOVIE_STATUS_CHANGED) {
        console.log('[MoviesAdminPage] 🔄 Nhận sự kiện Realtime MOVIE_STATUS_CHANGED, tự động tải lại...');
        loadMovies();
      }
    });
    return unsub;
  }, []);

  // Trích xuất danh sách thể loại độc nhất từ dữ liệu phim
  const availableGenres = useMemo(() => {
    const set = new Set();
    movies.forEach(m => {
      if (m.genre) {
        m.genre.split(',').forEach(g => {
          const trimmed = g.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [movies]);

  // Bộ lọc nâng cao đa tiêu chí
  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
        (m.director && m.director.toLowerCase().includes(q)) ||
        (m.actors && m.actors.toLowerCase().includes(q)) ||
        (m.genre && m.genre.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || m.showingStatus === statusFilter;
      const matchesAge = ageRatingFilter === 'ALL' || m.ageRating === ageRatingFilter;
      const matchesGenre = genreFilter === 'ALL' || (m.genre && m.genre.toLowerCase().includes(genreFilter.toLowerCase()));

      return matchesSearch && matchesStatus && matchesAge && matchesGenre;
    });
  }, [movies, search, statusFilter, ageRatingFilter, genreFilter]);

  // Tự động về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, ageRatingFilter, genreFilter, pageSize]);

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize));
  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovies.slice(start, start + pageSize);
  }, [filteredMovies, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setIsModalOpen(true);
  };

  const handleShowingStatusToggle = async (movie, newStatus) => {
    try {
      await AdminApi.updateMovieShowingStatus(movie.id, newStatus, movie.title);
      setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, showingStatus: newStatus } : m));
      const statusText = newStatus === 'NOW_SHOWING' ? 'Đang chiếu' : (newStatus === 'COMING_SOON' ? 'Sắp chiếu' : 'Đã ngừng chiếu');
      showNotice('success', `Đã cập nhật trạng thái phim "${movie.title}" sang [${statusText}].`);
    } catch (err) {
      showNotice('error', 'Không thể đổi trạng thái phim: ' + err.message);
    }
  };

  const handleSaveMovie = async (savedData) => {
    try {
      if (editingMovie) {
        await AdminApi.updateMovie(editingMovie.id, savedData);
        showNotice('success', `Đã cập nhật phim "${savedData.title}" thành công.`);
      } else {
        await AdminApi.createMovie(savedData);
        showNotice('success', `Đã thêm phim mới "${savedData.title}" vào catalog thành công.`);
      }
      loadMovies();
    } catch (err) {
      showNotice('error', 'Lỗi lưu phim: ' + err.message);
      throw err;
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setAgeRatingFilter('ALL');
    setGenreFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || statusFilter !== 'ALL' || ageRatingFilter !== 'ALL' || genreFilter !== 'ALL');

  return (
    <div className="movies-admin-page">
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

      <div className="table-panel">
        <div className="table-toolbar">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Kho Phim & Tác Phẩm Điện Ảnh ({movies.length})</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
              Quản trị metadata, phân loại độ tuổi, định dạng chiếu và trạng thái phát hành
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-admin-secondary" onClick={loadMovies} title="Tải lại">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-admin-secondary" onClick={() => exportMoviesToExcel(filteredMovies)} title="Xuất Excel danh sách đang lọc">
              <Download size={15} /> Xuất Excel ({filteredMovies.length})
            </button>
            <button className="btn-admin-secondary" onClick={() => setIsImportOpen(true)}>
              <FileSpreadsheet size={15} /> Import Excel / CSV
            </button>
            <button className="btn-admin-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Thêm Phim Mới
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
              placeholder="Tìm phim theo tựa đề, tên gốc, đạo diễn, diễn viên..."
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

          {/* Showing Status Filter */}
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
              <option value="ALL">🎬 Mọi trạng thái chiếu</option>
              <option value="NOW_SHOWING">Đang chiếu (NOW_SHOWING)</option>
              <option value="COMING_SOON">Sắp chiếu (COMING_SOON)</option>
              <option value="ENDED">Đã ngừng chiếu (ENDED)</option>
            </select>
          </div>

          {/* Age Rating Filter */}
          <div>
            <select
              value={ageRatingFilter}
              onChange={e => setAgeRatingFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">🔞 Mọi độ tuổi (Age Rating)</option>
              <option value="P">P (Mọi lứa tuổi)</option>
              <option value="K">K (Khán giả dưới 13 tuổi có kèm người giám hộ)</option>
              <option value="T13">T13 (Từ 13 tuổi trở lên)</option>
              <option value="T16">T16 (Từ 16 tuổi trở lên)</option>
              <option value="T18">T18 (Từ 18 tuổi trở lên)</option>
              <option value="C">C (Cấm phổ biến)</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <select
              value={genreFilter}
              onChange={e => setGenreFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)',
                color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              <option value="ALL">🎭 Mọi thể loại phim</option>
              {availableGenres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
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
                <th>Poster</th>
                <th>Tên Phim</th>
                <th>Thời Lượng</th>
                <th>Độ Tuổi</th>
                <th>Thể Loại</th>
                <th>Khởi Chiếu</th>
                <th>Trạng Thái Chiếu</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Đang tải danh sách phim từ Catalog Service...
                  </td>
                </tr>
              ) : filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--admin-text-muted)' }}>
                    Không có phim nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedMovies.map(m => (
                  <tr key={m.id}>
                    <td>
                      <img
                        src={m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100'}
                        alt={m.title}
                        style={{ width: 44, height: 60, borderRadius: 6, objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{m.title}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{m.originalTitle}</div>
                    </td>
                    <td>{m.duration} phút</td>
                    <td><span className="status-pill info">{m.ageRating}</span></td>
                    <td>{m.genre}</td>
                    <td>{m.releaseDate}</td>
                    <td>
                      <select
                        value={m.showingStatus}
                        onChange={e => handleShowingStatusToggle(m, e.target.value)}
                        style={{
                          background: m.showingStatus === 'NOW_SHOWING' ? 'rgba(16, 185, 129, 0.15)' : (m.showingStatus === 'COMING_SOON' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.15)'),
                          border: `1px solid ${m.showingStatus === 'NOW_SHOWING' ? '#10b981' : (m.showingStatus === 'COMING_SOON' ? '#f59e0b' : '#64748b')}`,
                          color: m.showingStatus === 'NOW_SHOWING' ? '#34d399' : (m.showingStatus === 'COMING_SOON' ? '#fbbf24' : '#94a3b8'),
                          padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        <option value="NOW_SHOWING" style={{ background: '#0f172a', color: '#fff' }}>Đang chiếu</option>
                        <option value="COMING_SOON" style={{ background: '#0f172a', color: '#fff' }}>Sắp chiếu</option>
                        <option value="ENDED" style={{ background: '#0f172a', color: '#fff' }}>Đã kết thúc</option>
                      </select>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button className="btn-table-icon" onClick={() => handleOpenEdit(m)} title="Chỉnh sửa">
                          <Edit2 size={15} />
                        </button>
                      </div>
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
              {filteredMovies.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong> đến <strong style={{ color: '#fff' }}>
              {Math.min(currentPage * pageSize, filteredMovies.length)}
            </strong> trong số <strong style={{ color: '#fff' }}>{filteredMovies.length}</strong> phim
            {filteredMovies.length !== movies.length && (
              <span style={{ marginLeft: 6, color: 'var(--admin-text-muted)' }}>
                (lọc từ tổng số {movies.length} phim)
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
                <option value={50}>50</option>
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
        <MovieModal
          movie={editingMovie}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMovie}
        />
      )}

      {isImportOpen && (
        <ExcelImportMovieModal
          onClose={() => setIsImportOpen(false)}
          onImportComplete={() => { setIsImportOpen(false); loadMovies(); }}
        />
      )}
    </div>
  );
}