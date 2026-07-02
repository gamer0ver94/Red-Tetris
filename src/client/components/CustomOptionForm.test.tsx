import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import CustomOptionForm from "./CustomOptionForm";
import type { GameOptions } from "./CustomOptionForm";

const defaultOptions: GameOptions = {
  grid: {
    width: 10,
    height: 10,
    invisible: true,
    revealOnClearMs: 15,
    showLockHighlight: true,
  },
  pieces: {
    randomSequence: true,
    sharedSequence: true,
    allowHold: true,
    nextPreviewCount: 10,
  },
  gravity: {
    tickMs: 0,
    lockDelayMs: 0,
    maxLock: 0,
    softDropMultiplier: 0,
    fallAfterClear: true,
    speedOnLock: true,
  },
  garbage: {
    enabled: true,
    canClear: true,
    ratio: 0,
    clearCreateGarbage: true,
  },
  scoring: {
    enabled: true,
    backToBackBonus: true,
  },
  win: {
    condition: "survival",
    limit: null,
  },
  multiplayer: {
    enabled: true,
    maxPlayers: null,
    seeOpponents: "full",
  },
};

describe("CustomOptionForm", () => {
  it("renders all sections", () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    expect(screen.getByRole("heading", { name: "grid" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "pieces" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "gravity" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "garbage" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "scoring" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "win" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "multiplayer" })).toBeInTheDocument();
  });

  it("renders boolean fields as checkboxes", () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("renders number fields as number inputs", () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    const numberInputs = screen.getAllByRole("spinbutton");
    expect(numberInputs.length).toBeGreaterThan(0);
  });

  it("updates boolean option when checkbox clicked", async () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);
    expect(mockSetOptions).toHaveBeenCalled();
  });

  it("updates number option when input changed", async () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    const numberInputs = screen.getAllByRole("spinbutton");
    await userEvent.clear(numberInputs[0]);
    await userEvent.type(numberInputs[0], "20");
    expect(mockSetOptions).toHaveBeenCalled();
  });

  it("renders seeOpponents select for multiplayer section", () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    // Use getAllByRole since there are multiple comboboxes (seeOpponents and condition)
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("changes seeOpponents value", async () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    // Get the second combobox (seeOpponents in multiplayer section)
    // First combobox is win.condition, second is multiplayer.seeOpponents
    const selects = screen.getAllByRole("combobox");
    const select = selects[1];
    await userEvent.selectOptions(select, "grid");
    expect(mockSetOptions).toHaveBeenCalled();
  });

  it("changes win condition value", async () => {
    const mockSetOptions = vi.fn();
    render(
      <CustomOptionForm options={defaultOptions} setOptions={mockSetOptions} />
    );
    // Get the first combobox (win.condition)
    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    await userEvent.selectOptions(select, "score");
    expect(mockSetOptions).toHaveBeenCalled();
  });
});
