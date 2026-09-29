import csv
import time

file_name = "cgv_1m_movies.csv"
total_rows = 1_000_000

print("Bắt đầu tạo 1 triệu dòng dữ liệu phim...")
start_time = time.time()

with open(file_name, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    # Ghi dòng Header (Tiêu đề cột khớp với Excel của bạn)
    writer.writerow([
        "originalTitle", "director", "duration", "ageRating", 
        "showingStatus", "releaseDate", "genreNames", "language", "isFeatured", "posterURL"
    ])
    
    # Dùng vòng lặp ghi dữ liệu mẫu
    for i in range(1, total_rows + 1):
        writer.writerow([
            f"Movie Title {i}",
            f"Director {i % 1000}",
            120,
            "T13",
            "NOW_SHOWING" if i % 2 == 0 else "COMING_SOON",
            "2026-09-18",
            "Hành động, Viễn tưởng",
            "Tiếng Việt",
            "có" if i % 10 == 0 else "không",
            "https://image.tmdb.org/t/p/w500/sample.jpg"
        ]
        )
        
        # In tiến độ mỗi 200k dòng
        if i % 200_000 == 0:
            print(f"Đã tạo xong {i} dòng...")

end_time = time.time()
print(f"Hoàn tất! Đã tạo 1 triệu dòng vào file '{file_name}' trong vòng {end_time - start_time:.2f} giây.")