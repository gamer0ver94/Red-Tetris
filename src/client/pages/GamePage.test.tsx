import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

/* ---------------- HOISTED SOCKET MOCK ---------------- */

const socketMock = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  connect: vi.fn(),
  connected: false,
}));

/* ---------------- SOCKET CONTEXT MOCK (VITE SAFE) ---------------- */

vi.mock("../socket/socketContext", async () => {
  const React = await import("react");

  return {
    socketContext: React.createContext(socketMock),
  };
});

/* ---------------- REDUX MOCK ---------------- */

vi.mock("../hooks/reduxHooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (fn: any) =>
    fn({
      user: { username: "Alice" },
    }),
}));

/* ---------------- ROUTER MOCK ---------------- */

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

/* ---------------- CHILD COMPONENT MOCKS ---------------- */

vi.mock("../components/game/Board", () => ({
  default: () => <div data-testid="board" />,
}));

vi.mock("../components/game/InputHandler", () => ({
  InputHandler: () => <div data-testid="input" />,
}));

/* ---------------- IMPORT COMPONENT (AFTER MOCKS) ---------------- */

import GamePage from "./GamePage";

/* ---------------- TESTS ---------------- */

describe("GamePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers socket listeners", () => {
    render(<GamePage />);

    expect(socketMock.on).toHaveBeenCalledWith(
      "game:render",
      expect.any(Function)
    );

    expect(socketMock.on).toHaveBeenCalledWith(
      "game:win",
      expect.any(Function)
    );

    expect(socketMock.on).toHaveBeenCalledWith(
      "game:lose",
      expect.any(Function)
    );
  });

  it("connects socket if not connected", () => {
    render(<GamePage />);

    expect(socketMock.connect).toHaveBeenCalled();
  });

  it("renders input handler while game is active", () => {
    render(<GamePage />);

    expect(screen.getByTestId("input")).toBeInTheDocument();
  });

  it("cleans up socket listeners on unmount", () => {
    const { unmount } = render(<GamePage />);

    unmount();

    expect(socketMock.off).toHaveBeenCalled();
  });
});