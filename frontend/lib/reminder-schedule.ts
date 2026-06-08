export const REMINDER_SCHEDULE_PRESETS = [
  { label: '매일 오전 8시', value: 'RRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=0' },
  { label: '매일 오전 9시', value: 'RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=0' },
  { label: '매일 오후 9시', value: 'RRULE:FREQ=DAILY;BYHOUR=21;BYMINUTE=0' },
  { label: '2시간마다, 오전 9시부터 오후 7시까지', value: 'RRULE:FREQ=HOURLY;INTERVAL=2;BYHOUR=9,11,13,15,17,19' },
  { label: '매주 월요일 오전 8시', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0' },
] as const;

const WEEKDAY_LABELS: Record<string, string> = {
  MO: '월요일',
  TU: '화요일',
  WE: '수요일',
  TH: '목요일',
  FR: '금요일',
  SA: '토요일',
  SU: '일요일',
};

export function describeReminderSchedule(rrule: string): string {
  const preset = REMINDER_SCHEDULE_PRESETS.find((item) => item.value === rrule);
  if (preset) return preset.label;

  const parts = parseRRule(rrule);
  const frequency = parts.FREQ;
  const hour = Number(parts.BYHOUR?.split(',')[0] ?? NaN);
  const minute = Number(parts.BYMINUTE ?? 0);
  const time = formatKoreanTime(hour, minute);

  if (frequency === 'DAILY' && time) return `매일 ${time}`;

  if (frequency === 'WEEKLY' && time) {
    const weekday = WEEKDAY_LABELS[parts.BYDAY ?? ''] ?? '지정 요일';
    return `매주 ${weekday} ${time}`;
  }

  if (frequency === 'HOURLY') {
    const interval = Number(parts.INTERVAL ?? 1);
    const hours = parts.BYHOUR?.split(',').map(Number).filter(Number.isFinite) ?? [];
    if (hours.length > 1) {
      const first = formatKoreanHour(hours[0]);
      const last = formatKoreanHour(hours[hours.length - 1]);
      return `${interval}시간마다, ${first}부터 ${last}까지`;
    }
    return `${interval}시간마다`;
  }

  return '반복 알림';
}

function parseRRule(rrule: string): Record<string, string> {
  return rrule
    .replace(/^RRULE:/, '')
    .split(';')
    .reduce<Record<string, string>>((result, part) => {
      const [key, value] = part.split('=');
      if (key && value) result[key] = value;
      return result;
    }, {});
}

function formatKoreanTime(hour: number, minute: number): string {
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return '';
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 || 12;
  return minute > 0
    ? `${period} ${displayHour}시 ${minute}분`
    : `${period} ${displayHour}시`;
}

function formatKoreanHour(hour: number): string {
  return formatKoreanTime(hour, 0);
}
