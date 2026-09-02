import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeasurementInput } from "@/components/measurement-input";
import type { DiseaseMetric } from "@/lib/types";

function metric(over: Partial<DiseaseMetric> = {}): DiseaseMetric {
  return {
    key: "m",
    diseaseKey: "d",
    label: "지표",
    unit: "ml",
    inputType: "number",
    durationSec: null,
    multiplier: null,
    alertMin: null,
    alertMax: null,
    sortOrder: 0,
    ...over,
  };
}

const noop = () => {};

describe("MeasurementInput — 차이 입력(diff)", () => {
  const m = metric({ inputType: "diff", label: "음수량", unit: "ml" });

  it("시작값 - 종료값을 계산해 저장한다", async () => {
    const onSave = vi.fn();
    render(<MeasurementInput metric={m} onSave={onSave} onCancel={noop} saving={false} />);

    await userEvent.type(screen.getByLabelText("시작값 (ml)"), "500");
    await userEvent.type(screen.getByLabelText("종료값 (ml)"), "320");

    expect(screen.getByText("180")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(180);
  });

  it("한쪽만 채우면 계산도 저장도 막는다", async () => {
    const onSave = vi.fn();
    render(<MeasurementInput metric={m} onSave={onSave} onCancel={noop} saving={false} />);

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("시작값 (ml)"), "500");
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("종료값이 더 크면 음수도 그대로 넘긴다", async () => {
    const onSave = vi.fn();
    render(<MeasurementInput metric={m} onSave={onSave} onCancel={noop} saving={false} />);

    await userEvent.type(screen.getByLabelText("시작값 (ml)"), "100");
    await userEvent.type(screen.getByLabelText("종료값 (ml)"), "150");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(-50);
  });
});

describe("MeasurementInput — 점수 슬라이더(slider)", () => {
  const m = metric({ inputType: "slider", label: "식욕", unit: "점" });

  it("기본값 3에서 시작하고 옮긴 값을 저장한다", async () => {
    const onSave = vi.fn();
    render(<MeasurementInput metric={m} onSave={onSave} onCancel={noop} saving={false} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("3");

    fireEvent.change(slider, { target: { value: "1" } });
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(1);
  });

  it("슬라이더는 손 안 대도 저장할 수 있다", async () => {
    const onSave = vi.fn();
    render(<MeasurementInput metric={m} onSave={onSave} onCancel={noop} saving={false} />);
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(3);
  });
});

describe("MeasurementInput — 수치 입력(number)", () => {
  const m = metric({ inputType: "number", label: "혈당", unit: "mg/dL" });

  it("빈 값이면 저장을 막고, 채우면 숫자로 넘긴다", async () => {
    const onSave = vi.fn();
    render(<MeasurementInput metric={m} onSave={onSave} onCancel={noop} saving={false} />);

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("혈당 (mg/dL)"), "300");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledWith(300);
  });

  it("알 수 없는 inputType은 수치 입력으로 떨어진다", () => {
    render(
      <MeasurementInput
        metric={metric({ inputType: "counter", label: "혈당", unit: "mg/dL" })}
        onSave={noop}
        onCancel={noop}
        saving={false}
      />,
    );
    expect(screen.getByLabelText("혈당 (mg/dL)")).toBeInTheDocument();
  });
});

describe("MeasurementInput — 공통", () => {
  it("취소를 누르면 onCancel이 불린다", async () => {
    const onCancel = vi.fn();
    render(<MeasurementInput metric={metric()} onSave={noop} onCancel={onCancel} saving={false} />);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("saving 중엔 두 버튼 모두 잠근다", () => {
    render(<MeasurementInput metric={metric()} onSave={noop} onCancel={noop} saving />);
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "저장 중…" })).toBeDisabled();
  });
});
