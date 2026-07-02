import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useEffect } from "react";


const socketMock = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  connect: vi.fn(),
  emit: vi.fn(),
  connected: false,
}));


vi.mock("../socket/socketContext", async () => {
  const React = await import("react");

  return {
    socketContext: React.createContext(socketMock),
  };
});


vi.mock("../hooks/reduxHooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (fn: any) =>
    fn({
      user: { username: "Alice" },
    }),
}));


const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));


vi.mock("../components/game/Board", () => ({
  default: () => <div data-testid="board" />,
}));

vi.mock("../components/game/InputHandler", () => ({
  InputHandler: () => <div data-testid="input" />,
}));


import GamePage from "./GamePage";


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

  it("navigates to lobby on quit", () => {
    render(<GamePage />);
    
    const quitButton = screen.getByRole("button", { name: /quit/i });
    quitButton.click();
    
    expect(socketMock.emit).toHaveBeenCalledWith("lobby:leave");
    expect(navigateMock).toHaveBeenCalledWith("/lobby");
  });

  it("navigates to score page on win", async () => {
    render(<GamePage />);
    
    const winHandler = (socketMock.on as any).mock.calls.find(
      (c: any[]) => c[0] === "game:win"
    )?.[1];
    
    await act(async () => {
      winHandler?.();
    });
    
    expect(navigateMock).toHaveBeenCalledWith("/score", expect.objectContaining({
      state: expect.objectContaining({
        result: "win",
      }),
    }));
  });

  it("navigates to score page on lose", async () => {
    render(<GamePage />);
    
    const loseHandler = (socketMock.on as any).mock.calls.find(
      (c: any[]) => c[0] === "game:lose"
    )?.[1];
    
    await act(async () => {
      loseHandler?.();
    });
    
    expect(navigateMock).toHaveBeenCalledWith("/score", expect.objectContaining({
      state: expect.objectContaining({
        result: "lose",
      }),
    }));
  });

  it("renders opponents when provided", async () => {
    (socketMock as any).connected = true;
    
    render(<GamePage />);
    
    const renderHandler = (socketMock.on as any).mock.calls.find(
      (c: any[]) => c[0] === "game:render"
    )?.[1];
    
    const mockPayload = {
      self: {
        board: [["I", ".", "."], ["I", "I", "I"]],
        score: 100,
        next_piece_types: ["J", "L"],
      },
      opponents: {
        Bob: {
          board: [["O", "O"], ["O", "O"]],
          score: 50,
        },
      },
    };
    
    await act(async () => {
      renderHandler?.(mockPayload);
    });
    
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders game outcome when game ends", async () => {
    render(<GamePage />);
    
    const winHandler = (socketMock.on as any).mock.calls.find(
      (c: any[]) => c[0] === "game:win"
    )?.[1];
    
    await act(async () => {
      winHandler?.();
    });
    
    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
  });
});
