const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const vietnamToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

export const endTimeFor = (startTime, durationMinutes) => {
  const total = minutes(startTime) + Number(durationMinutes) + 15;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const availableStartTimes = (date, roomId, durationMinutes, showtimes, now = Date.now()) => {
  if (!date || !roomId || !Number(durationMinutes)) return [];
  const previousDate = new Date(new Date(`${date}T00:00:00+07:00`).getTime() - 86400000)
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const busy = showtimes.filter(showtime => String(showtime.roomId) === String(roomId)
    && showtime.status !== 'CANCELLED' && (showtime.date === date || showtime.date === previousDate));
  return Array.from({ length: 56 }, (_, index) => {
    const startMinutes = 9 * 60 + index * 15;
    const start = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
    const from = new Date(`${date}T${start}:00+07:00`).getTime();
    const until = from + (Number(durationMinutes) + 15) * 60000;
    const midnight = new Date(`${date}T00:00:00+07:00`).getTime() + 86400000;
    if (from <= now || until > midnight) return null;
    const overlaps = busy.some(showtime => {
      const bookedFrom = new Date(`${showtime.date}T${showtime.startTime}:00+07:00`).getTime();
      let bookedUntil = new Date(`${showtime.date}T${showtime.endTime}:00+07:00`).getTime();
      if (bookedUntil <= bookedFrom) bookedUntil += 86400000;
      return from < bookedUntil && until > bookedFrom;
    });
    return overlaps ? null : start;
  }).filter(Boolean);
};
