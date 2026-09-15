export const DASHBOARD_STATS = {
  revenueToday: 184500000,
  growthRevenue: '+14.8%',
  ticketsSoldToday: 1680,
  growthTickets: '+8.2%',
  activeShowtimes: 48,
  occupancyRate: '78.4%',
  growthOccupancy: '+5.1%',
  weeklyRevenue: [
    { day: 'T2', amount: 120, label: '120tr' },
    { day: 'T3', amount: 145, label: '145tr' },
    { day: 'T4 (Sale)', amount: 260, label: '260tr' },
    { day: 'T5', amount: 155, label: '155tr' },
    { day: 'T6', amount: 280, label: '280tr' },
    { day: 'T7', amount: 390, label: '390tr' },
    { day: 'CN', amount: 350, label: '350tr' }
  ]
};

export const INITIAL_MOVIES = [
  {
    id: 'mov-01',
    title: 'Thế Giới Khủng Long: Tái Sinh',
    originalTitle: 'Jurassic World Rebirth',
    director: 'Gareth Edwards',
    duration: 135,
    genre: 'Hành động, Viễn tưởng',
    ageRating: 'T16',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2025-07-04',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop',
    rating: 8.8,
    revenue: 1420000000
  },
  {
    id: 'mov-02',
    title: 'Dế Mèn: Cuộc Phiêu Lưu Tới Xóm Lầy Lội',
    originalTitle: 'Men Cricket Adventures',
    director: 'Nguyễn Đăng Quang',
    duration: 95,
    genre: 'Hoạt hình, Phiêu lưu',
    ageRating: 'P',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2025-07-10',
    posterUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&auto=format&fit=crop',
    rating: 8.5,
    revenue: 890000000
  },
  {
    id: 'mov-03',
    title: 'Bảy Ngày Bên Nhau',
    originalTitle: 'Seven Days Together',
    director: 'Vũ Ngọc Đãng',
    duration: 108,
    genre: 'Tình cảm, Hài hước',
    ageRating: 'T13',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2025-07-15',
    posterUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=400&auto=format&fit=crop',
    rating: 7.8,
    revenue: 620000000
  },
  {
    id: 'mov-04',
    title: 'Ma Da',
    originalTitle: 'Ma Da: River Ghost',
    director: 'Nguyễn Hữu Hoàng',
    duration: 112,
    genre: 'Kinh dị, Bí ẩn',
    ageRating: 'T18',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2025-07-16',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop',
    rating: 6.9,
    revenue: 540000000
  },
  {
    id: 'mov-05',
    title: 'Mission: Impossible — Nghiệp Báo Cuối Cùng',
    originalTitle: 'Mission: Impossible The Final Reckoning',
    director: 'Christopher McQuarrie',
    duration: 169,
    genre: 'Hành động, Giật gân',
    ageRating: 'T16',
    showingStatus: 'NOW_SHOWING',
    releaseDate: '2025-05-23',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop',
    rating: 8.9,
    revenue: 1850000000
  },
  {
    id: 'mov-06',
    title: 'Siêu Nhân Trở Lại',
    originalTitle: 'Superman (2025)',
    director: 'James Gunn',
    duration: 130,
    genre: 'Hành động, Viễn tưởng',
    ageRating: 'T13',
    showingStatus: 'COMING_SOON',
    releaseDate: '2025-07-25',
    posterUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop',
    rating: 9.0,
    revenue: 0
  }
];

export const INITIAL_CINEMAS = [
  {
    id: 'cin-01',
    name: 'CGV Landmark 81',
    region: 'TP. Hồ Chí Minh',
    address: 'Vincom Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh',
    roomCount: 8,
    status: 'ACTIVE',
    rooms: [
      { id: 'rm-101', name: 'Cinema 1 (IMAX Laser)', format: 'IMAX', seatCapacity: 240 },
      { id: 'rm-102', name: 'Cinema 2 (4DX Atmos)', format: '4DX', seatCapacity: 160 },
      { id: 'rm-103', name: 'Cinema 3 (Standard 2D)', format: '2D', seatCapacity: 120 },
      { id: 'rm-104', name: 'Cinema 4 (Sweetbox Hall)', format: '2D', seatCapacity: 80 }
    ]
  },
  {
    id: 'cin-02',
    name: 'CGV Vincom Đồng Khởi',
    region: 'TP. Hồ Chí Minh',
    address: '72 Lê Thánh Tôn, Bến Nghé, Quận 1',
    roomCount: 6,
    status: 'ACTIVE',
    rooms: [
      { id: 'rm-201', name: 'Cinema 1 (Standard 2D)', format: '2D', seatCapacity: 140 },
      { id: 'rm-202', name: 'Cinema 2 (IMAX Hall)', format: 'IMAX', seatCapacity: 220 }
    ]
  },
  {
    id: 'cin-03',
    name: 'CGV Giga Mall',
    region: 'TP. Hồ Chí Minh',
    address: '240-242 Phạm Văn Đồng, Hiệp Bình Chánh, TP. Thủ Đức',
    roomCount: 7,
    status: 'ACTIVE',
    rooms: [
      { id: 'rm-301', name: 'Cinema 1 (Standard 2D)', format: '2D', seatCapacity: 150 },
      { id: 'rm-302', name: 'Cinema 2 (4DX Hall)', format: '4DX', seatCapacity: 130 }
    ]
  }
];

export const INITIAL_SHOWTIMES = [
  {
    id: 'st-01',
    movieTitle: 'Thế Giới Khủng Long: Tái Sinh',
    cinemaName: 'CGV Landmark 81',
    roomName: 'Cinema 1 (IMAX Laser)',
    date: '2026-09-15',
    startTime: '09:15',
    endTime: '11:30',
    basePrice: 110000,
    status: 'COMPLETED'
  },
  {
    id: 'st-02',
    movieTitle: 'Thế Giới Khủng Long: Tái Sinh',
    cinemaName: 'CGV Landmark 81',
    roomName: 'Cinema 1 (IMAX Laser)',
    date: '2026-09-15',
    startTime: '14:20',
    endTime: '16:35',
    basePrice: 130000,
    status: 'ACTIVE'
  },
  {
    id: 'st-03',
    movieTitle: 'Mission: Impossible — Nghiệp Báo Cuối Cùng',
    cinemaName: 'CGV Vincom Đồng Khởi',
    roomName: 'Cinema 1 (Standard 2D)',
    date: '2026-09-15',
    startTime: '16:55',
    endTime: '19:44',
    basePrice: 95000,
    status: 'ACTIVE'
  },
  {
    id: 'st-04',
    movieTitle: 'Dế Mèn: Cuộc Phiêu Lưu Tới Xóm Lầy Lội',
    cinemaName: 'CGV Giga Mall',
    roomName: 'Cinema 1 (Standard 2D)',
    date: '2026-09-15',
    startTime: '19:30',
    endTime: '21:05',
    basePrice: 85000,
    status: 'UPCOMING'
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-894210',
    userEmail: 'hoang.nam@gmail.com',
    movieTitle: 'Thế Giới Khủng Long: Tái Sinh',
    cinemaName: 'CGV Landmark 81',
    roomName: 'Cinema 1 (IMAX)',
    seats: ['F5', 'F6'],
    totalAmount: 260000,
    status: 'PAID',
    checkinStatus: 'CHECKED_IN',
    createdAt: '2026-09-15 13:42'
  },
  {
    id: 'BK-772109',
    userEmail: 'nguyen.anh@gmail.com',
    movieTitle: 'Mission: Impossible',
    cinemaName: 'CGV Vincom Đồng Khởi',
    roomName: 'Cinema 1 (2D)',
    seats: ['D3', 'D4'],
    totalAmount: 190000,
    status: 'PAID',
    checkinStatus: 'UNCHECKED',
    createdAt: '2026-09-15 14:05'
  },
  {
    id: 'BK-619482',
    userEmail: 'minh.tri@outlook.com',
    movieTitle: 'Ma Da',
    cinemaName: 'CGV Giga Mall',
    roomName: 'Cinema 2 (2D)',
    seats: ['E7'],
    totalAmount: 85000,
    status: 'SEAT_RESERVED',
    checkinStatus: 'UNCHECKED',
    createdAt: '2026-09-15 14:18'
  }
];

export const INITIAL_RENTALS = [
  {
    id: 'rent-01',
    contactName: 'FPT Software Corp',
    phone: '0908 123 456',
    email: 'contact@fpt.com',
    cinemaName: 'CGV Landmark 81',
    serviceType: 'Thuê trọn phòng chiếu IMAX (Company Movie Day)',
    guestCount: 220,
    rentalDate: '2026-09-25',
    status: 'PENDING'
  },
  {
    id: 'rent-02',
    contactName: 'VinFast Marketing Team',
    phone: '0912 345 678',
    email: 'events@vinfast.vn',
    cinemaName: 'CGV Vincom Đồng Khởi',
    serviceType: 'Private Hall Screening',
    guestCount: 140,
    rentalDate: '2026-10-02',
    status: 'CONTACTED'
  }
];

export const INITIAL_PROMOTIONS = [
  {
    id: 'promo-01',
    code: 'CGWED55',
    discountType: 'FIXED',
    discountValue: 45000,
    minOrderValue: 100000,
    applicableTier: 'MEMBER',
    usageLimit: 50000,
    usageCount: 12450,
    validTo: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'promo-02',
    code: 'COMBO30',
    discountType: 'PERCENT',
    discountValue: 30,
    minOrderValue: 0,
    applicableTier: 'MEMBER',
    usageLimit: 20000,
    usageCount: 8940,
    validTo: '2026-10-31',
    status: 'ACTIVE'
  },
  {
    id: 'promo-03',
    code: 'MEM50K',
    discountType: 'FIXED',
    discountValue: 50000,
    minOrderValue: 180000,
    applicableTier: 'VIP',
    usageLimit: 10000,
    usageCount: 6420,
    validTo: '2026-12-31',
    status: 'ACTIVE'
  }
];

export const INITIAL_USERS = [
  {
    id: 'usr-01',
    fullName: 'Lê Hoàng Huy',
    email: 'admin.huy@cgv.vn',
    role: 'ADMIN',
    membershipTier: 'VVIP',
    loyaltyPoints: 99999,
    status: 'ACTIVE',
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-02',
    fullName: 'Nguyễn Văn Staff',
    email: 'staff.boxoffice@cgv.vn',
    role: 'STAFF',
    membershipTier: 'MEMBER',
    loyaltyPoints: 3400,
    status: 'ACTIVE',
    createdAt: '2026-02-15'
  },
  {
    id: 'usr-03',
    fullName: 'Trần Thị Thảo (VIP Customer)',
    email: 'thao.tran@gmail.com',
    role: 'USER',
    membershipTier: 'VIP',
    loyaltyPoints: 15800,
    status: 'ACTIVE',
    createdAt: '2026-04-20'
  }
];

export const INITIAL_PAYMENTS = [
  {
    id: 'pay-01',
    bookingId: 'BK-894210',
    provider: 'VNPAY',
    transactionId: 'VNPAY-20260915-894210',
    amount: 260000,
    status: 'SUCCESS',
    createdAt: '2026-09-15 13:43:10'
  },
  {
    id: 'pay-02',
    bookingId: 'BK-772109',
    provider: 'MOMO',
    transactionId: 'MOMO-20260915-772109',
    amount: 190000,
    status: 'SUCCESS',
    createdAt: '2026-09-15 14:06:22'
  },
  {
    id: 'pay-03',
    bookingId: 'BK-619482',
    provider: 'VNPAY',
    transactionId: 'VNPAY-20260915-619482',
    amount: 85000,
    status: 'PENDING',
    createdAt: '2026-09-15 14:18:05'
  }
];