import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LobbyPage from "../pages/LobbyPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../hooks/reduxHooks", () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: any) =>
    selector({
      user: {
        username: "Alice",
        csrf_token: "token",
      },
      lobby: {
        readyByUsername: {},
      },
    }),
}));

vi.mock("../components/fetch/fetch", () => ({
  fetchData: vi.fn().mockResolvedValue({
    username: "Alice",
    csrf_token: "token",
  }),
}));

export const socket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  connected: false,
  auth: {},
  onAny: vi.fn(),
  offAny: vi.fn(),
};

vi.mock("../socket/socketContext", () => ({
  socketContext: {
    Provider: ({ children }: any) => children,
  },
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: () => socket,
  };
});
describe("LobbyPage - final coverage suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });




  it("sets socket auth on load", () => {
    render(<LobbyPage />);
    expect(socket.auth).toEqual({ csrf_token: "token" });
  });

  it("handles lobby:join:update", async () => {
    render(<LobbyPage />);

    const handler = socket.on.mock.calls.find(
      (c) => c[0] === "lobby:join:update"
    )?.[1];

    await act(async () => {
      handler?.({
        owner_name: "Alice",
        players: [
          { username: "Alice", status: "ready", is_owner: true },
          { username: "Bob", status: "not-ready", is_owner: false },
        ],
      });
    });

    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("handles lobby:ready:update", async () => {
    render(<LobbyPage />);

    const handler = socket.on.mock.calls.find(
      (c) => c[0] === "lobby:ready:update"
    )?.[1];

    await act(async () => {
      handler?.({
        owner_name: "Alice",
        players: [
          { username: "Alice", status: "ready", is_owner: true },
        ],
      });
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("handles lobby:leave:update", async () => {
    render(<LobbyPage />);

    const handler = socket.on.mock.calls.find(
      (c) => c[0] === "lobby:leave:update"
    )?.[1];

    await act(async () => {
      handler?.({
        username: "Bob",
        players: [
          { username: "Alice", status: "ready", is_owner: true },
        ],
      });
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("handles session:resume", async () => {
    render(<LobbyPage />);

    const handler = socket.on.mock.calls.find(
      (c) => c[0] === "session:resume"
    )?.[1];

    await act(async () => {
      handler?.({
        game: {
          game_id: "123",
        },
      });
    });

    expect(sessionStorage.getItem("game_id")).toBe("123");
  });

  it("registers onAny logger correctly", () => {
    render(<LobbyPage />);

    const call = socket.onAny.mock.calls[0];

    expect(call).toBeDefined();
  });
});
