import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NextPieces from "./NextPieces";

describe("NextPieces", () => {
  it("returns null when nextPieces is null", () => {
    const { container } = render(<NextPieces nextPieces={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when nextPieces is empty array", () => {
    const { container } = render(<NextPieces nextPieces={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders next pieces label", () => {
    render(<NextPieces nextPieces={["I", "J", "L"]} />);
    expect(screen.getByText("Next Pieces")).toBeInTheDocument();
  });

  it("renders up to 3 pieces", () => {
    render(<NextPieces nextPieces={["I", "J", "L", "O", "T"]} />);
    const labels = screen.getAllByText(/^[1-3]$/);
    expect(labels.length).toBe(3);
  });

  it("renders piece shapes correctly", () => {
    render(<NextPieces nextPieces={["I"]} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders different piece types", () => {
    render(<NextPieces nextPieces={["I", "J", "L", "O", "S", "T", "Z"]} />);
    expect(screen.getByText("Next Pieces")).toBeInTheDocument();
  });
});