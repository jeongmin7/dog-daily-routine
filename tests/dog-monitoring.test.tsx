import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/queries", () => ({
  useDogDiseases: vi.fn(),
  useDiseaseCatalog: vi.fn(),
  useRegisterDisease: vi.fn(),
  useUnregisterDisease: vi.fn(),
  useMeasurements: vi.fn(),
  useAddMeasurement: vi.fn(),
}));

import {
  useDogDiseases,
  useDiseaseCatalog,
  useRegisterDisease,
  useUnregisterDisease,
  useMeasurements,
  useAddMeasurement,
} from "@/lib/queries";
import { DogMonitoring } from "@/components/dog-monitoring";
import type { DiseaseMetric, DogDisease, Measurement } from "@/lib/types";
import { mutation, query, failingMutation } from "./query-mocks";

function metric(over: Partial<DiseaseMetric> = {}): DiseaseMetric {
  return {
    key: "glucose",
    diseaseKey: "diabetes",
    label: "혈당",
    unit: "mg/dL",
    inputType: "number",
    durationSec: null,
    multiplier: null,
    alertMin: 80,
    alertMax: 250,
    sortOrder: 0,
    ...over,
  };
}

const heartMetric = metric({
  key: "heart_rate",
  diseaseKey: "heart",
  label: "분당 심박수",
  unit: "bpm",
  inputType: "counter",
  durationSec: 15,
  multiplier: 4,
  alertMin: 60,
  alertMax: 140,
});

function registered(m: DiseaseMetric, over: Partial<DogDisease> = {}): DogDisease {
  return {
    id: "dd1",
    dogId: "d1",
    diseaseKey: m.diseaseKey,
    createdAt: "2026-09-01T00:00:00Z",
    disease: { key: m.diseaseKey, name: "당뇨", metrics: [m] },
    ...over,
  };
}

function measurements(...values: number[]): Measurement[] {
  return values.map((value, i) => ({
    id: `s${i}`,
    dogId: "d1",
    metricKey: "glucose",
    value,
    measuredAt: `2026-09-0${i + 1}T00:00:00Z`,
  }));
}

let register: ReturnType<typeof mutation>;
let unregister: ReturnType<typeof mutation>;
let add: ReturnType<typeof mutation>;

beforeEach(() => {
  vi.clearAllMocks();
  register = mutation();
  unregister = mutation();
  add = mutation();
  vi.mocked(useRegisterDisease).mockReturnValue(register as never);
  vi.mocked(useUnregisterDisease).mockReturnValue(unregister as never);
  vi.mocked(useAddMeasurement).mockReturnValue(add as never);
  vi.mocked(useDiseaseCatalog).mockReturnValue(query([]));
  vi.mocked(useDogDiseases).mockReturnValue(query([]));
  vi.mocked(useMeasurements).mockReturnValue(query([]));
});

describe("DogMonitoring — 지병 등록", () => {
  it("불러오는 중에는 로딩 문구", () => {
    vi.mocked(useDogDiseases).mockReturnValue(query(undefined, { isPending: true }));
    render(<DogMonitoring dogId="d1" />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("등록된 지병이 없으면 빈 상태를 안내한다", () => {
    render(<DogMonitoring dogId="d1" />);
    expect(screen.getByText(/등록된 지병이 없어요/)).toBeInTheDocument();
  });

  it("이미 등록한 지병은 선택지에서 뺀다", async () => {
    vi.mocked(useDiseaseCatalog).mockReturnValue(
      query([
        { key: "diabetes", name: "당뇨", metrics: [] },
        { key: "heart", name: "심장병", metrics: [] },
      ]),
    );
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));

    render(<DogMonitoring dogId="d1" />);
    await userEvent.click(screen.getByRole("button", { name: "+ 지병 등록" }));

    expect(screen.getByRole("button", { name: "심장병" })).toBeInTheDocument();
    // "당뇨"는 등록된 카드 제목으로만 남고 선택 버튼으로는 없어야 한다.
    expect(screen.queryByRole("button", { name: "당뇨" })).not.toBeInTheDocument();
  });

  it("등록할 게 남지 않으면 등록 버튼 자체를 숨긴다", () => {
    vi.mocked(useDiseaseCatalog).mockReturnValue(query([{ key: "diabetes", name: "당뇨", metrics: [] }]));
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));

    render(<DogMonitoring dogId="d1" />);
    expect(screen.queryByRole("button", { name: "+ 지병 등록" })).not.toBeInTheDocument();
  });

  it("고르면 key로 등록하고 선택창을 닫는다", async () => {
    vi.mocked(useDiseaseCatalog).mockReturnValue(query([{ key: "heart", name: "심장병", metrics: [] }]));

    render(<DogMonitoring dogId="d1" />);
    await userEvent.click(screen.getByRole("button", { name: "+ 지병 등록" }));
    await userEvent.click(screen.getByRole("button", { name: "심장병" }));

    expect(register.mutateAsync).toHaveBeenCalledWith("heart");
    await waitFor(() => expect(screen.queryByText("등록할 지병을 선택하세요")).not.toBeInTheDocument());
  });

  it("해제는 diseaseKey로 부른다", async () => {
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));
    render(<DogMonitoring dogId="d1" />);

    await userEvent.click(screen.getByRole("button", { name: "해제" }));
    expect(unregister.mutate).toHaveBeenCalledWith("diabetes");
  });
});

describe("DogMonitoring — 지표 표시", () => {
  beforeEach(() => {
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));
  });

  it("측정 기록이 없으면 그렇게 말한다", () => {
    render(<DogMonitoring dogId="d1" />);
    expect(screen.getByText("아직 측정 기록이 없어요")).toBeInTheDocument();
  });

  it("가장 마지막 값을 최근값으로 쓴다", () => {
    vi.mocked(useMeasurements).mockReturnValue(query(measurements(100, 120, 140)));
    render(<DogMonitoring dogId="d1" />);
    expect(screen.getByText("140")).toBeInTheDocument();
  });

  it("alertMax를 넘으면 경고한다", () => {
    vi.mocked(useMeasurements).mockReturnValue(query(measurements(300)));
    render(<DogMonitoring dogId="d1" />);
    expect(screen.getByText(/정상 범위를 벗어났어요/)).toBeInTheDocument();
  });

  it("alertMin 아래여도 경고한다", () => {
    vi.mocked(useMeasurements).mockReturnValue(query(measurements(50)));
    render(<DogMonitoring dogId="d1" />);
    expect(screen.getByText(/정상 범위를 벗어났어요/)).toBeInTheDocument();
  });

  it("경계값은 정상으로 본다 (미만/초과 비교)", () => {
    vi.mocked(useMeasurements).mockReturnValue(query(measurements(250)));
    render(<DogMonitoring dogId="d1" />);
    expect(screen.queryByText(/정상 범위를 벗어났어요/)).not.toBeInTheDocument();
  });

  it("임계값이 없는 지표는 경고하지 않는다", () => {
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric({ alertMin: null, alertMax: null }))]));
    vi.mocked(useMeasurements).mockReturnValue(query(measurements(9999)));
    render(<DogMonitoring dogId="d1" />);
    expect(screen.queryByText(/정상 범위를 벗어났어요/)).not.toBeInTheDocument();
  });

  it("점이 2개는 돼야 추이선을 그린다", () => {
    vi.mocked(useMeasurements).mockReturnValue(query(measurements(100)));
    const one = render(<DogMonitoring dogId="d1" />);
    expect(one.container.querySelector("polyline")).toBeNull();
    one.unmount();

    vi.mocked(useMeasurements).mockReturnValue(query(measurements(100, 120)));
    const two = render(<DogMonitoring dogId="d1" />);
    expect(two.container.querySelector("polyline")).not.toBeNull();
  });
});

describe("DogMonitoring — 측정 도구 분기", () => {
  it("counter 지표는 탭 카운터 오버레이를 연다", async () => {
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(heartMetric)]));
    render(<DogMonitoring dogId="d1" />);

    await userEvent.click(screen.getByRole("button", { name: "측정" }));
    expect(screen.getByLabelText("탭")).toBeInTheDocument();
  });

  it("counter가 아니면 인라인 입력을 쓴다", async () => {
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));
    render(<DogMonitoring dogId="d1" />);

    await userEvent.click(screen.getByRole("button", { name: "측정" }));
    expect(screen.getByLabelText("혈당 (mg/dL)")).toBeInTheDocument();
    expect(screen.queryByLabelText("탭")).not.toBeInTheDocument();
  });

  it("저장하면 metricKey와 값을 함께 보내고 측정 창을 닫는다", async () => {
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));
    render(<DogMonitoring dogId="d1" />);

    await userEvent.click(screen.getByRole("button", { name: "측정" }));
    await userEvent.type(screen.getByLabelText("혈당 (mg/dL)"), "300");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(add.mutateAsync).toHaveBeenCalledWith({ metricKey: "glucose", value: 300 });
    await waitFor(() => expect(screen.queryByLabelText("혈당 (mg/dL)")).not.toBeInTheDocument());
  });

  it("저장이 실패하면 측정 창을 열어둔다 — 다시 재려고 처음부터 하지 않게", async () => {
    add = failingMutation();
    vi.mocked(useAddMeasurement).mockReturnValue(add as never);
    vi.mocked(useDogDiseases).mockReturnValue(query([registered(metric())]));
    render(<DogMonitoring dogId="d1" />);

    await userEvent.click(screen.getByRole("button", { name: "측정" }));
    await userEvent.type(screen.getByLabelText("혈당 (mg/dL)"), "300");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(add.mutateAsync).toHaveBeenCalled());
    expect(screen.getByLabelText("혈당 (mg/dL)")).toBeInTheDocument();
  });
});
