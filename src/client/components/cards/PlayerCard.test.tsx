import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import PlayerCard from "./PlayerCard";

describe("PlayerCard", () => {
  it("renders username", () => {
    render(<PlayerCard username="TestUser" isOwner={false} status="ready" />);
    expect(screen.getByText("TestUser")).toBeInTheDocument();
  });

  it("shows OWNER badge when isOwner is true", () => {
    render(<PlayerCard username="TestUser" isOwner={true} status="ready" />);
    expect(screen.getByText("OWNER")).toBeInTheDocument();
  });

  it("does not show OWNER badge when isOwner is false", () => {
    render(<PlayerCard username="TestUser" isOwner={false} status="ready" />);
    expect(screen.queryByText("OWNER")).not.toBeInTheDocument();
  });

  it("shows ready status in green", () => {
    render(<PlayerCard username="TestUser" isOwner={false} status="ready" />);
    const statusSpan = screen.getByText("ready");
    expect(statusSpan).toHaveStyle({ color: "rgb(0, 128, 0)" });
  });

  it("shows not-ready status in orange", () => {
    render(<PlayerCard username="TestUser" isOwner={false} status="not-ready" />);
    const statusSpan = screen.getByText("not-ready");
    expect(statusSpan).toHaveStyle({ color: "rgb(255, 165, 0)" });
  });

  it("renders Ready button when onReady is provided", () => {
    render(
      <PlayerCard
        username="TestUser"
        isOwner={false}
        status="not-ready"
        onReady={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /ready/i })).toBeInTheDocument();
  });

  it("renders Unready button when status is ready", () => {
    render(
      <PlayerCard
        username="TestUser"
        isOwner={false}
        status="ready"
        onReady={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /unready/i })).toBeInTheDocument();
  });

  it("calls onReady when Ready button clicked", async () => {
    const mockOnReady = vi.fn();
    render(
      <PlayerCard
        username="TestUser"
        isOwner={false}
        status="not-ready"
        onReady={mockOnReady}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /ready/i }));
    expect(mockOnReady).toHaveBeenCalled();
  });

  it("renders Leave button when onReturn is provided", () => {
    render(
      <PlayerCard
        username="TestUser"
        isOwner={false}
        status="ready"
        onReturn={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /leave/i })).toBeInTheDocument();
  });

  it("calls onReturn when Leave button clicked", async () => {
    const mockOnReturn = vi.fn();
    render(
      <PlayerCard
        username="TestUser"
        isOwner={false}
        status="ready"
        onReturn={mockOnReturn}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect(mockOnReturn).toHaveBeenCalled();
  });
});