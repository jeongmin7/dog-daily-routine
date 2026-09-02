import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordCard, RecordMetrics } from "@/components/record-card";
import { todayISO, isoDaysAgo } from "@/lib/format";
import type { DogRecord } from "@/lib/types";

function rec(over: Partial<DogRecord> = {}): DogRecord {
  return { id: "r1", dogId: "d1", date: "2026-03-05", ...over };
}

describe("RecordMetrics", () => {
  it("값이 있는 지표만 그린다 — 0/undefined는 미기록 취급", () => {
    render(<RecordMetrics record={rec({ meal: 300, walkMin: 0, weight: 5.2 })} />);

    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("5.2")).toBeInTheDocument();
    // walkMin: 0 은 "0분 산책"이 아니라 미기록이다.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("분")).not.toBeInTheDocument();
  });

  it("METRIC_ORDER 순서대로 그린다", () => {
    render(<RecordMetrics record={rec({ weight: 5.2, meal: 300, poop: 2 })} />);
    const vals = screen.getAllByText(/^(300|2|5\.2)$/).map((el) => el.textContent);
    expect(vals).toEqual(["300", "2", "5.2"]); // meal → poop → weight
  });

  it("전부 비면 빈 상태 문구를 낸다", () => {
    render(<RecordMetrics record={rec()} />);
    expect(screen.getByText("기록 항목 없음")).toBeInTheDocument();
  });

  it("memo만 있고 지표가 없어도 빈 상태다", () => {
    render(<RecordMetrics record={rec({ memo: "산책 못 감" })} />);
    expect(screen.getByText("기록 항목 없음")).toBeInTheDocument();
  });
});

describe("RecordCard", () => {
  it("날짜를 한국어로 포맷한다", () => {
    render(<RecordCard record={rec()} />);
    expect(screen.getByText(/3월 5일/)).toBeInTheDocument();
  });

  it("오늘/어제만 상대 표기를 붙인다", () => {
    const { unmount } = render(<RecordCard record={rec({ date: todayISO() })} />);
    expect(screen.getByText("오늘")).toBeInTheDocument();
    unmount();

    const past = render(<RecordCard record={rec({ date: isoDaysAgo(1) })} />);
    expect(screen.getByText("어제")).toBeInTheDocument();
    past.unmount();

    render(<RecordCard record={rec({ date: isoDaysAgo(3) })} />);
    expect(screen.queryByText("오늘")).not.toBeInTheDocument();
    expect(screen.queryByText("어제")).not.toBeInTheDocument();
  });

  it("memo가 있을 때만 그린다", () => {
    const { rerender } = render(<RecordCard record={rec()} />);
    expect(screen.queryByText("잘 먹었다")).not.toBeInTheDocument();

    rerender(<RecordCard record={rec({ memo: "잘 먹었다" })} />);
    expect(screen.getByText("잘 먹었다")).toBeInTheDocument();
  });

  it("카드를 누르면 onClick이 불린다", async () => {
    const onClick = vi.fn();
    const { container } = render(<RecordCard record={rec()} onClick={onClick} />);
    await userEvent.click(container.querySelector(".record-card")!);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
