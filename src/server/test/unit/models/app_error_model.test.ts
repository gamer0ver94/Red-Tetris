import { describe, expect, it } from 'vitest';

import { AppError } from '../../../models/app_error_model.js';
import { codeType } from '../../../types/error_code_types.js';

describe('AppError', () => {
    it('uses the mapped message and default status code', () => {
        const error = new AppError('PLAYER_NOT_FOUND');

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('AppError');
        expect(error.code).toBe('PLAYER_NOT_FOUND');
        expect(error.message).toBe(codeType.PLAYER_NOT_FOUND);
        expect(error.status_code).toBe(500);
        expect(error.details).toBeUndefined();
    });

    it('stores custom status code and details', () => {
        const details = { player_id: 'missing-player' };
        const error = new AppError('NOT_OWNER', 403, details);

        expect(error.code).toBe('NOT_OWNER');
        expect(error.message).toBe(codeType.NOT_OWNER);
        expect(error.status_code).toBe(403);
        expect(error.details).toBe(details);
    });
});
