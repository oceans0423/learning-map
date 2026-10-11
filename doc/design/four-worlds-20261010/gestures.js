/* global window */
window.attachAtlasGestures = function (root, choose) {
  const cleanups = []
  root.querySelectorAll('[data-gesture-zone]').forEach((zone) => {
    const content = zone.querySelector('.gesture-content')
    let start = null
    const down = (event) => {
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        event.target.closest('button, a, input, select')
      )
        return
      start = {
        x: event.clientX,
        y: event.clientY,
        pointer: event.pointerId,
        horizontal: false,
      }
    }
    const move = (event) => {
      if (!start || event.pointerId !== start.pointer) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (!start.horizontal && Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) {
        start = null
        return
      }
      if (!start.horizontal && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        start.horizontal = true
        zone.setPointerCapture(event.pointerId)
      }
      if (start.horizontal) {
        if (event.cancelable) event.preventDefault()
        content.style.transition = 'none'
        const displacement = Math.max(-28, Math.min(28, dx * 0.2))
        content.style.transform = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? ''
          : `translateX(${displacement}px)`
      }
    }
    const finish = (event) => {
      if (!start) return
      const dx = event.clientX - start.x
      if (event.type === 'pointerup' && start.horizontal && Math.abs(dx) > 44)
        choose(dx < 0 ? 1 : -1)
      content.style.transition = ''
      content.style.transform = ''
      if (zone.hasPointerCapture(start.pointer)) zone.releasePointerCapture(start.pointer)
      start = null
    }
    zone.addEventListener('pointerdown', down)
    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerup', finish)
    zone.addEventListener('pointercancel', finish)
    cleanups.push(() => {
      zone.removeEventListener('pointerdown', down)
      zone.removeEventListener('pointermove', move)
      zone.removeEventListener('pointerup', finish)
      zone.removeEventListener('pointercancel', finish)
    })
  })
  return () => cleanups.forEach((cleanup) => cleanup())
}
