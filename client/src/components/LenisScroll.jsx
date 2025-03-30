"use client";

import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

export default function LenisScroll({ children }) {
  const lenisRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Create new Lenis instance with smooth scrolling
    // Use the wrapper div as the wrapper element instead of the default (window)
    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: wrapperRef.current.querySelector(".scroll-content"),
      smooth: true,
      smoothTouch: true,
      duration: 1.1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="scroll-wrapper h-full overflow-hidden">
      <div className="scroll-content h-full">{children}</div>
    </div>
  );
}
