import assert from 'node:assert/strict';

const url = 'http://localhost:8000/api/v1/catalogs/showtimes';
const fetchPage = async (page) => {
  const response = await fetch(`${url}?page=${page}&size=300`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.data?.data));
  return body.data;
};

const first = await fetchPage(0);
const remaining = await Promise.all(Array.from(
  { length: first.totalPages - 1 }, (_, index) => fetchPage(index + 1)
));
const showtimes = [first, ...remaining].flatMap(page => page.data);
assert.equal(showtimes.length, first.totalElements);
for (const showtime of showtimes) {
  assert.ok(showtime.showDate && showtime.roomResponse?.cinemaResponse?.id);
  assert.ok(Number.isFinite(new Date(showtime.startTime).getTime()));
}
console.log(`Catalog: ${showtimes.length} suất chiếu trên ${first.totalPages} trang; dữ liệu phòng/rạp hợp lệ.`);
