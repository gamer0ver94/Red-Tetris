import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";


vi.mock("./HistoryCard", () => ({
  default: ({ scope, title }: any) => (
    <div data-testid="history-card">
      {scope} - {title}
    </div>
  ),
}));


import HistorySection from "./HistorySection";

describe("HistorySection", () => {
  it("renders default state (me history)", () => {
    render(<HistorySection />);

    expect(screen.getByText("Match History")).toBeInTheDocument();

    expect(screen.getByTestId("history-card")).toHaveTextContent(
      "me - My Matches"
    );
  });

  it("switches to all history when clicking All Histories", () => {
    render(<HistorySection />);

    fireEvent.click(screen.getByText("All Histories"));

    expect(screen.getByTestId("history-card")).toHaveTextContent(
      "all - Top scores (All Matches)"
    );
  });

  it("switches back to me history when clicking My History", () => {
    render(<HistorySection />);

    fireEvent.click(screen.getByText("All Histories"));
    fireEvent.click(screen.getByText("My History"));

    expect(screen.getByTestId("history-card")).toHaveTextContent(
      "me - My Matches"
    );
  });

  it("buttons toggle selected class correctly", () => {
    render(<HistorySection />);

    const meBtn = screen.getByText("My History");
    const allBtn = screen.getByText("All Histories");

    expect(meBtn.className).toContain("history-selected");
    expect(allBtn.className).not.toContain("history-selected");

    fireEvent.click(allBtn);

    expect(allBtn.className).toContain("history-selected");
    expect(meBtn.className).not.toContain("history-selected");
  });
});