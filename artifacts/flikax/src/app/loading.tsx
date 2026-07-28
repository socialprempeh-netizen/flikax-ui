// Root loading.tsx — causes Next.js to flush 200 response headers immediately
// via React streaming while the page shell compiles in the background.
// This is critical for the proxy health check: without it, the first GET /
// is held open until the full page compiles (~9s cold), which causes the
// platform proxy to time out and return 502 before Next.js responds.
export default function RootLoading() {
  return null;
}
