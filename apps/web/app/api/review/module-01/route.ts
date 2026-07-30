import reviewModule from "../../../../content-review/module-01.json";

export const dynamic = "force-dynamic";

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function GET(request: Request) {
  const hostname = new URL(request.url).hostname;
  const enabled = process.env.MODULE_01_REVIEW_MODE === "enabled";

  if (!enabled || !localHosts.has(hostname)) {
    return Response.json(
      { error: "review mode unavailable" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(reviewModule, {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}
