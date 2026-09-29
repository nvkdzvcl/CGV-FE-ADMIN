// Dữ liệu Hành chính Việt Nam chuẩn cho CGV Cinema Admin
// Bao gồm đầy đủ 22 Quận / Huyện / TP của TP. Hồ Chí Minh và các tỉnh thành lớn
// Hỗ trợ chọn theo phân cấp (Tỉnh -> Quận -> Phường) HOẶC chọn trực tiếp Phường / Xã

export const VN_PROVINCES = [
  {
    name: 'TP. Hồ Chí Minh',
    lat: 10.77613,
    lng: 106.70098,
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Cầu Kho', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão']
      },
      {
        name: 'Quận 3',
        wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14']
      },
      {
        name: 'Quận 4',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18']
      },
      {
        name: 'Quận 5',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14']
      },
      {
        name: 'Quận 6',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14']
      },
      {
        name: 'Quận 7',
        wards: ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Tân Quy', 'Phường Tân Kiểng', 'Phường Tân Hưng', 'Phường Phú Mỹ', 'Phường Phú Thuận', 'Phường Bình Thuận', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây']
      },
      {
        name: 'Quận 8',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16']
      },
      {
        name: 'Quận 10',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Quận 11',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16']
      },
      {
        name: 'Quận 12',
        wards: ['Phường Thạnh Xuân', 'Phường Thạnh Lộc', 'Phường Hiệp Thành', 'Phường Thới An', 'Phường Tân Chánh Hiệp', 'Phường An Phú Đông', 'Phường Tân Thới Hiệp', 'Phường Trung Mỹ Tây', 'Phường Tân Hưng Thuận', 'Phường Đông Hưng Thuận', 'Phường Tân Thới Nhất']
      },
      {
        name: 'TP. Thủ Đức',
        wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường An Khánh', 'Phường Bình An', 'Phường Thủ Thiêm', 'Phường An Lợi Đông', 'Phường Cát Lái', 'Phường Thạnh Mỹ Lợi', 'Phường Hiệp Phú', 'Phường Tăng Nhơn Phú A', 'Phường Tăng Nhơn Phú B', 'Phường Phước Long A', 'Phường Phước Long B', 'Phường Linh Chiểu', 'Phường Linh Trung', 'Phường Linh Tây', 'Phường Linh Đông', 'Phường Linh Xuân', 'Phường Bình Chiểu', 'Phường Tam Bình', 'Phường Tam Phú', 'Phường Hiệp Bình Chánh', 'Phường Hiệp Bình Phước']
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28']
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17']
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17']
      },
      {
        name: 'Quận Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Quận Tân Phú',
        wards: ['Phường Tân Sơn Nhì', 'Phường Tây Thạnh', 'Phường Sơn Kỳ', 'Phường Tân Quý', 'Phường Tân Thành', 'Phường Phú Thọ Hòa', 'Phường Phú Thạnh', 'Phường Phú Trung', 'Phường Hòa Thạnh', 'Phường Hiệp Tân', 'Phường Tân Thới Hòa']
      },
      {
        name: 'Quận Bình Tân',
        wards: ['Phường Bình Hưng Hòa', 'Phường Bình Hưng Hòa A', 'Phường Bình Hưng Hòa B', 'Phường Bình Trị Đông', 'Phường Bình Trị Đông A', 'Phường Bình Trị Đông B', 'Phường Tân Tạo', 'Phường Tân Tạo A', 'Phường An Lạc', 'Phường An Lạc A']
      },
      {
        name: 'Huyện Bình Chánh',
        wards: ['Thị trấn Tân Túc', 'Xã An Phú Tây', 'Xã Bình Chánh', 'Xã Bình Hưng', 'Xã Bình Lợi', 'Xã Đa Phước', 'Xã Hưng Long', 'Xã Lê Minh Xuân', 'Xã Phạm Văn Hai', 'Xã Phong Phú', 'Xã Quy Đức', 'Xã Tân Kiên', 'Xã Tân Nhựt', 'Xã Tân Quý Tây', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B']
      },
      {
        name: 'Huyện Hóc Môn',
        wards: ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Hiệp', 'Xã Tân Thới Nhì', 'Xã Tân Xuân', 'Xã Thới Tam Thôn', 'Xã Trung Chánh', 'Xã Xuân Thới Đông', 'Xã Xuân Thới Sơn', 'Xã Xuân Thới Thượng']
      },
      {
        name: 'Huyện Củ Chi',
        wards: ['Thị trấn Củ Chi', 'Xã An Nhơn Tây', 'Xã An Phú', 'Xã Bình Mỹ', 'Xã Hòa Phú', 'Xã Nhuận Đức', 'Xã Phạm Văn Cội', 'Xã Phú Hòa Đông', 'Xã Phú Mỹ Hưng', 'Xã Tân An Hội', 'Xã Tân Phú Trung', 'Xã Tân Thạnh Đông', 'Xã Tân Thạnh Tây', 'Xã Tân Thông Hội', 'Xã Thái Mỹ', 'Xã Trung An', 'Xã Trung Lập Hạ', 'Xã Trung Lập Thượng']
      },
      {
        name: 'Huyện Nhà Bè',
        wards: ['Thị trấn Nhà Bè', 'Xã Hiệp Phước', 'Xã Long Thới', 'Xã Nhơn Đức', 'Xã Phú Xuân', 'Xã Phước Kiển', 'Xã Phước Lộc']
      },
      {
        name: 'Huyện Cần Giờ',
        wards: ['Thị trấn Cần Thạnh', 'Xã An Thới Đông', 'Xã Bình Khánh', 'Xã Long Hòa', 'Xã Lý Nhơn', 'Xã Tam Thôn Hiệp', 'Xã Thạnh An']
      }
    ]
  },
  {
    name: 'Hà Nội',
    lat: 21.02851,
    lng: 105.85416,
    districts: [
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Hàng Trống', 'Phường Tràng Tiền', 'Phường Phan Chu Trinh', 'Phường Lý Thái Tổ', 'Phường Hàng Bài', 'Phường Hàng Gai', 'Phường Đồng Xuân', 'Phường Cửa Đông']
      },
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Trúc Bạch', 'Phường Quán Thánh']
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Ô Chợ Dừa', 'Phường Quốc Tử Giám', 'Phường Trung Tự', 'Phường Kim Liên', 'Phường Phương Mai']
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa']
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bách Khoa', 'Phường Bạch Đằng', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Phố Huế', 'Phường Trương Định', 'Phường Vĩnh Tuy']
      },
      {
        name: 'Quận Nam Từ Liêm',
        wards: ['Phường Mễ Trì', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Cầu Diễn', 'Phường Tây Mỗ', 'Phường Đại Mỗ', 'Phường Phú Đô']
      },
      {
        name: 'Quận Bắc Từ Liêm',
        wards: ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Xuân Đỉnh', 'Phường Phúc Diễn', 'Phường Minh Khai']
      },
      {
        name: 'Quận Tây Hồ',
        wards: ['Phường Bưởi', 'Phường Nhật Tân', 'Phường Quảng An', 'Phường Thụy Khuê', 'Phường Tứ Liên', 'Phường Xuân La', 'Phường Yên Phụ']
      },
      {
        name: 'Quận Thanh Xuân',
        wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Nhân Chính', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Trung']
      },
      {
        name: 'Quận Long Biên',
        wards: ['Phường Bồ Đề', 'Phường Gia Thụy', 'Phường Ngọc Lâm', 'Phường Sài Đồng', 'Phường Phúc Đồng', 'Phường Thượng Thanh']
      },
      {
        name: 'Quận Hà Đông',
        wards: ['Phường Mộ Lao', 'Phường Văn Quán', 'Phường Vạn Phúc', 'Phường Hà Cầu', 'Phường La Khê', 'Phường Quang Trung']
      }
    ]
  },
  {
    name: 'Đà Nẵng',
    lat: 16.0544,
    lng: 108.2022,
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Thuận Đông', 'Phường Nam Dương', 'Phường Bình Hiên']
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường An Khê', 'Phường Chính Gián', 'Phường Tam Thuận', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Vĩnh Trung']
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Phước Mỹ', 'Phường Nại Hiên Đông']
      },
      {
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Hòa Quý', 'Phường Hòa Hải']
      },
      {
        name: 'Quận Cẩm Lệ',
        wards: ['Phường Khuê Trung', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Hòa An', 'Phường Hòa Phát']
      },
      {
        name: 'Quận Liên Chiểu',
        wards: ['Phường Hòa Minh', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Hiệp Bắc']
      }
    ]
  },
  {
    name: 'Cần Thơ',
    lat: 10.0452,
    lng: 105.7469,
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường Tân An', 'Phường An Cư', 'Phường An Nghiệp', 'Phường An Hòa', 'Phường Cái Khế', 'Phường Xuân Khánh', 'Phường An Khánh']
      },
      {
        name: 'Quận Cái Răng',
        wards: ['Phường Lê Bình', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Ba Láng', 'Phường Phú Thứ']
      },
      {
        name: 'Quận Bình Thủy',
        wards: ['Phường Bình Thủy', 'Phường Trà An', 'Phường An Thới', 'Phường Bùi Hữu Nghĩa']
      }
    ]
  },
  {
    name: 'Hải Phòng',
    lat: 20.8449,
    lng: 106.6881,
    districts: [
      {
        name: 'Quận Lê Chân',
        wards: ['Phường An Biên', 'Phường An Dương', 'Phường Cát Dài', 'Phường Dư Hàng', 'Phường Kênh Dương', 'Phường Vĩnh Niệm']
      },
      {
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Cầu Tre', 'Phường Đằng Giang', 'Phường Đồng Quốc Bình', 'Phường Lạc Viên', 'Phường Lạch Tray']
      },
      {
        name: 'Quận Hồng Bàng',
        wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Quán Toan']
      }
    ]
  },
  {
    name: 'Bình Dương',
    lat: 10.9804,
    lng: 106.6519,
    districts: [
      {
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Hòa', 'Phường Phú Cường', 'Phường Phú Lợi', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa', 'Phường Định Hòa']
      },
      {
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Thuận Giao', 'Phường Bình Hòa', 'Phường Vĩnh Phú']
      },
      {
        name: 'TP. Dĩ An',
        wards: ['Phường Dĩ An', 'Phường Tân Đông Hiệp', 'Phường An Bình', 'Phường Đông Hòa']
      }
    ]
  },
  {
    name: 'Đồng Nai',
    lat: 10.9427,
    lng: 106.8243,
    districts: [
      {
        name: 'TP. Biên Hòa',
        wards: ['Phường Trung Dũng', 'Phường Quyết Thắng', 'Phường Thanh Bình', 'Phường Tân Tiến', 'Phường Thống Nhất', 'Phường Trảng Dài', 'Phường Tân Phong']
      },
      {
        name: 'TP. Long Khánh',
        wards: ['Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Trung', 'Phường Xuân Thanh']
      }
    ]
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    lat: 10.3460,
    lng: 107.0843,
    districts: [
      {
        name: 'TP. Vũng Tàu',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 7', 'Phường 8', 'Phường Thắng Nhì', 'Phường Thắng Tam', 'Phường Nguyễn An Ninh']
      },
      {
        name: 'TP. Bà Rịa',
        wards: ['Phường Phước Hưng', 'Phường Phước Hiệp', 'Phường Phước Nguyên', 'Phường Long Toàn']
      }
    ]
  },
  {
    name: 'Khánh Hòa',
    lat: 12.2388,
    lng: 109.1967,
    districts: [
      {
        name: 'TP. Nha Trang',
        wards: ['Phường Lộc Thọ', 'Phường Tân Lập', 'Phường Phước Tiến', 'Phường Vĩnh Nguyên', 'Phường Phương Sài', 'Phường Vạn Thắng']
      }
    ]
  },
  {
    name: 'Quảng Ninh',
    lat: 20.9599,
    lng: 107.0425,
    districts: [
      {
        name: 'TP. Hạ Long',
        wards: ['Phường Bãi Cháy', 'Phường Hồng Gai', 'Phường Cao Thắng', 'Phường Bạch Đằng', 'Phường Tuần Châu']
      }
    ]
  }
];

// Helper: Lấy danh sách tất cả phường/xã của một tỉnh/thành
export function getAllWardsOfProvince(provinceName) {
  const prov = VN_PROVINCES.find(p => p.name === provinceName);
  if (!prov) return [];
  const wards = [];
  prov.districts.forEach(d => {
    d.wards.forEach(w => {
      wards.push({
        ward: w,
        district: d.name,
        fullLabel: `${w} (${d.name})`
      });
    });
  });
  return wards;
}
