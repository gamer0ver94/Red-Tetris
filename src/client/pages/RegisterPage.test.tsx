import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterPage from "./RegisterPage";

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockFetchData = vi.fn();

vi.mock("../hooks/reduxHooks", () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../components/fetch/fetch", () => ({
  fetchData: (...args: unknown[]) => mockFetchData(...args),
}));

vi.mock("../components/Logo", () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

vi.mock("../components/Form", () => ({
  default: () => <div data-testid="form">Form</div>,
}));

vi.mock("../assets/tetris_logo.png", () => ({
  default: "logo.png",
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logo, form and headings", async () => {
    mockFetchData.mockResolvedValue({});

    render(<RegisterPage />);

    expect(screen.getByTestId("logo")).toBeInTheDocument();
    expect(screen.getByTestId("form")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("About Project")).toBeInTheDocument();
  });

  it("dispatches username when user is logged in", async () => {
    mockFetchData.mockResolvedValue({
      username: "alice",
    });

    render(<RegisterPage />);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it("navigates to /home when csrf token exists", async () => {
    mockFetchData.mockResolvedValue({
      username: "alice",
      csrf_token: "abc123",
    });

    render(<RegisterPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  it("does not navigate when csrf token is missing", async () => {
    mockFetchData.mockResolvedValue({});

    render(<RegisterPage />);

    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});