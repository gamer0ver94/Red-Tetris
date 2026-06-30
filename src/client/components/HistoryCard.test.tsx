import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../components/fetch/fetch", () => ({
  fetchData: vi.fn(),
}));

/* ---------------- MOCKS ---------------- */

const mockDispatch = vi.fn();

vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
  useDispatch: () => mockDispatch,
}));

/* ---------------- IMPORT AFTER MOCK ---------------- */

import HistoryCard from "./HistoryCard";
import { useSelector } from "react-redux";
import { fetchData } from "../components/fetch/fetch";


/* ---------------- TESTS ---------------- */

describe("HistoryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <HistoryCard
          scope="me"
          list="score"
          title="My History"
          start={0}
          end={10}
        />
      );
    });

    expect(screen.getByText(/Loading\.\.\.|0 games/i)).toBeInTheDocument();
  });


  it("renders correct title for me scope", async () => {
    (useSelector as any).mockReturnValue("TestUser");

    await act(async () => {
      render(<HistoryCard scope="me" list="score" start={0} end={10} />);
    });

    expect(screen.getByText("My game history")).toBeInTheDocument();
  });

  it("renders correct title for all scope", async () => {
    (useSelector as any).mockReturnValue("TestUser");

    await act(async () => {
      render(<HistoryCard scope="all" list="score" start={0} end={10} />);
    });

    expect(screen.getByText(/Top games \(score\)/i)).toBeInTheDocument();
  });

  it("builds correct URL for scope=me and renders entries", async () => {
    (useSelector as any).mockReturnValue("TestUser");

    (fetchData as any).mockResolvedValue({
      data: [
        {
          lobby_id: "l1",
          end_date: "2020-01-01T00:00:00.000Z",
          username: "Bob",
          score: 123,
          is_winner: true,
          game_mode: "classic",
          total_time: "00:01:23",
        },
      ],
    });

    await act(async () => {
      render(
        <HistoryCard scope="me" list="score" start={0} end={10} />
      );
    });

    expect(fetchData).toHaveBeenCalled();
    expect((fetchData as any).mock.calls[0][0]).toContain(
      "/history/me?start=0&end=10"
    );


    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("WIN")).toBeInTheDocument();
    expect(screen.getByText("Score: 123")).toBeInTheDocument();
    expect(screen.getByText(/Mode: classic/i)).toBeInTheDocument();
    expect(screen.getByText(/Lobby: l1/i)).toBeInTheDocument();
  });

  it("builds correct URL for scope=all list=win", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <HistoryCard scope="all" list="win" start={2} end={5} />
      );
    });

    expect((fetchData as any).mock.calls[0][0]).toContain(
      "/history/win?start=2&end=5"
    );
  });

  it("renders empty state when fetch returns empty array", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <HistoryCard scope="all" list="score" start={0} end={10} />
      );
    });

    expect(await screen.findByText(/No history yet\./i)).toBeInTheDocument();
  });

  it("renders error state when fetch throws", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockRejectedValue(new Error("boom"));

    await act(async () => {
      render(
        <HistoryCard scope="all" list="score" start={0} end={10} />
      );
    });

    expect(await screen.findByText(/Failed to load history/i)).toBeInTheDocument();
  });
});
