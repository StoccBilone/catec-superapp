import { Lesson } from '../types';
export const BELL_TIMES = [
  { pair: 0, start: '11:00', end: '12:20' },
  { pair: 1, start: '12:50', end: '14:10' },
  { pair: 2, start: '14:20', end: '15:40' },
  { pair: 3, start: '15:50', end: '17:10' },
  { pair: 4, start: '17:20', end: '18:40' },
];
export function collegeClock(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return { day: new Date(Date.UTC(get('year'), get('month') - 1, get('day'))).getUTCDay(), seconds: get('hour') * 3600 + get('minute') * 60 + get('second'), time: `${String(get('hour')).padStart(2, '0')}:${String(get('minute')).padStart(2, '0')}:${String(get('second')).padStart(2, '0')}` };
}
const timeSeconds = (time: string) => { const [hour, minute] = time.split(':').map(Number); return hour * 3600 + minute * 60; };
export function scheduleStatus(lessons: Lesson[], date: Date) {
  const clock = collegeClock(date);
  const current = lessons.filter(lesson => lesson.dayOfWeek === clock.day && timeSeconds(lesson.timeStart) <= clock.seconds && timeSeconds(lesson.timeEnd) > clock.seconds);
  const upcoming = lessons.map(lesson => {
    let days = (lesson.dayOfWeek - clock.day + 7) % 7;
    if (days === 0 && timeSeconds(lesson.timeStart) <= clock.seconds) days = 7;
    return { lesson, wait: days * 86400 + timeSeconds(lesson.timeStart) - clock.seconds };
  }).sort((a, b) => a.wait - b.wait);
  const wait = upcoming[0]?.wait;
  return { ...clock, current, next: upcoming.filter(item => item.wait === wait).map(item => item.lesson), wait, remaining: current[0] ? timeSeconds(current[0].timeEnd) - clock.seconds : undefined };
}
export function countdown(seconds: number) {
  return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor(seconds % 3600 / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
