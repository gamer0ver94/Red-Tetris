import { expect } from 'vitest';

export function expect_function_pure<Args extends unknown[], Result>(
    fn: (...args: Args) => Result,
    ...args: Args
): Result {
    const original_args = clone_test_value(args);
    const first_result = fn(...clone_test_value(args));

    for (let i = 0; i < 10; i += 1) {
        const call_args = clone_test_value(args);
        const result = fn(...call_args);

        expect(result).toEqual(first_result);
        expect(call_args).toEqual(original_args);
    }

    expect(args).toEqual(original_args);
    return first_result;
}

export function clone_test_value<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}
