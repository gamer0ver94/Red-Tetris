import { PieceType, HoldSwapResult } from "../types/game_types.js";

type SpeedRule = {
    trigger_count: number;
    speed_ms: number;
    max_speed: number;
};

const DEFAULT_SPEED_RULE: SpeedRule = {
    trigger_count: 1,
    speed_ms: 15,
    max_speed: 100,
};

export function calculate_tick_ms(
    base: number,
    total_locks: number,
    speed_enabled: boolean,
    rule: SpeedRule = DEFAULT_SPEED_RULE,
): number {
    if (!speed_enabled || total_locks <= 0)
        return base;

    const level = Math.floor(total_locks / rule.trigger_count);
    return Math.max(rule.max_speed, base - level * rule.speed_ms);
}

export function calculate_fall_interval_ms(
    tick_ms: number,
    soft_drop: boolean,
    drop_multiplier: number,
): number {
    if (!soft_drop)
        return tick_ms;

    return tick_ms * drop_multiplier;
}

export function should_apply_gravity(
    now: number,
    last_fall_at: number,
    fall_every_ms: number,
): boolean {
    return now - last_fall_at >= fall_every_ms;
}

export function should_wait_lock_delay(
    now: number,
    touching_ground_since: number | null,
    lock_delay_ms: number,
    force_lock = false,
): boolean {
    if (force_lock)
        return false;

    if (touching_ground_since === null)
        return false;

    return now - touching_ground_since < lock_delay_ms;
}

export function can_reset_lock_delay(
    touching_ground_since: number | null,
    lock_reset_count: number,
    max_resets: number,
): boolean {
    if (touching_ground_since === null)
        return false;

    if (max_resets !== 0 && lock_reset_count >= max_resets)
        return false;

    return true;
}

export function resolve_hold_swap(
    allow_hold: boolean,
    already_held: boolean,
    current_piece: PieceType | null,
    held_piece: PieceType | null,
): HoldSwapResult {
    if (!allow_hold)
        return { success: false, reason: "NOT_ALLOWED" };

    if (already_held)
        return { success: false, reason: "ONLY_HOLD_ONCE" };

    if (!current_piece)
        return { success: false, reason: "PIECE_CANNOT_SPAWN" };

    if (!held_piece) {
        return {
            success: true,
            next_current_piece: null,
            next_hold_piece: current_piece,
            needs_next_piece: true,
        };
    }

    return {
        success: true,
        next_current_piece: held_piece,
        next_hold_piece: current_piece,
        needs_next_piece: false,
    };
}
