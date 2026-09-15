import React, { useState } from 'react';
import { Film, Plus, Edit2, Trash2, Search, Star } from 'lucide-react';
import MovieModal from '../components/MovieModal';
import { INITIAL_MOVIES } from '../data/adminMockData';

export default function MoviesAdminPage() {
  const [movies, setMovies] = useState(INITIAL_MOVIES);
  const [search, setSearch] = useState('');
  const [editingMovie, setEditingMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredMovies = movies.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genre.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phim này khỏi danh mục?')) {
      setMovies(movies.filter(m => m.id !== id));
    }
  };

  const handleSaveMovie = (savedData) => {
    if (editingMovie) {
      setMovies(movies.map(m => m.id === savedData.id ? savedData : m));
    } else {
      setMovies([savedData, ...movies]);
    }
  };

  return (
    <div className="movies-admin-page">
      <div className="table-panel">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input
              type="text"
              className="table-search-input"
              placeholder="Tìm phim theo tên hoặc thể loại..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button className="btn-admin-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Thêm Phim Mới
          </button>
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
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map(m => (
                <tr key={m.id}>
                  <td>
                    <img src={m.posterUrl} alt={m.title} style={{ width: 44, height: 60, borderRadius: 6, objectFit: 'cover' }} />
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
                    <span className={`status-pill ${m.showingStatus === 'NOW_SHOWING' ? 'success' : 'warning'}`}>
                      {m.showingStatus === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
                    </span>
                  </td>
                  <td>
                    <div className="table-action-btns">
                      <button className="btn-table-icon" onClick={() => handleOpenEdit(m)} title="Chỉnh sửa">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-table-icon delete" onClick={() => handleDelete(m.id)} title="Xóa">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <MovieModal
          movie={editingMovie}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMovie}
        />
      )}
    </div>
  );
}