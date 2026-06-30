import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import Logo from "./Logo";

describe("Logo", () => {
  it("renders image with correct src", () => {
    render(<Logo text="" imagePath="/test-logo.png" />);
    const img = document.querySelector("img");
    expect(img).toHaveAttribute("src", "/test-logo.png");
  });

  it("renders with empty alt text", () => {
    render(<Logo text="" imagePath="/test-logo.png" />);
    const img = document.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
  });

  it("applies neon class", () => {
    render(<Logo text="" imagePath="/test-logo.png" />);
    const img = document.querySelector("img");
    expect(img).toHaveClass("neon");
  });
});