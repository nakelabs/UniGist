import { useEffect } from 'react';

/**
 * Hardened body scroll lock that completely prevents background scrolling
 * on mobile iOS Safari / WebKit and desktop browsers.
 *
 * On iOS, `overflow: hidden` on <body> is ignored by WebKit when virtual keyboards
 * appear or when touch events fire. The only reliable solution is pinning the body
 * with `position: fixed` at `-scrollY` and restoring the exact scroll position upon exit.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;
    const originalRight = document.body.style.right;
    const originalWidth = document.body.style.width;

    // Pin the body in place at the exact current scroll position
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.right = originalRight;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;

      // Restore exact scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
