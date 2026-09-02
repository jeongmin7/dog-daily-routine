import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordForm } from "@/components/record-form";
import { todayISO } from "@/lib/format";
import type { Dog, DogRecord } from "@/lib/types";

// react-query를 쓰지 않는다 — 저장/삭제를 전부 prop으로 받으므로 모킹할 의존성이 없다.

const dog: Dog = { id: "d1", name: "보리" } as Dog;

const record: DogRecord = {
  id: "r1",
  dogId: "d1",
  date: "2026-03-05",
  meal: 120,
  walkMin: 30,
  weight: 4.6,
  memo: "컨디션 좋음",
};

beforeEach(() => {
  vi.stubGlobal("alert", vi.fn());
  vi.stubGlobal("confirm", vi.fn(() => true));
});
afterEach(() => vi.unstubAllGlobals());

const save = () => screen.getByRole("button", { name: "저장" });

describe("RecordForm — 신규", () => {
  it("날짜는 오늘로 채우고 나머지는 비운다", () => {
    render(<RecordForm mode="new" dog={dog} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("오늘 기록")).toBeInTheDocument();
    expect(screen.getByLabelText("날짜")).toHaveValue(todayISO());
    expect(screen.getByLabelText(/식사량/)).toHaveValue(null);
  });

  it("미래 날짜를 막는다 (max=오늘)", () => {
    render(<RecordForm mode="new" dog={dog} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("날짜")).toHaveAttribute("max", todayISO());
  });

  it("빈 칸은 undefined로 넘긴다 — 0으로 저장하지 않는다", async () => {
    const onSave = vi.fn();
    render(<RecordForm mode="new" dog={dog} onSave={onSave} onCancel={vi.fn()} />);

    await userEvent.click(save());
    expect(onSave).toHaveBeenCalledWith({
      date: todayISO(),
      meal: undefined,
      walkMin: undefined,
      walkKm: undefined,
      poop: undefined,
      weight: undefined,
      memo: undefined,
    });
  });

  it("입력한 값은 문자열이 아니라 숫자로 넘긴다", async () => {
    const onSave = vi.fn();
    render(<RecordForm mode="new" dog={dog} onSave={onSave} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/식사량/), "120");
    await userEvent.type(screen.getByLabelText(/거리/), "1.5");
    await userEvent.click(save());

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ meal: 120, walkKm: 1.5 }));
  });

  it("공백뿐인 메모는 undefined로 떨군다", async () => {
    const onSave = vi.fn();
    render(<RecordForm mode="new" dog={dog} onSave={onSave} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/메모/), "   ");
    await userEvent.click(save());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ memo: undefined }));
  });

  it("신규에는 삭제 버튼이 없다", () => {
    render(<RecordForm mode="new" dog={dog} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
  });

  it("저장 중에는 버튼을 잠근다", async () => {
    let release: () => void = () => {};
    const onSave = vi.fn(() => new Promise<void>((r) => (release = r)));
    render(<RecordForm mode="new" dog={dog} onSave={onSave} onCancel={vi.fn()} />);

    await userEvent.click(save());
    const busy = screen.getByRole("button", { name: "저장 중…" });
    expect(busy).toBeDisabled();
    release();
  });

  it("저장이 실패하면 잠금을 풀고 알린다 — 입력이 갇히지 않는다", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("network"));
    render(<RecordForm mode="new" dog={dog} onSave={onSave} onCancel={vi.fn()} />);

    await userEvent.click(save());
    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(save()).not.toBeDisabled();
  });
});

describe("RecordForm — 수정", () => {
  it("기존 값으로 채운다", () => {
    render(<RecordForm mode="edit" dog={dog} record={record} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("기록 수정")).toBeInTheDocument();
    expect(screen.getByLabelText("날짜")).toHaveValue("2026-03-05");
    expect(screen.getByLabelText(/식사량/)).toHaveValue(120);
    expect(screen.getByLabelText(/메모/)).toHaveValue("컨디션 좋음");
    // 기록에 없던 항목은 0이 아니라 빈 칸이어야 한다.
    expect(screen.getByLabelText(/배변/)).toHaveValue(null);
  });

  it("확인을 눌러야 삭제한다", async () => {
    const onDelete = vi.fn();
    render(
      <RecordForm mode="edit" dog={dog} record={record} onSave={vi.fn()} onDelete={onDelete} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("확인을 취소하면 삭제하지 않는다", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const onDelete = vi.fn();
    render(
      <RecordForm mode="edit" dog={dog} record={record} onSave={vi.fn()} onDelete={onDelete} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("취소는 onCancel로 빠진다", async () => {
    const onCancel = vi.fn();
    render(<RecordForm mode="edit" dog={dog} record={record} onSave={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
