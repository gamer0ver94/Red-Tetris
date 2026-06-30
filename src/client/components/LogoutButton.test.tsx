import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import LogoutButton from "./LogoutButton";

const mockFetchData = vi.hoisted(() => vi.fn());

vi.mock("./fetch/fetch", () => ({
  fetchData: mockFetchData,
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logout button", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls fetchData on click", async () => {
    mockFetchData.mockResolvedValue(null);
    render(<LogoutButton />);
    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockFetchData).toHaveBeenCalledWith("/auth/logout", null, "GET");
  });

  it("redirects to home on logout", async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" } as any;

    mockFetchData.mockResolvedValue(null);
    render(<LogoutButton />);
    await userEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(window.location.href).toBe("/");

    window.location = originalLocation;
  });
});