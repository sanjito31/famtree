import { NextResponse } from "next/server";
import { z } from "zod";

type ApiErrorBody = {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};

export function toErrorResponse(err: unknown): NextResponse<ApiErrorBody> {
    
    // Standard AppError with HTTP codes
    if (err instanceof AppError) {
        return err.toNextResponse()
    } 

    // Zod validation Error
    if (err instanceof z.ZodError) {
        return NextResponse.json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request body."
            }},
            { status: 400 }
        )
    }

    // Fallback error response

    let detail = "NA"

    if (err instanceof Error) {
        detail = err.message
    }

    return NextResponse.json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Unknown error occurred.",
            details: detail
        }},
        { status: 500 }
    )
}


/*
 * 
 * Custom Error class
 * 
 */
export class AppError extends Error {

    public readonly code: string;
    public readonly statusCode: number

    constructor(
        message: string,
        status: HttpStatusValue = HttpStatus.INTERNAL_ERROR
    ) {
        super(message)
        this.code = status.code
        this.statusCode = status.statusCode
    }

    toNextResponse(): NextResponse<ApiErrorBody> {
        return NextResponse.json(
            { 
                error: {
                    code: this.code,
                    message: this.message,
                }
            },
            { status: this.statusCode }
        )
    }

}

export const HttpStatus = {
    BAD_REQUEST: { statusCode: 400, code: "BAD_REQUEST" },
    UNAUTHORIZED: { statusCode: 401, code: "UNAUTHORIZED" },
    FORBIDDEN: { statusCode: 403, code: "FORBIDDEN" },
    NOT_FOUND: { statusCode: 404, code: "NOT_FOUND" },
    CONFLICT: { statusCode: 409, code: "CONFLICT" },
    VALIDATION_ERROR: { statusCode: 422, code: "VALIDATION_ERROR" },
    INTERNAL_ERROR: { statusCode: 500, code: "INTERNAL_ERROR" },
} as const;

type HttpStatusValue = (typeof HttpStatus)[keyof typeof HttpStatus];

