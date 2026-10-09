import { useCallback, useEffect, useRef } from 'react'

function isVisible(element: HTMLElement | null): element is HTMLElement {
  if (!element || !element.isConnected || element.closest('[inert]')) return false
  const rect = element.getBoundingClientRect()
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.bottom <= innerHeight &&
    rect.left >= 0 &&
    rect.right <= innerWidth
  )
}

/** Exactly one cancellable, aria-hidden token; collection state is not owned here. */
export function useCollectionFlight() {
  const frame = useRef<number | null>(null)
  const animation = useRef<Animation | null>(null)
  const token = useRef<HTMLElement | null>(null)
  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    animation.current?.cancel()
    animation.current = null
    token.current?.remove()
    token.current = null
  }, [])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.addEventListener('resize', cancel)
    window.addEventListener('scroll', cancel, true)
    media.addEventListener('change', cancel)
    return () => {
      window.removeEventListener('resize', cancel)
      window.removeEventListener('scroll', cancel, true)
      media.removeEventListener('change', cancel)
      cancel()
    }
  }, [cancel])
  const fly = useCallback(
    (id: string, adding: boolean, trigger: HTMLElement | null) => {
      cancel()
      if (!adding || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const courseStar = document.querySelector<HTMLElement>(
          `.atlas-course[data-course-id="${id}"] .atlas-star`,
        )
        const source = isVisible(courseStar) ? courseStar : trigger
        const destination = document.querySelector<HTMLElement>('.collection-summary')
        const duration =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              '--ui-duration-collect',
            ),
          ) || 280
        if (!isVisible(source)) return
        if (!isVisible(destination)) {
          const feedback = source.animate(
            [{ boxShadow: '0 0 0 2px #f6f0e4' }, { boxShadow: '0 0 0 0px #f6f0e400' }],
            { duration, easing: 'ease-out' },
          )
          animation.current = feedback
          feedback.finished.then(
            () => {
              if (animation.current === feedback) animation.current = null
            },
            () => {},
          )
          return
        }
        // Read both bounds once, then write. No layout measurement in animation frames.
        const from = source.getBoundingClientRect()
        const to = destination.getBoundingClientRect()
        const copy = document.createElement('span')
        copy.className = 'collection-flight'
        copy.textContent = '✦'
        copy.setAttribute('aria-hidden', 'true')
        copy.style.left = `${from.left + from.width / 2}px`
        copy.style.top = `${from.top + from.height / 2}px`
        document.body.append(copy)
        token.current = copy
        const flight = copy.animate(
          [
            { transform: 'translate(-50%, -50%)', opacity: 0.85 },
            {
              transform: `translate(calc(-50% + ${to.left + to.width / 2 - from.left - from.width / 2}px), calc(-50% + ${to.top + to.height / 2 - from.top - from.height / 2}px))`,
              opacity: 0,
            },
          ],
          { duration, easing: 'cubic-bezier(.2,.7,.2,1)' },
        )
        animation.current = flight
        const clean = () => {
          copy.remove()
          if (token.current === copy) token.current = null
          if (animation.current === flight) animation.current = null
        }
        flight.finished.then(clean, clean)
      })
    },
    [cancel],
  )
  return { fly, cancel }
}
