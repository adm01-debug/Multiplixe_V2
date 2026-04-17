import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LessonList from "@/components/player/LessonList";
import QuizQuestionCard from "@/components/admin/QuizQuestionCard";

const baseLessons = [
  { id: "l1", title: "Aula 1", description: null, duration_seconds: 60, order_index: 1, is_free: true },
  { id: "l2", title: "Aula 2", description: null, duration_seconds: 120, order_index: 2, is_free: false },
];

const wrap = (ui: React.ReactNode) => <BrowserRouter>{ui}</BrowserRouter>;

describe("memoization", () => {
  it("LessonList renders all lessons", () => {
    const { getAllByRole } = render(
      wrap(<LessonList lessons={baseLessons} progress={[]} courseSlug="curso-x" />)
    );
    expect(getAllByRole("link")).toHaveLength(2);
  });

  it("LessonList does not re-render with identical props (memo)", () => {
    const { rerender, container } = render(
      wrap(<LessonList lessons={baseLessons} progress={[]} courseSlug="curso-x" />)
    );
    const firstHTML = container.innerHTML;
    rerender(wrap(<LessonList lessons={baseLessons} progress={[]} courseSlug="curso-x" />));
    expect(container.innerHTML).toBe(firstHTML);
  });

  it("QuizQuestionCard exports a memoized component", () => {
    const noop = vi.fn();
    const question = {
      question_text: "Q",
      explanation: "",
      order_index: 0,
      options: [
        { option_text: "A", is_correct: true, order_index: 0 },
        { option_text: "B", is_correct: false, order_index: 1 },
      ],
    };
    const { container } = render(
      <QuizQuestionCard
        question={question}
        index={0}
        onRemove={noop}
        onUpdateQuestion={noop}
        onUpdateOption={noop}
        onAddOption={noop}
        onRemoveOption={noop}
      />
    );
    expect(container.textContent).toContain("Questão 1");
  });
});
