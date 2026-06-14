import { NextResponse } from "next/server";

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status },
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status },
  );
}
