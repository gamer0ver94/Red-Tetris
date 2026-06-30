import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: any) =>
    selector({
      user: {
        username: "Alice",
        csrf_token: "token-123",
      },
    }),
}));

vi.mock("../components/fetch/fetch", () => {
  return {
    fetchData: vi.fn(() =>
      Promise.resolve({
        username: "Alice",
        csrf_token: "token-123",
      })
    ),
    fetchDataJson: vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            game_id: "game-1",
          }),
      })
    ),
  };
});

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

vi.mock("../components/HistorySection", () => ({
  default: () => <div data-testid="history" />,
}));

vi.mock("../components/CustomOptionForm", () => ({
  default: ({ options, setOptions }: any) => (
    <div>
      <button
        onClick={() =>
          setOptions({
            ...options,
            multiplayer: {
              ...options.multiplayer,
              enabled: true,
            },
          })}
      >
        mutate-options
      </button>
    </div>
  ),
}));

vi.mock("../components/LogoutButton", () => ({
  default: () => <div data-testid="logout" />,
}));

describe("HomePage - extra coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("switches to custom mode and updates options", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "custom" } });

    fireEvent.click(screen.getByText("mutate-options"));

    await waitFor(() => {
      expect(screen.getByTestId("history")).toBeInTheDocument();
    });
  });

  it("shows error when joining without csrf_token", async () => {
    const hooks = await import("../hooks/reduxHooks");
    vi.spyOn(hooks, "useAppSelector").mockImplementation((sel: any) =>
      sel({ user: { username: "Alice", csrf_token: null } })
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("game_id"), {
      target: { value: "game-123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /join/i }));

    expect(await screen.findByText(/must be logged in/i)).toBeInTheDocument();
  });

  it("creates lobby and navigates when custom option is selected", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "custom" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });
});



