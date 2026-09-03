import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/queries", () => ({
  useFeedAnalyses: vi.fn(),
  useCreateFeedAnalysis: vi.fn(),
  useDeleteFeedAnalysis: vi.fn(),
}));

import { useFeedAnalyses, useCreateFeedAnalysis, useDeleteFeedAnalysis } from "@/lib/queries";
import DogFeedAnalysis from "@/components/dog-feed-analysis";
import type { FeedAnalysis } from "@/lib/types";
import { mutation, query, failingMutation } from "./query-mocks";

function analysis(over: Partial<FeedAnalysis> = {}): FeedAnalysis {
  return {
    id: "a1",
    dogId: "d1",
    imageUrl: "https://blob.test/label.jpg",
    rating: 4,
    summary: "전반적으로 무난한 사료예요.",
    nutrients: [{ label: "조단백", value: "26%" }],
    cautions: [],
    benefits: [],
    model: "claude",
    createdAt: "2026-09-01T00:00:00Z",
    ...over,
  };
}

// 4MB 한계를 넘기려고 실제 바이트를 만들 필요는 없다 — size만 갈아끼운다.
function imageFile(name = "label.jpg", size = 1024, type = "image/jpeg") {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

let create: ReturnType<typeof mutation>;
let remove: ReturnType<typeof mutation>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("alert", vi.fn());
  create = mutation();
  remove = mutation();
  vi.mocked(useCreateFeedAnalysis).mockReturnValue(create as never);
  vi.mocked(useDeleteFeedAnalysis).mockReturnValue(remove as never);
  vi.mocked(useFeedAnalyses).mockReturnValue(query([]));
});
afterEach(() => vi.unstubAllGlobals());

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const analyzeBtn = () => screen.getByRole("button", { name: "분석하기" });

describe("DogFeedAnalysis — 업로드 검증", () => {
  it("파일을 고르기 전에는 분석할 수 없다", () => {
    render(<DogFeedAnalysis dogId="d1" />);
    expect(analyzeBtn()).toBeDisabled();
    expect(screen.getByRole("button", { name: "성분표 사진 선택" })).toBeInTheDocument();
  });

  it("고른 파일 이름을 버튼에 보여주고 분석을 연다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.upload(fileInput(), imageFile("사료라벨.jpg"));

    expect(screen.getByRole("button", { name: "사료라벨.jpg" })).toBeInTheDocument();
    expect(analyzeBtn()).not.toBeDisabled();
  });

  it("이미지가 아니면 막는다", () => {
    render(<DogFeedAnalysis dogId="d1" />);
    // userEvent.upload는 accept="image/*"를 존중해 파일을 걸러버려 핸들러까지 가지 않는다.
    // 컴포넌트의 type 검사는 드래그앤드롭·OS의 "모든 파일" 선택을 막는 2차 방어선이므로
    // accept를 우회하는 fireEvent로 직접 흘려보낸다.
    fireEvent.change(fileInput(), { target: { files: [imageFile("문서.pdf", 1024, "application/pdf")] } });

    expect(window.alert).toHaveBeenCalledWith("이미지 파일만 올릴 수 있어요.");
    expect(analyzeBtn()).toBeDisabled();
  });

  it("4MB를 넘으면 막는다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.upload(fileInput(), imageFile("큰사진.jpg", 4 * 1024 * 1024 + 1));

    expect(window.alert).toHaveBeenCalledWith("이미지는 4MB 이하만 가능해요.");
    expect(analyzeBtn()).toBeDisabled();
  });

  it("정확히 4MB는 통과시킨다 — 경계", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.upload(fileInput(), imageFile("딱4MB.jpg", 4 * 1024 * 1024));

    expect(window.alert).not.toHaveBeenCalled();
    expect(analyzeBtn()).not.toBeDisabled();
  });

  it("선택을 취소하면 파일이 풀린다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.upload(fileInput(), imageFile());
    await userEvent.click(screen.getByRole("button", { name: "취소" }));

    expect(analyzeBtn()).toBeDisabled();
    expect(screen.getByRole("button", { name: "성분표 사진 선택" })).toBeInTheDocument();
  });
});

describe("DogFeedAnalysis — 분석 요청", () => {
  it("고른 파일 그대로 보내고 성공하면 선택을 비운다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    const f = imageFile();
    await userEvent.upload(fileInput(), f);
    await userEvent.click(analyzeBtn());

    expect(create.mutateAsync).toHaveBeenCalledWith(f);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "성분표 사진 선택" })).toBeInTheDocument(),
    );
  });

  it("분석 중에는 진행 안내를 띄우고 버튼을 잠근다", async () => {
    create = mutation({ isPending: true });
    vi.mocked(useCreateFeedAnalysis).mockReturnValue(create as never);
    render(<DogFeedAnalysis dogId="d1" />);

    expect(screen.getByText(/AI가 성분표를 읽고 있어요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "분석 중…" })).toBeDisabled();
  });

  it("실패하면 알리고 파일을 남긴다 — 다시 고르지 않게", async () => {
    create = failingMutation();
    vi.mocked(useCreateFeedAnalysis).mockReturnValue(create as never);
    render(<DogFeedAnalysis dogId="d1" />);

    await userEvent.upload(fileInput(), imageFile("사료라벨.jpg"));
    await userEvent.click(analyzeBtn());

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요."),
    );
    expect(screen.getByRole("button", { name: "사료라벨.jpg" })).toBeInTheDocument();
  });
});

describe("DogFeedAnalysis — 히스토리", () => {
  it("불러오는 중에는 로딩 문구", () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(query(undefined, { isPending: true }));
    render(<DogFeedAnalysis dogId="d1" />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("결과가 없으면 빈 상태를 안내한다", () => {
    render(<DogFeedAnalysis dogId="d1" />);
    expect(screen.getByText(/아직 분석한 사료가 없어요/)).toBeInTheDocument();
  });

  it("점수·요약·썸네일을 그린다", () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(query([analysis()]));
    render(<DogFeedAnalysis dogId="d1" />);

    expect(screen.getByText("4/5")).toBeInTheDocument();
    expect(screen.getByText("전반적으로 무난한 사료예요.")).toBeInTheDocument();
    expect(screen.getByAltText("성분표")).toHaveAttribute("src", "https://blob.test/label.jpg");
  });

  it("주의 성분은 있을 때만 그린다", () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(
      query([analysis({ cautions: [{ ingredient: "BHA", reason: "산화방지제" }] })]),
    );
    render(<DogFeedAnalysis dogId="d1" />);

    expect(screen.getByText("⚠ 주의 성분")).toBeInTheDocument();
    expect(screen.getByText("BHA")).toBeInTheDocument();
    expect(screen.getByText(/산화방지제/)).toBeInTheDocument();
  });

  it("주의 성분이 없으면 섹션 자체가 없다", () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(query([analysis()]));
    render(<DogFeedAnalysis dogId="d1" />);
    expect(screen.queryByText("⚠ 주의 성분")).not.toBeInTheDocument();
  });

  it("좋은 점과 영양 성분을 그린다", () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(
      query([
        analysis({
          benefits: ["오메가3 풍부"],
          nutrients: [
            { label: "조단백", value: "26%" },
            { label: "조지방", value: "14%" },
          ],
        }),
      ]),
    );
    render(<DogFeedAnalysis dogId="d1" />);

    expect(screen.getByText("✓ 좋은 점")).toBeInTheDocument();
    expect(screen.getByText("오메가3 풍부")).toBeInTheDocument();
    expect(screen.getByText("조단백")).toBeInTheDocument();
    expect(screen.getByText("26%")).toBeInTheDocument();
    expect(screen.getByText("14%")).toBeInTheDocument();
  });

  it("영양 성분이 비면 표를 그리지 않는다", () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(query([analysis({ nutrients: [] })]));
    render(<DogFeedAnalysis dogId="d1" />);
    expect(screen.queryByText("영양 성분")).not.toBeInTheDocument();
  });
});

describe("DogFeedAnalysis — 삭제 2단계 확인", () => {
  beforeEach(() => {
    vi.mocked(useFeedAnalyses).mockReturnValue(query([analysis()]));
  });

  it("한 번 눌러서는 지우지 않는다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(remove.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
  });

  it("확인까지 눌러야 지운다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    await userEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(remove.mutate).toHaveBeenCalledWith("a1");
  });

  it("확인 단계에서 취소하면 삭제 버튼으로 돌아간다", async () => {
    render(<DogFeedAnalysis dogId="d1" />);
    await userEvent.click(screen.getByRole("button", { name: "삭제" }));
    await userEvent.click(screen.getByRole("button", { name: "취소" }));

    expect(remove.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("확인 단계는 그 카드에만 열린다", async () => {
    vi.mocked(useFeedAnalyses).mockReturnValue(query([analysis(), analysis({ id: "a2" })]));
    render(<DogFeedAnalysis dogId="d1" />);

    await userEvent.click(screen.getAllByRole("button", { name: "삭제" })[0]);
    expect(screen.getAllByRole("button", { name: "확인" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "삭제" })).toHaveLength(1);
  });
});
