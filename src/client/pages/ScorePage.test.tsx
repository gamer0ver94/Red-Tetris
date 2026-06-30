import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect} from "vitest";
import { vi } from "vitest";
import ScorePage from "../pages/ScorePage";

vi.mock("../components/game/Board", () => ({
  default: () => <div data-testid="board">GameBoard</div>,
}));

vi.mock("../components/cards/playerscorecard/PlayerScoreCard", () => ({
  default: ({ finishScore }: any) => (
    <div data-testid="score-card">{finishScore}</div>
  ),
}));

function renderWithState(state: any) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/score", state }]}>
      <Routes>
        <Route path="/score" element={<ScorePage />} />
        <Route path="/lobby" element={<div>Lobby Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ScorePage", () => {
  it("renders score from location state", () => {
    renderWithState({
      score: 120,
      result: "win",
      matchHistory: [],
    });

    expect(screen.getByTestId("score-card")).toHaveTextContent("120");
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });

  it("uses default state when location.state is missing (branch coverage)", () => {
    renderWithState(undefined);

    expect(screen.getByTestId("score-card")).toHaveTextContent("0");
  });

  it("navigates back to lobby on button click", () => {
    renderWithState({ score: 50, result: "lose", matchHistory: [] });

    const button = screen.getByText("Return to Lobby");
    fireEvent.click(button);

    expect(screen.getByText("Lobby Page")).toBeInTheDocument();
  });
});

