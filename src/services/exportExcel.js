import ExcelJS from 'exceljs/dist/exceljs.min.js';

/**
 * Tiện ích Export Excel chuẩn định dạng .XLSX (Microsoft Excel Workbook)
 * - Tự động thiết lập ComboBox / Dropdown danh sách lựa chọn (Data Validation) cho các trường ENUM / cố định
 * - Định dạng header chuẩn thương hiệu CGV (Màu đỏ #E71A0F, chữ trắng in đậm)
 * - Auto-fit độ rộng cột, viền ô sắc nét, hiển thị phân tách cột 100% trên Excel Mac & Windows
 */

async function saveWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function applyHeaderStyle(headerRow) {
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE71A0F' } // CGV Brand Red
  };
  headerRow.height = 28;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

function applyRowBorder(row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
    cell.alignment = { vertical: 'middle' };
  });
}

// ─── 1. EXPORT MOVIES (DANH SÁCH PHIM) ───
export async function exportMoviesToExcel(movies = []) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Danh Sách Phim');

  ws.columns = [
    { header: 'STT', key: 'stt', width: 7 },
    { header: 'Tiêu đề phim (title)', key: 'title', width: 34 },
    { header: 'Tên gốc (originalTitle)', key: 'originalTitle', width: 28 },
    { header: 'Đạo diễn (director)', key: 'director', width: 22 },
    { header: 'Thời lượng (phút)', key: 'duration', width: 18 },
    { header: 'Độ tuổi (ageRating)', key: 'ageRating', width: 20 },
    { header: 'Trạng thái (showingStatus)', key: 'showingStatus', width: 28 },
    { header: 'Ngày khởi chiếu (releaseDate)', key: 'releaseDate', width: 22 },
    { header: 'Thể loại (genreNames)', key: 'genreNames', width: 30 },
    { header: 'Ngôn ngữ (language)', key: 'language', width: 18 },
    { header: 'Nổi bật (isFeatured)', key: 'isFeatured', width: 18 },
    { header: 'Poster URL', key: 'posterUrl', width: 35 },
    { header: 'Trailer URL', key: 'trailerYoutubeUrl', width: 35 },
    { header: 'Tóm tắt nội dung (synopsis)', key: 'synopsis', width: 45 }
  ];

  applyHeaderStyle(ws.getRow(1));

  movies.forEach((m, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      title: m.title || '',
      originalTitle: m.originalTitle || '',
      director: m.director || '',
      duration: m.duration || m.durationMinutes || 120,
      ageRating: m.ageRating || 'P',
      showingStatus: m.showingStatus || 'NOW_SHOWING',
      releaseDate: m.releaseDate ? String(m.releaseDate).substring(0, 10) : '',
      genreNames: Array.isArray(m.genres) ? m.genres.map(g => g.name || g).join(', ') : (m.genre || ''),
      language: m.language || 'Tiếng Việt',
      isFeatured: m.isFeatured ? 'CÓ' : 'KHÔNG',
      posterUrl: m.posterUrl || '',
      trailerYoutubeUrl: m.trailerYoutubeUrl || '',
      synopsis: (m.synopsis || '').replace(/\n/g, ' ')
    });
    applyRowBorder(row);
  });

  // Áp dụng Data Validation (Dropdown / ComboBox) cho cột Độ tuổi, Trạng thái, Nổi bật (cho 200 dòng tiếp theo)
  const maxRow = Math.max(movies.length + 100, 200);
  for (let r = 2; r <= maxRow; r++) {
    // Độ tuổi: P, K, T13, T16, T18, C
    ws.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"P,K,T13,T16,T18,C"'],
      showErrorMessage: true,
      errorTitle: 'Giá trị độ tuổi không đúng',
      error: 'Vui lòng chọn từ danh sách: P (Mọi lứa tuổi), K (Dưới 13 có phụ huynh), T13, T16, T18, C (Cấm)'
    };

    // Trạng thái: NOW_SHOWING, COMING_SOON, END_SHOWING
    ws.getCell('G' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"NOW_SHOWING,COMING_SOON,END_SHOWING"'],
      showErrorMessage: true,
      errorTitle: 'Giá trị trạng thái không hợp lệ',
      error: 'Vui lòng chọn từ dropdown: NOW_SHOWING (Đang chiếu), COMING_SOON (Sắp chiếu), END_SHOWING (Ngừng chiếu)'
    };

    // Phim nổi bật: CÓ, KHÔNG
    ws.getCell('K' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"CÓ,KHÔNG"']
    };
  }

  await saveWorkbook(workbook, 'danh_sach_phim_cgv.xlsx');
}

// ─── 2. EXPORT SHOWTIMES (LỊCH CHIẾU) ───
export async function exportShowtimesToExcel(showtimes = []) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Lịch Chiếu Phim');

  ws.columns = [
    { header: 'STT', key: 'stt', width: 7 },
    { header: 'Tên phim (movieTitle)', key: 'movieTitle', width: 34 },
    { header: 'Cụm rạp (cinemaName)', key: 'cinemaName', width: 28 },
    { header: 'Phòng chiếu (roomName)', key: 'roomName', width: 22 },
    { header: 'Ngày chiếu (showDate)', key: 'showDate', width: 20 },
    { header: 'Giờ bắt đầu (startTime)', key: 'startTime', width: 18 },
    { header: 'Giờ kết thúc (endTime)', key: 'endTime', width: 18 },
    { header: 'Giá vé gốc (basePrice)', key: 'basePrice', width: 18 },
    { header: 'Trạng thái (status)', key: 'status', width: 22 },
    { header: 'Định dạng (viewingMode)', key: 'viewingMode', width: 18 },
    { header: 'Ngôn ngữ', key: 'language', width: 22 },
    { header: 'Mã Suất Chiếu (ID)', key: 'id', width: 38 }
  ];

  applyHeaderStyle(ws.getRow(1));

  showtimes.forEach((s, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      movieTitle: s.movieTitle || '',
      cinemaName: s.cinemaName || '',
      roomName: s.roomName || '',
      showDate: s.date || s.showDate || '',
      startTime: s.startTime || '',
      endTime: s.endTime || '',
      basePrice: Number(s.basePrice || 110000),
      status: s.status || 'SCHEDULED',
      viewingMode: s.viewingMode || s.format || '2D',
      language: s.language || 'Phụ đề Tiếng Việt',
      id: s.id || ''
    });
    applyRowBorder(row);
  });

  const maxRow = Math.max(showtimes.length + 100, 200);
  for (let r = 2; r <= maxRow; r++) {
    // Trạng thái lịch chiếu: SCHEDULED, OPEN, CLOSED, CANCELLED
    ws.getCell('I' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"SCHEDULED,OPEN,CLOSED,CANCELLED"'],
      showErrorMessage: true,
      errorTitle: 'Trạng thái lịch chiếu không đúng',
      error: 'Vui lòng chọn từ dropdown: SCHEDULED, OPEN, CLOSED, CANCELLED'
    };

    // Định dạng: 2D, 3D, IMAX, 4DX, SCREENX
    ws.getCell('J' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"2D,3D,IMAX,4DX,SCREENX"']
    };
  }

  await saveWorkbook(workbook, 'danh_sach_lich_chieu_cgv.xlsx');
}

// ─── 3. EXPORT PROMOTIONS (VOUCHER & KHUYẾN MÃI) ───
export async function exportPromotionsToExcel(promotions = []) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Voucher CGV');

  ws.columns = [
    { header: 'STT', key: 'stt', width: 7 },
    { header: 'Mã Voucher (code)', key: 'code', width: 20 },
    { header: 'Tên khuyến mãi (name)', key: 'name', width: 32 },
    { header: 'Hình thức giảm (discountType)', key: 'discountType', width: 22 },
    { header: 'Giá trị giảm (discountValue)', key: 'discountValue', width: 18 },
    { header: 'Đơn tối thiểu (minOrderValue)', key: 'minOrderValue', width: 20 },
    { header: 'Hạng áp dụng (applicableTier)', key: 'applicableTier', width: 20 },
    { header: 'Số lượng phát hành (usageLimit)', key: 'usageLimit', width: 22 },
    { header: 'Hiệu lực từ (validFrom)', key: 'validFrom', width: 20 },
    { header: 'Hiệu lực đến (validTo)', key: 'validTo', width: 20 },
    { header: 'Trạng thái (status)', key: 'status', width: 18 },
    { header: 'Mô tả (description)', key: 'description', width: 35 }
  ];

  applyHeaderStyle(ws.getRow(1));

  promotions.forEach((p, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      code: p.code || '',
      name: p.name || '',
      discountType: p.discountType || 'FIXED',
      discountValue: p.discountValue || 0,
      minOrderValue: p.minOrderValue || 0,
      applicableTier: p.applicableTier || 'ALL',
      usageLimit: p.usageLimit || 1000,
      validFrom: p.validFrom ? String(p.validFrom).substring(0, 10) : '',
      validTo: p.validTo ? String(p.validTo).substring(0, 10) : '',
      status: p.isActive !== false ? 'KÍCH HOẠT' : 'TẠM KHÓA',
      description: p.description || ''
    });
    applyRowBorder(row);
  });

  const maxRow = Math.max(promotions.length + 100, 200);
  for (let r = 2; r <= maxRow; r++) {
    // Hình thức giảm: FIXED, PERCENT
    ws.getCell('D' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"FIXED,PERCENT"'],
      showErrorMessage: true,
      errorTitle: 'Hình thức giảm không đúng',
      error: 'Vui lòng chọn: FIXED (Số tiền) hoặc PERCENT (Phần trăm %)'
    };

    // Hạng áp dụng: ALL, MEMBER, VIP, VVIP
    ws.getCell('G' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"ALL,MEMBER,VIP,VVIP"']
    };

    // Trạng thái: KÍCH HOẠT, TẠM KHÓA
    ws.getCell('K' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"KÍCH HOẠT,TẠM KHÓA"']
    };
  }

  await saveWorkbook(workbook, 'danh_sach_khuyen_mai_cgv.xlsx');
}

// ─── 4. EXPORT USERS (NGƯỜI DÙNG) ───
export async function exportUsersToExcel(users = []) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Danh Sách Người Dùng');

  ws.columns = [
    { header: 'STT', key: 'stt', width: 7 },
    { header: 'Họ và tên', key: 'fullName', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Số điện thoại', key: 'phone', width: 18 },
    { header: 'Vai trò (Role)', key: 'role', width: 20 },
    { header: 'Hạng thành viên', key: 'membershipTier', width: 20 },
    { header: 'Điểm tích lũy', key: 'loyaltyPoints', width: 16 },
    { header: 'Ngày tham gia', key: 'createdAt', width: 20 },
    { header: 'Trạng thái', key: 'status', width: 18 }
  ];

  applyHeaderStyle(ws.getRow(1));

  users.forEach((u, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'USER',
      membershipTier: u.membershipTier || 'MEMBER',
      loyaltyPoints: u.loyaltyPoints || 0,
      createdAt: u.createdAt ? String(u.createdAt).substring(0, 10) : '',
      status: u.status || 'ACTIVE'
    });
    applyRowBorder(row);
  });

  const maxRow = Math.max(users.length + 50, 100);
  for (let r = 2; r <= maxRow; r++) {
    ws.getCell('E' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"USER,ADMIN,CINEMA_MANAGER,TICKET_STAFF"']
    };
    ws.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"MEMBER,VIP,VVIP"']
    };
    ws.getCell('I' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"ACTIVE,LOCKED,INACTIVE"']
    };
  }

  await saveWorkbook(workbook, 'danh_sach_nguoi_dung_cgv.xlsx');
}

// ─── 5. EXPORT BOOKINGS (ĐƠN ĐẶT VÉ) ───
export async function exportBookingsToExcel(bookings = []) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Đơn Đặt Vé');

  ws.columns = [
    { header: 'STT', key: 'stt', width: 7 },
    { header: 'Mã đơn vé (Booking ID)', key: 'id', width: 38 },
    { header: 'Khách hàng', key: 'userName', width: 24 },
    { header: 'Số điện thoại', key: 'userPhone', width: 18 },
    { header: 'Email', key: 'userEmail', width: 28 },
    { header: 'Phim', key: 'movieTitle', width: 30 },
    { header: 'Cụm rạp', key: 'cinemaName', width: 26 },
    { header: 'Phòng', key: 'roomName', width: 18 },
    { header: 'Suất chiếu', key: 'showtimeStart', width: 22 },
    { header: 'Danh sách ghế', key: 'seats', width: 22 },
    { header: 'Tổng tiền (VNĐ)', key: 'totalAmount', width: 18 },
    { header: 'Trạng thái vé', key: 'status', width: 24 }
  ];

  applyHeaderStyle(ws.getRow(1));

  bookings.forEach((b, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      id: b.id || '',
      userName: b.userName || b.guestName || '',
      userPhone: b.userPhone || b.guestPhone || '',
      userEmail: b.userEmail || b.guestEmail || '',
      movieTitle: b.movieTitle || '',
      cinemaName: b.cinemaName || '',
      roomName: b.roomName || '',
      showtimeStart: b.showtimeStart || '',
      seats: Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || ''),
      totalAmount: b.totalAmount || 0,
      status: b.checkinStatus === 'CHECKED_IN' ? 'ĐÃ QUA CỬA (USED)' : (b.status === 'PAID' || b.status === 'CONFIRMED' ? 'ĐÃ THANH TOÁN' : b.status)
    });
    applyRowBorder(row);
  });

  await saveWorkbook(workbook, 'danh_sach_dat_ve_cgv.xlsx');
}

// ─── 6. EXPORT SEATS (SƠ ĐỒ GHẾ) ───
export async function exportSeatsToExcel(seats = [], roomName = '') {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Sơ Đồ Ghế');

  ws.columns = [
    { header: 'STT', key: 'stt', width: 7 },
    { header: 'Hàng ghế', key: 'rowLabel', width: 14 },
    { header: 'Số cột', key: 'columnNumber', width: 14 },
    { header: 'Mã ghế', key: 'label', width: 16 },
    { header: 'Loại ghế', key: 'seatType', width: 20 },
    { header: 'Trạng thái', key: 'status', width: 18 }
  ];

  applyHeaderStyle(ws.getRow(1));

  seats.forEach((s, idx) => {
    const row = ws.addRow({
      stt: idx + 1,
      rowLabel: s.rowLabel || s.row || '',
      columnNumber: s.columnNumber || s.column || '',
      label: s.label || `${s.rowLabel}${s.columnNumber}`,
      seatType: s.seatType || 'NORMAL',
      status: s.status || 'ACTIVE'
    });
    applyRowBorder(row);
  });

  const maxRow = Math.max(seats.length + 50, 100);
  for (let r = 2; r <= maxRow; r++) {
    ws.getCell('E' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"NORMAL,VIP,SWEETBOX,COUPLE"']
    };
    ws.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"ACTIVE,MAINTENANCE,LOCKED"']
    };
  }

  const safeRoom = (roomName || 'phong').replace(/\s+/g, '_').toLowerCase();
  await saveWorkbook(workbook, `so_do_ghe_${safeRoom}.xlsx`);
}

// ─── 7. TEMPLATE DOWNLOAD HELPERS (FILE MẪU IMPORT CÓ DROPDOWN) ───
export async function downloadMovieImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Mau_Import_Phim');

  ws.columns = [
    { header: 'Tiêu đề phim (title)', key: 'title', width: 34 },
    { header: 'Tên gốc (originalTitle)', key: 'originalTitle', width: 28 },
    { header: 'Đạo diễn (director)', key: 'director', width: 22 },
    { header: 'Thời lượng (phút)', key: 'duration', width: 18 },
    { header: 'Độ tuổi (ageRating)', key: 'ageRating', width: 20 },
    { header: 'Trạng thái (showingStatus)', key: 'showingStatus', width: 28 },
    { header: 'Ngày khởi chiếu (releaseDate)', key: 'releaseDate', width: 24 },
    { header: 'Thể loại (genreNames)', key: 'genreNames', width: 30 },
    { header: 'Ngôn ngữ (language)', key: 'language', width: 18 },
    { header: 'Nổi bật (isFeatured)', key: 'isFeatured', width: 18 },
    { header: 'Poster URL', key: 'posterUrl', width: 35 },
    { header: 'Trailer URL', key: 'trailerYoutubeUrl', width: 35 },
    { header: 'Tóm tắt nội dung (synopsis)', key: 'synopsis', width: 45 },
    { header: 'Diễn viên (cast_names)', key: 'cast_names', width: 30 },
    { header: 'Vai trò (cast_roles)', key: 'cast_roles', width: 20 }
  ];

  applyHeaderStyle(ws.getRow(1));

  // Mẫu 2 dòng phim demo
  const sample1 = ws.addRow({
    title: 'Thế Giới Khủng Long: Tái Sinh',
    originalTitle: 'Jurassic World Rebirth',
    director: 'Gareth Edwards',
    duration: 148,
    ageRating: 'T13',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2026-07-04',
    genreNames: 'Hành động, Phiêu lưu, Khoa học viễn tưởng',
    language: 'Tiếng Việt',
    isFeatured: 'CÓ',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
    trailerYoutubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    synopsis: 'Hành trình sinh tồn qua những vùng đất hoang sơ kỳ bí.',
    cast_names: 'Scarlett Johansson;Jonathan Bailey',
    cast_roles: 'ACTRESS;ACTOR'
  });
  applyRowBorder(sample1);

  const sample2 = ws.addRow({
    title: 'Biệt Đội Cảm Tử 4',
    originalTitle: 'The Expendables 4',
    director: 'Scott Waugh',
    duration: 103,
    ageRating: 'T18',
    showingStatus: 'COMING_SOON',
    releaseDate: '2026-08-15',
    genreNames: 'Hành động',
    language: 'Tiếng Anh',
    isFeatured: 'KHÔNG',
    posterUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400',
    trailerYoutubeUrl: '',
    synopsis: 'Đội biệt kích kỳ cựu tái xuất trong nhiệm vụ sinh tử.',
    cast_names: 'Sylvester Stallone;Jason Statham',
    cast_roles: 'ACTOR;ACTOR'
  });
  applyRowBorder(sample2);

  // Cấu hình Data Validation Dropdown cho 500 dòng
  for (let r = 2; r <= 500; r++) {
    ws.getCell('E' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"P,K,T13,T16,T18,C"'],
      showErrorMessage: true,
      errorTitle: 'Độ tuổi sai định dạng',
      error: 'Vui lòng chọn từ danh sách: P, K, T13, T16, T18, C'
    };
    ws.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"NOW_SHOWING,COMING_SOON,END_SHOWING"'],
      showErrorMessage: true,
      errorTitle: 'Trạng thái sai định dạng',
      error: 'Vui lòng chọn: NOW_SHOWING (Đang chiếu), COMING_SOON (Sắp chiếu), END_SHOWING (Ngừng chiếu)'
    };
    ws.getCell('J' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"CÓ,KHÔNG"']
    };
  }

  await saveWorkbook(workbook, 'mau_import_phim_cgv.xlsx');
}

export async function downloadShowtimeImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Mau_Lich_Chieu');

  ws.columns = [
    { header: 'Tên phim (movieTitle)', key: 'movieTitle', width: 34 },
    { header: 'Cụm rạp (cinemaName)', key: 'cinemaName', width: 28 },
    { header: 'Phòng chiếu (roomName)', key: 'roomName', width: 22 },
    { header: 'Ngày chiếu (showDate)', key: 'showDate', width: 22 },
    { header: 'Giờ bắt đầu (startTime)', key: 'startTime', width: 18 },
    { header: 'Giờ kết thúc (endTime)', key: 'endTime', width: 18 },
    { header: 'Giá vé gốc (basePrice)', key: 'basePrice', width: 20 },
    { header: 'Định dạng (viewingMode)', key: 'viewingMode', width: 18 }
  ];

  applyHeaderStyle(ws.getRow(1));

  const sampleRows = [
    { movieTitle: 'Avatar: Dòng Chảy Của Nước', cinemaName: 'CGV Vincom Landmark 81', roomName: 'Cinema 1 (Laser)', showDate: '2026-09-25', startTime: '18:00', endTime: '21:15', totalPrice: 110000, viewingMode: '2D' },
    { movieTitle: 'Kung Fu Panda 4', cinemaName: 'CGV Vincom Landmark 81', roomName: 'Cinema 2 (IMAX)', showDate: '2026-09-25', startTime: '19:30', endTime: '21:15', totalPrice: 140000, viewingMode: 'IMAX' },
    { movieTitle: 'Thế Giới Khủng Long: Tái Sinh', cinemaName: 'CGV Vincom Đồng Khởi', roomName: 'Cinema 1 (Laser)', showDate: '2026-09-25', startTime: '20:00', endTime: '22:30', totalPrice: 120000, viewingMode: '3D' }
  ];

  sampleRows.forEach(s => {
    const row = ws.addRow(s);
    applyRowBorder(row);
  });

  for (let r = 2; r <= 500; r++) {
    ws.getCell('H' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"2D,3D,IMAX,4DX,SCREENX"']
    };
  }

  await saveWorkbook(workbook, 'cgv_showtimes_template.xlsx');
}

export async function downloadVoucherImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Mau_Voucher');

  ws.columns = [
    { header: 'Mã Voucher (code)', key: 'code', width: 22 },
    { header: 'Tên khuyến mãi (name)', key: 'name', width: 32 },
    { header: 'Hình thức giảm (discountType)', key: 'discountType', width: 22 },
    { header: 'Giá trị giảm (discountValue)', key: 'discountValue', width: 18 },
    { header: 'Đơn tối thiểu (minOrderValue)', key: 'minOrderValue', width: 20 },
    { header: 'Hạng áp dụng (applicableTier)', key: 'applicableTier', width: 20 },
    { header: 'Số lượng phát hành (usageLimit)', key: 'usageLimit', width: 22 },
    { header: 'Hiệu lực từ (validFrom)', key: 'validFrom', width: 20 },
    { header: 'Hiệu lực đến (validTo)', key: 'validTo', width: 20 }
  ];

  applyHeaderStyle(ws.getRow(1));

  const samples = [
    { code: 'CGVFLASH50K', name: 'Voucher Flash Sale 50K', discountType: 'FIXED', discountValue: 50000, minOrderValue: 150000, applicableTier: 'MEMBER', usageLimit: 5000, validFrom: '2026-09-24', validTo: '2026-10-31' },
    { code: 'CGVIP30PCT', name: 'Giảm 30% VIP Weekend', discountType: 'PERCENT', discountValue: 30, minOrderValue: 200000, applicableTier: 'VIP', usageLimit: 1000, validFrom: '2026-09-24', validTo: '2026-12-31' },
    { code: 'CGVVVIP100K', name: 'Tri Ân VVIP Bạch Kim', discountType: 'FIXED', discountValue: 100000, minOrderValue: 250000, applicableTier: 'VVIP', usageLimit: 500, validFrom: '2026-09-24', validTo: '2026-12-31' }
  ];

  samples.forEach(s => {
    const row = ws.addRow(s);
    applyRowBorder(row);
  });

  for (let r = 2; r <= 500; r++) {
    ws.getCell('C' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"FIXED,PERCENT"'],
      showErrorMessage: true,
      errorTitle: 'Hình thức giảm không đúng',
      error: 'Vui lòng chọn: FIXED (Số tiền) hoặc PERCENT (Phần trăm)'
    };
    ws.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"ALL,MEMBER,VIP,VVIP"']
    };
  }

  await saveWorkbook(workbook, 'cgv_vouchers_template.xlsx');
}

// ─── 8. GENERATE LARGE TEST FILE (TẠO FILE TEST LỚN 1.000 / 5.000 DÒNG) ───
export async function generateLargeMovieTestFile(count = 1000) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(`Test_${count}_Phim`);

  ws.columns = [
    { header: 'Tiêu đề phim (title)', key: 'title', width: 34 },
    { header: 'Tên gốc (originalTitle)', key: 'originalTitle', width: 28 },
    { header: 'Đạo diễn (director)', key: 'director', width: 22 },
    { header: 'Thời lượng (phút)', key: 'duration', width: 18 },
    { header: 'Độ tuổi (ageRating)', key: 'ageRating', width: 20 },
    { header: 'Trạng thái (showingStatus)', key: 'showingStatus', width: 28 },
    { header: 'Ngày khởi chiếu (releaseDate)', key: 'releaseDate', width: 24 },
    { header: 'Thể loại (genreNames)', key: 'genreNames', width: 30 },
    { header: 'Ngôn ngữ (language)', key: 'language', width: 18 },
    { header: 'Nổi bật (isFeatured)', key: 'isFeatured', width: 18 },
    { header: 'Poster URL', key: 'posterUrl', width: 35 },
    { header: 'Trailer URL', key: 'trailerYoutubeUrl', width: 35 },
    { header: 'Tóm tắt nội dung (synopsis)', key: 'synopsis', width: 45 }
  ];

  applyHeaderStyle(ws.getRow(1));

  const genresPool = ['Hành Động', 'Phiêu Lưu', 'Hài Hước', 'Kinh Dị', 'Tình Cảm', 'Hoạt Hình', 'Khoa Học Viễn Tưởng'];
  const agePool = ['P', 'K', 'T13', 'T16', 'T18'];
  const statusPool = ['NOW_SHOWING', 'COMING_SOON', 'END_SHOWING'];

  for (let i = 1; i <= count; i++) {
    // Tạo cố ý 3 dòng lỗi để test bộ lọc lỗi
    let title = `Chiến Binh Ngân Hà Tập ${i}`;
    let duration = 90 + (i % 60);

    if (i === 15) {
      title = ''; // Thiếu tiêu đề (lỗi test)
    } else if (i === 30) {
      duration = -10; // Sai thời lượng (lỗi test)
    } else if (i === 45) {
      title = 'Chiến Binh Ngân Hà Tập 1'; // Trùng lặp (lỗi test)
    }

    const row = ws.addRow({
      title,
      originalTitle: `Galaxy Warrior Part ${i}`,
      director: `Director ${((i % 15) + 1)}`,
      duration,
      ageRating: agePool[i % agePool.length],
      showingStatus: statusPool[i % statusPool.length],
      releaseDate: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
      genreNames: `${genresPool[i % genresPool.length]}, ${genresPool[(i + 1) % genresPool.length]}`,
      language: i % 4 === 0 ? 'Tiếng Anh' : 'Tiếng Việt',
      isFeatured: i % 5 === 0 ? 'CÓ' : 'KHÔNG',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
      trailerYoutubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      synopsis: `Tóm tắt nội dung kịch tính cho bộ phim giả lập số ${i}. Cuộc chiến vì hòa bình giữa các thiên hà vũ trụ.`
    });
    applyRowBorder(row);
  }

  // Cấu hình Data Validation Dropdown cho các dòng test
  const validationLimit = Math.min(count + 1, 1000);
  for (let r = 2; r <= validationLimit; r++) {
    ws.getCell('E' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"P,K,T13,T16,T18,C"']
    };
    ws.getCell('F' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"NOW_SHOWING,COMING_SOON,END_SHOWING"']
    };
    ws.getCell('J' + r).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"CÓ,KHÔNG"']
    };
  }

  await saveWorkbook(workbook, `file_test_${count}_phim_cgv.xlsx`);
}

