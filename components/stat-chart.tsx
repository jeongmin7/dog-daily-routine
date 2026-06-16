/* 주간 통계 차트 — 라인 (시안 최종 확정 변형). 식사·산책·체중 3개. */

import type { DogStats, StatPoint } from "@/lib/types";
import { fmtMonthDay } from "@/lib/format";

type Point = StatPoint;

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
  headline,
  headlineLabel,
  sub,
}: {
  title: string;
  emoji: string;
  data: Point[];
  color: string;
  unit: string;
  headline: number | null; // 헤더에 띄울 요약값(서버 집계) — 평균/총합/최신값
  headlineLabel: string; // "평균" · "총" · "최근"
  sub?: string | null; // 보조 문구(체중 증감 등)
}) {
  const pts = data.filter((d): d is { date: string; value: number } => d.value !== null && d.value !== undefined);

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
      <div className="stack" style={{ alignItems: "flex-end", gap: 1 }}>
        <div className="chart-latest num" style={{ color }}>
          <span className="u" style={{ marginRight: 4 }}>{headlineLabel}</span>
          {headline != null ? headline : "–"}
          <span className="u">{unit}</span>
        </div>
        {sub && <span className="caption">{sub}</span>}
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

// 체중 증감 문구. 서버 change 값(부호 있음)을 사람 말로.
function fmtChange(change: number | null): string | null {
  if (change == null) return null;
  const v = Math.round(change * 10) / 10;
  if (v === 0) return "지난 기록과 동일";
  return `지난 기록 대비 ${v > 0 ? "+" : ""}${v}kg`;
}

export function WeeklyStats({ stats }: { stats: DogStats }) {
  return (
    <div className="stack gap-3">
      <StatChart
        title="식사량"
        emoji="🍽"
        color="var(--primary)"
        unit="g"
        data={stats.meal.series}
        headline={stats.meal.avg}
        headlineLabel="평균"
      />
      <StatChart
        title="산책 시간"
        emoji="🚶"
        color="var(--accent)"
        unit="분"
        data={stats.walk.series}
        headline={stats.walk.sum}
        headlineLabel="총"
      />
      <StatChart
        title="체중"
        emoji="⚖"
        color="var(--success)"
        unit="kg"
        data={stats.weight.series}
        headline={stats.weight.latest}
        headlineLabel="최근"
        sub={fmtChange(stats.weight.change)}
      />
    </div>
  );
}
