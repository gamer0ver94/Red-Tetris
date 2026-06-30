import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchData, fetchDataJson } from "./fetch";

vi.mock("../../conf", () => ({
  config: {
    url: "http://localhost:1800",
    register: "/register",
    createLobby: "/game/create",
    authMe: "/auth/me",
    joinLobby: "/game/join",
  },
}));

describe("fetchData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn();
  });

  it("returns parsed JSON when the request succeeds", async () => {
    const mockData = { username: "test", csrf_token: "token123" };
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchData("/register", { username: "test" }, "POST");
    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:1800/register",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("calls fetch with the correct options", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await fetchData("/register", { username: "test" }, "POST");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].credentials).toBe("include");
  });

  it("returns null when response.ok is false", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const result = await fetchData("/register", { username: "test" }, "POST");
    expect(result).toBeNull();
  });

  it("returns null if fetch throws", async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error("Network error"));

    const result = await fetchData("/register", { username: "test" }, "POST");
    expect(result).toBeNull();
  });

  it("does not send a body when object is null", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await fetchData("/auth/me", null, "GET");
    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[1].body).toBeUndefined();
  });
});

describe("fetchDataJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn();
  });

  it("sends the csrf token", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await fetchDataJson("/game/create", { move: "left" }, "abc123");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:1800/game/create",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "abc123",
        },
      })
    );
  });

  it("returns the response object", async () => {
    const mockResponse = { ok: true };
    (globalThis.fetch as any).mockResolvedValue(mockResponse);

    const result = await fetchDataJson("/game/create", { move: "left" }, "abc123");
    expect(result).toBe(mockResponse);
  });
});