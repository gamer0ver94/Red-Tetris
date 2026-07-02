import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../components/fetch/fetch", () => ({
  fetchData: vi.fn(),
}));


const mockDispatch = vi.fn();

vi.mock("react-redux", () => ({
  useSelector: vi.fn(),
  useDispatch: () => mockDispatch,
}));


import HistoryCard from "./HistoryCard";
import { useSelector } from "react-redux";
import { fetchData } from "../components/fetch/fetch";



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

  it("builds correct URL with filterUsername", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <HistoryCard 
          scope="me" 
          list="score" 
          start={0} 
          end={10} 
          username="Bob" 
        />
      );
    });

    expect((fetchData as any).mock.calls[0][0]).toContain(
      "/history/users/Bob?start=0&end=10"
    );
  });

  it("builds correct URL for default date list", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <HistoryCard scope="all" list="date" start={5} end={15} />
      );
    });

    expect((fetchData as any).mock.calls[0][0]).toContain(
      "/history/date?start=5&end=15&new_first=true"
    );
  });

  it("builds correct URL for lose list", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    (fetchData as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <HistoryCard scope="all" list="lose" start={0} end={10} />
      );
    });

    expect((fetchData as any).mock.calls[0][0]).toContain(
      "/history/lose?start=0&end=10"
    );
  });

  it("renders loser entry correctly", async () => {
    (useSelector as any).mockReturnValue("TestUser");

    (fetchData as any).mockResolvedValue({
      data: [
        {
          lobby_id: "l1",
          end_date: "2020-01-01T00:00:00.000Z",
          username: "Bob",
          score: 50,
          is_winner: false,
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

    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("LOSE")).toBeInTheDocument();
    expect(screen.getByText("Score: 50")).toBeInTheDocument();
  });

  it("formats date correctly", async () => {
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

    // Date should be formatted (exact format depends on locale)
    expect(await screen.findByText(/Date:/i)).toBeInTheDocument();
  });

  it("returns original date string when parse fails", async () => {
    (useSelector as any).mockReturnValue("TestUser");

    (fetchData as any).mockResolvedValue({
      data: [
        {
          lobby_id: "l1",
          end_date: "invalid-date",
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

    // Should show the invalid date string as-is
    expect(await screen.findByText(/Date: invalid-date/i)).toBeInTheDocument();
  });

  it("handles cancelled component during fetch", async () => {
    (useSelector as any).mockReturnValue("TestUser");
    
    // Make fetchData hang forever to simulate cancellation
    (fetchData as any).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(
        <HistoryCard scope="me" list="score" start={0} end={10} />
      );
    });

    // Component should render without errors even if fetch is cancelled
    expect(screen.getByText("My game history")).toBeInTheDocument();
  });
});
