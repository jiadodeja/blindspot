let currentBlurPx = 0;

export function enableBlur(blurPx: number): void {
  currentBlurPx = Number.isFinite(blurPx) ? Math.min(10, Math.max(2, blurPx)) : 0;
}

export function disableBlur(): void {
  currentBlurPx = 0;
}

export function getBlur(): number {
  return currentBlurPx;
}
