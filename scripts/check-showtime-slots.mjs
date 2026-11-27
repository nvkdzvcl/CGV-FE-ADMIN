import assert from 'node:assert/strict';
import { availableStartTimes, endTimeFor } from '../src/services/showtimeSlots.js';

const day = '2026-12-20';
const now = new Date('2026-11-06T03:00:00Z').getTime();
const schedule = [
  { date: day, roomId: 'A', movieTitle: 'Phim khác', startTime: '10:00', endTime: '13:00', status: 'SCHEDULED' },
  { date: day, roomId: 'A', startTime: '16:00', endTime: '18:00', status: 'CANCELLED' },
  { date: day, roomId: 'B', startTime: '09:00', endTime: '22:00', status: 'SCHEDULED' }
];
const slots = availableStartTimes(day, 'A', 120, schedule, now);
assert.ok(slots.includes('13:00'));
assert.ok(!slots.includes('09:00'));
assert.ok(!slots.includes('11:00'));
assert.ok(slots.includes('16:00'));
assert.equal(endTimeFor('13:00', 120), '15:15');
assert.ok(availableStartTimes(day, 'B', 120, schedule, now).length < slots.length);
assert.ok(!availableStartTimes('2026-11-05', 'A', 120, [], now).length);
console.log('Lọc giờ trống theo phòng, phim khác, lịch hủy và thời gian hiện tại: đạt.');
