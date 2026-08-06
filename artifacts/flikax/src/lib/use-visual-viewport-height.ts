"use client";

import { useEffect, useState } from "react";

// Tracks window.visualViewport's height in px (falling back to
// window.innerHeight where the API doesn't exist). Mobile browsers shrink
// the *visual* viewport, not the layout viewport, when the on-screen
// keyboard opens -- CSS `dvh` tracks this same value in modern browsers,
// but support is inconsistent in the in-app webviews (Facebook/Instagram
// browsers, older Android WebViews) that a chat-heavy classifieds site's
// mobile traffic actually hits. Reading visualViewport directly and
// applying it as an explicit pixel height is the more robust fallback
// those environments need; see its callers for how the two are combined.
export function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    function update() {
      setHeight(vv ? vv.height : window.innerHeight);
    }
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
