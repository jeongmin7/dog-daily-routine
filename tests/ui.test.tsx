import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Btn, Field } from "@/components/ui";

describe("Btn", () => {
  it("loading이면 loadingText를 보여주고 버튼을 잠근다", () => {
    render(
      <Btn loading loadingText="저장 중…">
        저장
      </Btn>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("저장 중…");
    expect(btn).not.toHaveTextContent("저장하기");
  });

  it("loading이지만 loadingText가 없으면 children을 그대로 쓴다", () => {
    render(<Btn loading>저장</Btn>);
    expect(screen.getByRole("button")).toHaveTextContent("저장");
  });

  it("disabled면 클릭이 핸들러까지 가지 않는다", async () => {
    const onClick = vi.fn();
    render(
      <Btn disabled onClick={onClick}>
        저장
      </Btn>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("평소엔 클릭이 핸들러로 간다", async () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>저장</Btn>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("variant/size/block이 클래스에 반영된다", () => {
    render(
      <Btn variant="destructive" size="sm" block>
        삭제
      </Btn>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("btn", "btn-destructive", "btn-sm", "btn-block");
  });
});

describe("Field", () => {
  it("label을 htmlFor로 입력과 연결한다", () => {
    render(
      <Field label="이름" htmlFor="f-name">
        <input id="f-name" />
      </Field>,
    );
    expect(screen.getByLabelText("이름")).toBeInTheDocument();
  });

  it("error가 있을 때만 에러 문구를 그린다", () => {
    const { rerender } = render(
      <Field label="이름">
        <input />
      </Field>,
    );
    expect(screen.queryByText("필수입니다")).not.toBeInTheDocument();

    rerender(
      <Field label="이름" error="필수입니다">
        <input />
      </Field>,
    );
    expect(screen.getByText("필수입니다")).toBeInTheDocument();
  });
});
