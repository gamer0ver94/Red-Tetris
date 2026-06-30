import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import { socket } from "../socket/socket";

vi.mock("../socket/socket", () => ({
  socket: {
    auth: {},
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("../hooks/reduxHooks", () => ({
  useAppSelector: vi.fn((selector: any) =>
    selector({
      user: {
        username: "Alice",
        csrf_token: "token-123",
      },
    }),
  ),
  useAppDispatch: () => vi.fn(),
}));

vi.mock("../components/fetch/fetch", () => ({
  fetchData: vi.fn(() =>
    Promise.resolve({
      username: "Alice",
      csrf_token: "token-123",
    }),
  ),
  fetchDataJson: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          game_id: "game-1",
        }),
    }),
  ),
}));

vi.mock("../conf", () => ({
  config: {
    authMe: "/auth/me",
    createLobby: "/game/create",
    joinLobby: "/game/join",
  },
}));

vi.mock("../Types/Routes", () => ({
  ROUTES: {
    LOBBY: "/lobby",
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome text", () => {
    renderPage();
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  it("connects socket on load", async () => {
    renderPage();

    await waitFor(() => {
      expect(socket.connect).toHaveBeenCalled();
    });
  });

  it("creates lobby when clicking Create", async () => {
    renderPage();

    const btn = screen.getByRole("button", { name: /create/i });
    fireEvent.click(btn);

    expect(btn).toBeInTheDocument();
  });

  it("joins lobby when clicking Join", async () => {
    renderPage();

    const input = screen.getByPlaceholderText("game_id");
    fireEvent.change(input, { target: { value: "game-123" } });

    const btn = screen.getByRole("button", { name: /join/i });
    fireEvent.click(btn);

    expect(input).toBeInTheDocument();
  });
});
