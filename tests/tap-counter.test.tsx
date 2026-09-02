import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TapCounter } from "@/components/tap-counter";
import type { DiseaseMetric } from "@/lib/types";

// 심박수: 15초 세고 ×4 = 분당 심박수.
const heartRate: DiseaseMetric = {
  key: "heart_rate",
  diseaseKey: "heart",
  label: "분당 심박수",
  unit: "bpm",
  inputType: "counter",
  durationSec: 15,
  multiplier: 4,
  alertMin: 60,
  alertMax: 140,
  sortOrder: 0,
};

const noop = () => {};
const tapBtn = () => screen.getByLabelText("탭");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function tap(times: number) {
  for (let i = 0; i < times; i++) fireEvent.click(tapBtn());
}

describe("TapCounter", () => {
  it("첫 탭 전에는 타이머가 돌지 않는다", () => {
    render(<TapCounter metric={heartRate} onSave={noop} onClose={noop} saving={false} />);
    expect(screen.getByText("탭하여 시작")).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByText("탭하여 시작")).toBeInTheDocument();
  });

  it("첫 탭이 1회로 세어지고 타이머를 시작한다", () => {
    render(<TapCounter metric={heartRate} onSave={noop} onClose={noop} saving={false} />);
    tap(1);

    expect(tapBtn()).toHaveTextContent("1");
    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByText("남은 시간 14초")).toBeInTheDocument();
  });

  it("durationSec이 지나면 자동 종료하고 count × multiplier를 낸다", () => {
    const onSave = vi.fn();
    render(<TapCounter metric={heartRate} onSave={onSave} onClose={noop} saving={false} />);

    tap(2);
    act(() => void vi.advanceTimersByTime(15_000));

    expect(screen.getByText("완료! 2회 × 4 = 8 bpm")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(8);
  });

  it("종료 후의 탭은 카운트를 늘리지 않는다", () => {
    const onSave = vi.fn();
    render(<TapCounter metric={heartRate} onSave={onSave} onClose={noop} saving={false} />);

    tap(3);
    act(() => void vi.advanceTimersByTime(15_000));
    // 종료되면 탭 버튼 자체가 사라진다.
    expect(screen.queryByLabelText("탭")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(12);
  });

  it("다시를 누르면 카운트와 남은 시간이 초기화된다", () => {
    render(<TapCounter metric={heartRate} onSave={noop} onClose={noop} saving={false} />);

    tap(5);
    act(() => void vi.advanceTimersByTime(15_000));
    fireEvent.click(screen.getByRole("button", { name: "다시" }));

    expect(screen.getByText("탭하여 시작")).toBeInTheDocument();
    expect(tapBtn()).toHaveTextContent("0");
  });

  it("multiplier가 없으면 1로 본다 (호흡수: 60초 ×1)", () => {
    const onSave = vi.fn();
    const breathing: DiseaseMetric = {
      ...heartRate,
      label: "분당 호흡수",
      unit: "회/분",
      durationSec: 60,
      multiplier: null,
    };
    render(<TapCounter metric={breathing} onSave={onSave} onClose={noop} saving={false} />);

    tap(20);
    act(() => void vi.advanceTimersByTime(60_000));

    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(20);
  });

  it("닫기는 저장하지 않고 onClose만 부른다", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<TapCounter metric={heartRate} onSave={onSave} onClose={onClose} saving={false} />);

    tap(3);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });
});
