// Motion helpers for the ATO 2026 Workshop page.
//
// Values are ported, not imported: the cubic-bezier presets come from
// video-shotcraft's demos/_fixtures/Polish.tsx (EASE.snappy / out / overshoot)
// and the "one visible overshoot" spring look (damping 15) from
// scanline-annotate-focus and cloner-depth-echo. Everything here is the Web
// Animations API on transform/opacity: no runtime dependency, nothing loops,
// and every animation ends on its final (static) frame.

export const EASE = {
  snappy: 'cubic-bezier(.16,1,.3,1)', // strong ease-out: entrances, landings
  out: 'cubic-bezier(.22,1,.36,1)', // softer ease-out: followers, sparks
  over: 'cubic-bezier(.34,1.45,.64,1)', // ~8% overshoot, then settle: pops, seats
}

export const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The guide ghost hops to its new spot and lands with a small squash (600 ms). */
export function hop(el: Element | null): void {
  if (!el || reducedMotion() || !('animate' in el)) return
  ;(el as HTMLElement).animate(
    [
      { transform: 'translateY(0) rotate(0) scale(1,1)', easing: 'cubic-bezier(.2,.7,.3,1)' },
      { transform: 'translateY(-20px) rotate(-7deg) scale(.95,1.05)', offset: 0.42, easing: 'cubic-bezier(.6,0,.9,.5)' },
      { transform: 'translateY(0) rotate(0) scale(1.16,.84)', offset: 0.74, easing: EASE.out },
      { transform: 'translateY(0) rotate(0) scale(1,1)' },
    ],
    { duration: 600 },
  )
}

/** One gentle scale pulse, 1 -> to -> 1 (the cloner-depth-echo "merge" punch). */
export function pulse(el: Element | null, to = 1.1, duration = 420): void {
  if (!el || reducedMotion() || !('animate' in el)) return
  ;(el as HTMLElement).animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${to})`, offset: 0.45 }, { transform: 'scale(1)' }],
    { duration, easing: EASE.out },
  )
}

/** A short spark burst around `host` (<= 600 ms). The sparks remove themselves. */
export function spark(host: HTMLElement | null): void {
  if (!host || reducedMotion() || !('animate' in host)) return
  const n = 12
  const colors = ['#EA3A40', '#8E48FF', '#ffffff', '#ff7a7f']
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    s.className = 'spark'
    s.setAttribute('aria-hidden', 'true')
    s.style.background = colors[i % colors.length]
    s.style.color = colors[i % colors.length]
    host.appendChild(s)
    const a = (i / n) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12)
    const d = 50 + (i % 3) * 10
    const dx = Math.cos(a) * d
    const dy = Math.sin(a) * d
    const anim = s.animate(
      [
        { transform: 'translate(-50%,-50%) translate(0px,0px) scale(.4)', opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${dx * 0.7}px,${dy * 0.7}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 },
      ],
      { duration: 520, delay: i * 10, easing: EASE.out, fill: 'backwards' },
    )
    anim.onfinish = () => s.remove()
    anim.oncancel = () => s.remove()
  }
}
