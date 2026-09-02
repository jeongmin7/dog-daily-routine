import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/queries", () => ({
  useMedications: vi.fn(),
  useAddMedication: vi.fn(),
  useDeleteMedication: vi.fn(),
  useToggleDose: vi.fn(),
}));

import { useMedications, useAddMedication, useDeleteMedication, useToggleDose } from "@/lib/queries";
import { DogMedications } from "@/components/dog-medications";
import type { Medication } from "@/lib/types";
import { mutation, query, failingMutation } from "./query-mocks";

function med(over: Partial<Medication> = {}): Medication {
  return {
    id: "m1",
    dogId: "d1",
    name: "심장약",
    dosage: null,
    times: ["08:00", "20:00"],
    remainingCount: null,
    createdAt: "2026-09-01T00:00:00Z",
    doses: [],
    ...over,
  };
}

function dose(time: string) {
  return { id: "x", medicationId: "m1", date: "2026-09-02", time, takenAt: "2026-09-02T00:00:00Z" };
}

let toggle: ReturnType<typeof mutation>;
let remove: ReturnType<typeof mutation>;
let add: ReturnType<typeof mutation>;

beforeEach(() => {
  vi.clearAllMocks();
  toggle = mutation();
  remove = mutation();
  add = mutation();
  vi.mocked(useToggleDose).mockReturnValue(toggle as never);
  vi.mocked(useDeleteMedication).mockReturnValue(remove as never);
  vi.mocked(useAddMedication).mockReturnValue(add as never);
  vi.mocked(useMedications).mockReturnValue(query([med()]));
});

describe("DogMedications — 목록", () => {
  it("불러오는 중에는 로딩 문구", () => {
    vi.mocked(useMedications).mockReturnValue(query(undefined, { isPending: true }));
    render(<DogMedications dogId="d1" />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("약이 없으면 빈 상태를 안내한다", () => {
    vi.mocked(useMedications).mockReturnValue(query([]));
    render(<DogMedications dogId="d1" />);
    expect(screen.getByText(/등록한 약이 없어요/)).toBeInTheDocument();
  });

  it("이름과 용량, 복용 시간 칩을 그린다", () => {
    vi.mocked(useMedications).mockReturnValue(query([med({ dosage: "5mg" })]));
    render(<DogMedications dogId="d1" />);

    expect(screen.getByText("심장약")).toBeInTheDocument();
    expect(screen.getByText("5mg")).toBeInTheDocument();
    // 놓침 마커(!)는 현재 시각에 달렸다 — 여기선 칩 존재만 본다. 마커 판정은 아래 12:00 고정 describe에서.
    expect(screen.getByRole("button", { name: /08:00/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /20:00/ })).toBeInTheDocument();
  });

  it("삭제는 해당 약의 id로 부른다", async () => {
    render(<DogMedications dogId="d1" />);
    await userEvent.click(screen.getByLabelText("약 삭제"));
    expect(remove.mutate).toHaveBeenCalledWith("m1");
  });
});

describe("DogMedications — 잔량 경고", () => {
  it("7회분 이하면 처방 안내를 띄운다", () => {
    vi.mocked(useMedications).mockReturnValue(query([med({ remainingCount: 7 })]));
    render(<DogMedications dogId="d1" />);
    expect(screen.getByText(/잔량 7회분 · 곧 떨어져요/)).toBeInTheDocument();
  });

  it("8회분이면 잔량만 보여주고 경고는 없다", () => {
    vi.mocked(useMedications).mockReturnValue(query([med({ remainingCount: 8 })]));
    render(<DogMedications dogId="d1" />);
    expect(screen.getByText("잔량 8회분")).toBeInTheDocument();
    expect(screen.queryByText(/곧 떨어져요/)).not.toBeInTheDocument();
  });

  it("잔량이 0이어도 줄을 지우지 않는다 — null과 0은 다르다", () => {
    vi.mocked(useMedications).mockReturnValue(query([med({ remainingCount: 0 })]));
    render(<DogMedications dogId="d1" />);
    expect(screen.getByText(/잔량 0회분/)).toBeInTheDocument();
  });

  it("잔량을 안 적었으면 줄 자체가 없다", () => {
    render(<DogMedications dogId="d1" />);
    expect(screen.queryByText(/잔량/)).not.toBeInTheDocument();
  });
});

// 놓침 판정은 현재 시각에 의존한다 — 시계를 12:00으로 고정한다.
describe("DogMedications — 복용 슬롯 (12:00 기준)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 2, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("지난 시간인데 안 먹었으면 놓침으로 표시한다", () => {
    render(<DogMedications dogId="d1" />);
    expect(screen.getByRole("button", { name: "! 08:00" })).toBeInTheDocument();
    // 20:00은 아직 안 왔으므로 놓침이 아니다.
    expect(screen.getByRole("button", { name: "20:00" })).toBeInTheDocument();
  });

  it("먹은 슬롯은 지난 시간이어도 놓침이 아니다", () => {
    vi.mocked(useMedications).mockReturnValue(query([med({ doses: [dose("08:00")] })]));
    render(<DogMedications dogId="d1" />);
    expect(screen.getByRole("button", { name: "✓ 08:00" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "! 08:00" })).not.toBeInTheDocument();
  });

  it("안 먹은 슬롯을 누르면 taken: true로 토글한다", () => {
    render(<DogMedications dogId="d1" />);
    fireEvent.click(screen.getByRole("button", { name: "! 08:00" }));
    expect(toggle.mutate).toHaveBeenCalledWith({ medId: "m1", time: "08:00", taken: true });
  });

  it("먹은 슬롯을 누르면 taken: false로 되돌린다", () => {
    vi.mocked(useMedications).mockReturnValue(query([med({ doses: [dose("08:00")] })]));
    render(<DogMedications dogId="d1" />);
    fireEvent.click(screen.getByRole("button", { name: "✓ 08:00" }));
    expect(toggle.mutate).toHaveBeenCalledWith({ medId: "m1", time: "08:00", taken: false });
  });
});

describe("DogMedications — 약 추가 폼", () => {
  async function openForm() {
    render(<DogMedications dogId="d1" />);
    await userEvent.click(screen.getByRole("button", { name: "+ 약 추가" }));
  }

  it("이름이 비면 저장하지 않고 알린다", async () => {
    await openForm();
    await userEvent.type(screen.getByLabelText(/복용 시간/), "08:00");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByRole("alert")).toHaveTextContent("약 이름을 입력해주세요.");
    expect(add.mutateAsync).not.toHaveBeenCalled();
  });

  it("HH:MM이 아니면 저장하지 않는다", async () => {
    await openForm();
    await userEvent.type(screen.getByLabelText("약 이름"), "심장약");
    await userEvent.type(screen.getByLabelText(/복용 시간/), "아침");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/HH:MM 형식/);
    expect(add.mutateAsync).not.toHaveBeenCalled();
  });

  it("시간을 하나도 안 적으면 저장하지 않는다", async () => {
    await openForm();
    await userEvent.type(screen.getByLabelText("약 이름"), "심장약");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/HH:MM 형식/);
    expect(add.mutateAsync).not.toHaveBeenCalled();
  });

  it("쉼표로 나눈 시간을 배열로, 잔량을 숫자로 보낸다", async () => {
    await openForm();
    await userEvent.type(screen.getByLabelText("약 이름"), "  심장약  ");
    await userEvent.type(screen.getByLabelText(/용량/), "5mg");
    await userEvent.type(screen.getByLabelText(/복용 시간/), "08:00, 20:00");
    await userEvent.type(screen.getByLabelText(/잔량/), "30");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(add.mutateAsync).toHaveBeenCalledWith({
      name: "심장약",
      dosage: "5mg",
      times: ["08:00", "20:00"],
      remainingCount: 30,
    });
  });

  it("선택 항목을 비우면 undefined로 보낸다", async () => {
    await openForm();
    await userEvent.type(screen.getByLabelText("약 이름"), "심장약");
    await userEvent.type(screen.getByLabelText(/복용 시간/), "08:00");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(add.mutateAsync).toHaveBeenCalledWith({
      name: "심장약",
      dosage: undefined,
      times: ["08:00"],
      remainingCount: undefined,
    });
  });

  it("성공하면 폼을 닫는다", async () => {
    await openForm();
    await userEvent.type(screen.getByLabelText("약 이름"), "심장약");
    await userEvent.type(screen.getByLabelText(/복용 시간/), "08:00");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(screen.queryByLabelText("약 이름")).not.toBeInTheDocument());
  });

  it("실패하면 폼을 열어둔 채 알린다 — 입력이 날아가지 않는다", async () => {
    add = failingMutation();
    vi.mocked(useAddMedication).mockReturnValue(add as never);

    await openForm();
    await userEvent.type(screen.getByLabelText("약 이름"), "심장약");
    await userEvent.type(screen.getByLabelText(/복용 시간/), "08:00");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/약 저장에 실패했어요/);
    expect(screen.getByLabelText("약 이름")).toHaveValue("심장약");
  });
});
