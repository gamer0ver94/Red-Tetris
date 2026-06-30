import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import LobbyPage from "../pages/LobbyPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const socket = {
  auth: {},
  connected: false,
  emit: vi.fn(),
  connect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  onAny: vi.fn(),
  offAny: vi.fn(),
};

vi.mock("../socket/socketContext", () => ({
  socketContext: {
    Provider: ({ children }: any) => children,
  },
}));

vi.mock("../hooks/reduxHooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: any) =>
    selector({
      user: {
        username: "Alice",
        csrf_token: "token",
      },
      lobby: { readyByUsername: {} },
    }),
}));

vi.mock("../components/fetch/fetch", () => ({
  fetchData: vi.fn(() =>
    Promise.resolve({
      username: "Alice",
      csrf_token: "token",
    })
  ),
}));

vi.mock("../conf", () => ({
  config: {
    authMe: "/auth/me",
  },
}));

vi.mock("../Types/Routes", () => ({
  ROUTES: {
    GAME: "/game",
  },
}));

vi.mock("../components/cards/PlayerCard", () => ({
  default: ({ username }: any) => <div>{username}</div>,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: () => socket,
  };
});

describe("LobbyPage - extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });



  it("starts game when all players are ready and owner", async () => {
    render(<LobbyPage />);

    const joinHandler = (socket.on as any).mock.calls.find(
      (c: any[]) => c[0] === "lobby:join:update"
    )?.[1];

    await act(async () => {
      joinHandler?.({
        owner_name: "Alice",
        players: [
          { username: "Alice", status: "ready", is_owner: true },
          { username: "Bob", status: "ready", is_owner: false },
        ],
      });
    });

    fireEventClickStart();

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith("lobby:start");
    });
  });

  it("does not start game when user is not owner", async () => {
    render(<LobbyPage />);

    const joinHandler = (socket.on as any).mock.calls.find(
      (c: any[]) => c[0] === "lobby:join:update"
    )?.[1];

    await act(async () => {
      joinHandler?.({
        owner_name: "Bob",
        players: [
          { username: "Alice", status: "ready", is_owner: false },
          { username: "Bob", status: "ready", is_owner: true },
        ],
      });
    });

    fireEventClickStart();

    expect(socket.emit).not.toHaveBeenCalledWith("lobby:start");
  });

  function fireEventClickStart() {
    const btn = screen.getByRole("button", { name: /start game/i });
    btn.click();
  }

  it("navigates to GAME on lobby:start:success", async () => {
    render(<LobbyPage />);

    const handler = (socket.on as any).mock.calls.find(
      (c: any[]) => c[0] === "lobby:start:success"
    )?.[1];
    await act(async () => {
      handler?.();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });
});



