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
  // Zod validation
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: err.message
        },
      },
      { status: 400 }
    );
  }

  // Default / unexpected
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal Server Error",
      },
    },
    { status: 500 }
  );

  
}
