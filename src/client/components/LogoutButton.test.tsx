import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LogoutButton from "./LogoutButton";

vi.mock("./fetch/fetch", () => ({
  fetchData: vi.fn(),
}));

import { fetchData } from "./fetch/fetch";

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logout button", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls fetchData on click", async () => {
    (fetchData as any).mockResolvedValue(null);
    render(<LogoutButton />);
    
    const button = screen.getByRole("button", { name: /logout/i });
    button.click();
    
    expect(fetchData).toHaveBeenCalledWith("/auth/logout", null, "GET");
  });

  it("redirects to home page on logout when fetchData returns null", async () => {
    (fetchData as any).mockResolvedValue(null);
    const originalLocation = window.location;
    const mockLocation = { ...originalLocation, href: "" };
    Object.defineProperty(window, "location", { value: mockLocation, writable: true, configurable: true });
    
    render(<LogoutButton />);
    
    const button = screen.getByRole("button", { name: /logout/i });
    button.click();
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockLocation.href).toBe("/");
    
    // Restore original location
    Object.defineProperty(window, "location", { value: originalLocation, writable: true, configurable: true });
  });

  it("redirects to home page on logout when fetchData returns data", async () => {
    (fetchData as any).mockResolvedValue({ success: true });
    const originalLocation = window.location;
    const mockLocation = { ...originalLocation, href: "" };
    Object.defineProperty(window, "location", { value: mockLocation, writable: true, configurable: true });
    
    render(<LogoutButton />);
    
    const button = screen.getByRole("button", { name: /logout/i });
    button.click();
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockLocation.href).toBe("/");
    
    // Restore original location
    Object.defineProperty(window, "location", { value: originalLocation, writable: true, configurable: true });
  });
});
