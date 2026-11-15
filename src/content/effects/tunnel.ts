// Tunnel vision: a dark layer over the page with a clear circle that follows the mouse.
// Clicks pass through the layer, so the page still works underneath.

let overlay: HTMLDivElement | null = null
let radius = 90
let mouseX = window.innerWidth / 2
let mouseY = window.innerHeight / 2

// Redraw the dark layer around the mouse.
function draw(): void {
  if (!overlay) return
  const clearUntil = radius * 0.7 // fully clear inside this, then it fades to dark
  overlay.style.background =
    `radial-gradient(circle at ${mouseX}px ${mouseY}px, ` +
    `rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0) ${clearUntil}px, rgba(0, 0, 0, 0.95) ${radius}px)`
}

function onMouseMove(event: MouseEvent): void {
  mouseX = event.clientX
  mouseY = event.clientY
  draw()
}

export function enableTunnel(radiusPx: number): void {
  radius = radiusPx
  // Only build the layer once. If the slider moves, we just redraw.
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.setAttribute('data-blindspot', 'tunnel') // so the accessibility scan skips it
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;'
    document.documentElement.appendChild(overlay)
    document.addEventListener('mousemove', onMouseMove, { passive: true })
  }
  draw()
}

export function disableTunnel(): void {
  if (!overlay) return
  document.removeEventListener('mousemove', onMouseMove)
  overlay.remove()
  overlay = null
}
