import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  const containerRef = useRef<T | null>(null);
  const endRef = useRef<T | null>(null);
  const shouldScrollRef = useRef(true);
  const prevChildCountRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Initial scroll
      end.scrollIntoView({ behavior: "instant", block: "end" });
      prevChildCountRef.current = container.childNodes.length;

      // Check if user has scrolled up
      const handleScroll = () => {
        if (!container) return;

        const isAtBottom =
          Math.abs(
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight,
          ) < 10;

        shouldScrollRef.current = isAtBottom;
      };

      const observer = new MutationObserver(() => {
        if (!container) return;

        // Check if a new message was added (child count increased)
        const currentChildCount = container.childNodes.length;
        const isNewMessage = currentChildCount > prevChildCountRef.current;
        prevChildCountRef.current = currentChildCount;

        // Only force scroll on new message or if already at bottom
        if (isNewMessage || shouldScrollRef.current) {
          end.scrollIntoView({ behavior: "instant", block: "end" });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // Add scroll listener
      container.addEventListener("scroll", handleScroll);

      return () => {
        observer.disconnect();
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return [containerRef, endRef];
}
