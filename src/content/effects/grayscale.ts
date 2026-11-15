let currentGrayscale = 0;

export function enableGrayscale(): void {
  currentGrayscale = 100;
}

export function disableGrayscale(): void {
  currentGrayscale = 0;
}

export function getGrayscale(): number {
  return currentGrayscale;
}
