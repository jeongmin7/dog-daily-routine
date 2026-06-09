/* 주간 통계 차트 — 라인 (시안 최종 확정 변형). 식사·산책·체중 3개. */

import type { DogRecord } from "@/lib/types";
import { fmtMonthDay } from "@/lib/format";

type Point = { date: string; value: number | null };

function buildScale(values: number[]) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.18;
  return { min: min - pad, max: max + pad };
}

function StatChart({
  title,
  emoji,
  data,
  color,
  unit,
}: {
  title: string;
  emoji: string;
  data: Point[];
  color: string;
  unit: string;
}) {
  const pts = data.filter((d): d is { date: string; value: number } => d.value !== null && d.value !== undefined);
  const latest = pts.length ? pts[pts.length - 1].value : null;

  const W = 320;
  const H = 184;
  const padL = 30;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = pts.length;

  const head = (
    <div className="chart-head">
      <div className="row gap-2">
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span className="title-md">{title}</span>
      </div>
      <div className="chart-latest num" style={{ color }}>
        {latest != null ? latest : "–"}
        <span className="u">{unit}</span>
      </div>
    </div>
  );

  if (n === 0) {
    return (
      <div className="chart-wrap">
        {head}
        <div className="caption" style={{ padding: "18px 0", textAlign: "center" }}>
          데이터 없음
        </div>
      </div>
    );
  }

  const { min, max } = buildScale(pts.map((d) => d.value));
  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * innerH;
  const baseY = padT + innerH;

  const linePath = pts.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;
  const gid = "g-" + title.replace(/[^a-z]/gi, "");

  return (
    <div className="chart-wrap">
      {head}
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: H }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1={padL} x2={W - padR} y1={padT + t * innerH} y2={padT + t * innerH} stroke="var(--border)" strokeWidth="1" />
        ))}

        <text className="chart-axis-label num" x={padL - 6} y={padT + 4} textAnchor="end">
          {Math.round(max)}
        </text>
        <text className="chart-axis-label num" x={padL - 6} y={baseY} textAnchor="end">
          {Math.round(min)}
        </text>

        <path d={areaPath} fill={`url(#${gid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={3} fill="var(--card)" stroke={color} strokeWidth="2" />
        ))}

        {pts.map((d, i) => (
          <text key={i} className="chart-axis-label num" x={x(i)} y={H - 8} textAnchor="middle">
            {fmtMonthDay(d.date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function WeeklyStats({ records }: { records: DogRecord[] }) {
  // 최근 7개 기록을 날짜 오름차순으로
  const week = records.slice(0, 7).slice().reverse();
  const mk = (key: "meal" | "walkMin" | "weight"): Point[] =>
    week.map((r) => ({ date: r.date, value: r[key] === null || r[key] === undefined ? null : Number(r[key]) }));

  return (
    <div className="stack gap-3">
      <StatChart title="식사량" emoji="🍽" data={mk("meal")} color="var(--primary)" unit="g" />
      <StatChart title="산책 시간" emoji="🚶" data={mk("walkMin")} color="var(--accent)" unit="분" />
      <StatChart title="체중" emoji="⚖" data={mk("weight")} color="var(--success)" unit="kg" />
    </div>
  );
}
