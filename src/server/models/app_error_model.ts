import { codeType, type CodeType } from "../types/error_code_types.ts";

export class AppError extends Error{
    public readonly code:CodeType;
    public readonly status_code:number;
    public readonly details?:unknown;


    constructor(
        code:CodeType,
        status_code=500,
        details?:unknown,
    ){
        super(codeType[code]);
        this.name = 'AppError';
        this.code = code;
        this.status_code = status_code;
        this.details= details;
    }
}