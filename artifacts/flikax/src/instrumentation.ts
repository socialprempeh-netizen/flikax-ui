// instrumentation.ts — runs once at server startup (before any request).
// Pre-warms the homepage compilation so the cold-compile cost is paid here
// rather than on the first incoming request (which would stall the proxy
// health check and cause a 502 timeout).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const port = process.env.PORT ?? "3000";
    // Fire-and-forget: kick off a homepage request so Next.js compiles it
    // while the server is warming up. Errors are intentionally ignored —
    // this is purely an optimistic pre-warm, not a required startup step.
    setTimeout(() => {
      fetch(`http://localhost:${port}/`).catch(() => {});
    }, 500);
  }
}
