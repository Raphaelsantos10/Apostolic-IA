import { NextResponse } from "next/server";
import {
  buildHealthPayload,
  resolveHealthRequestId
} from "../../../lib/resilience.mjs";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requestId = resolveHealthRequestId(
    request.headers.get("x-request-id")
  );
  const response = NextResponse.json(buildHealthPayload(), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("x-request-id", requestId);
  return response;
}
