/* 한국(UTC+9) 기준 오늘 날짜 YYYY-MM-DD. 서버가 UTC라도 한국 "오늘"을 쓴다. */
export function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
