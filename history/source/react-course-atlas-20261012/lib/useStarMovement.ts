import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { StarPosition } from './personal'
import { boundPoint, nudgePoint, type Point } from './starPosition'
interface Session {
  id: string
  original: Point
  point: Point
}
interface PointerSession {
  id: number
  target: HTMLElement
  startX: number
  startY: number
  width: number
  height: number
  base: Point
  session: Session
  dragged: boolean
  latest: Point
}
export function useStarMovement(
  stars: readonly StarPosition[],
  onCommit: (id: string, point: Point) => void,
) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState<Session | null>(null)
  const [message, setMessage] = useState('')
  const sessionRef = useRef<Session | null>(null)
  const pointerRef = useRef<PointerSession | null>(null)
  const frameRef = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const suppressTimer = useRef<number | null>(null)
  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])
  const stopPointer = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    const pointer = pointerRef.current
    pointerRef.current = null
    if (pointer?.target.hasPointerCapture(pointer.id))
      pointer.target.releasePointerCapture(pointer.id)
  }, [])
  const cancel = useCallback(() => {
    const active = !!sessionRef.current
    stopPointer()
    sessionRef.current = null
    setEditing(null)
    if (active) setMessage('已取消移動，恢復原位。')
  }, [stopPointer])
  const commit = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    stopPointer()
    sessionRef.current = null
    setEditing(null)
    onCommitRef.current(session.id, boundPoint(session.point))
    setMessage('已完成移動；課程身份與連線時間順序不變。')
  }, [stopPointer])
  const begin = useCallback(
    (star: StarPosition) => {
      if (sessionRef.current?.id === star.id) return
      stopPointer()
      const session = {
        id: star.id,
        original: { x: star.x, y: star.y },
        point: { x: star.x, y: star.y },
      }
      sessionRef.current = session
      setEditing(session)
      setMessage('正在移動代表星。方向按鈕調整，完成提交；Esc取消。')
    },
    [stopPointer],
  )
  const nudge = useCallback((dx: number, dy: number) => {
    const session = sessionRef.current
    if (!session) return
    const next = { ...session, point: nudgePoint(session.point, dx, dy) }
    sessionRef.current = next
    setEditing(next)
  }, [])
  useEffect(() => {
    function move(event: PointerEvent) {
      const pointer = pointerRef.current
      if (!pointer || pointer.id !== event.pointerId) return
      const dx = event.clientX - pointer.startX,
        dy = event.clientY - pointer.startY
      if (!pointer.dragged && Math.hypot(dx, dy) < 6) return
      if (!pointer.dragged) {
        pointer.dragged = true
        pointer.target.setPointerCapture(pointer.id)
        sessionRef.current = pointer.session
        setEditing(pointer.session)
      }
      event.preventDefault()
      pointer.latest = boundPoint({
        x: pointer.base.x + dx / pointer.width,
        y: pointer.base.y + dy / pointer.height,
      })
      sessionRef.current = { ...pointer.session, point: pointer.latest }
      if (frameRef.current === null)
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null
          setEditing(sessionRef.current)
        })
    }
    function up(event: PointerEvent) {
      const pointer = pointerRef.current
      if (!pointer || pointer.id !== event.pointerId) return
      if (pointer.dragged) {
        suppressClick.current = true
        if (suppressTimer.current !== null) window.clearTimeout(suppressTimer.current)
        suppressTimer.current = window.setTimeout(() => {
          suppressClick.current = false
          suppressTimer.current = null
        }, 0)
        sessionRef.current = { ...pointer.session, point: pointer.latest }
        commit()
      } else stopPointer()
    }
    function abort(event: PointerEvent) {
      if (pointerRef.current?.id === event.pointerId) cancel()
    }
    function lost(event: PointerEvent) {
      const pointer = pointerRef.current
      if (pointer?.dragged && pointer.id === event.pointerId && event.target === pointer.target)
        cancel()
    }
    function key(event: KeyboardEvent) {
      if (!sessionRef.current) return
      if (event.key === 'Escape') {
        event.preventDefault()
        cancel()
        return
      }
      if (
        !(event.target instanceof HTMLElement) ||
        !event.target.classList.contains('star-grip')
      )
        return
      if (event.key === 'Enter') {
        event.preventDefault()
        commit()
      }
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-0.02, 0],
        ArrowRight: [0.02, 0],
        ArrowUp: [0, -0.02],
        ArrowDown: [0, 0.02],
      }
      if (directions[event.key]) {
        event.preventDefault()
        nudge(...directions[event.key])
      }
    }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', abort)
    window.addEventListener('lostpointercapture', lost)
    window.addEventListener('blur', cancel)
    window.addEventListener('resize', cancel)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', abort)
      window.removeEventListener('lostpointercapture', lost)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('resize', cancel)
      window.removeEventListener('keydown', key)
      stopPointer()
      if (suppressTimer.current !== null) window.clearTimeout(suppressTimer.current)
    }
  }, [cancel, commit, nudge, stopPointer])
  useEffect(() => {
    if (sessionRef.current && !stars.some((star) => star.id === sessionRef.current!.id))
      cancel()
  }, [stars, cancel])
  const pointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, star: StarPosition) => {
      if (event.button !== 0 || !event.isPrimary || !canvasRef.current) return
      stopPointer()
      const same = sessionRef.current?.id === star.id ? sessionRef.current : null
      const session = same ?? {
        id: star.id,
        original: { x: star.x, y: star.y },
        point: { x: star.x, y: star.y },
      }
      const rect = canvasRef.current.getBoundingClientRect()
      pointerRef.current = {
        id: event.pointerId,
        target: event.currentTarget,
        startX: event.clientX,
        startY: event.clientY,
        width: rect.width,
        height: rect.height,
        base: session.point,
        session,
        dragged: false,
        latest: session.point,
      }
    },
    [stopPointer],
  )
  const click = useCallback(
    (star: StarPosition) => {
      if (suppressClick.current) {
        suppressClick.current = false
        return
      }
      begin(star)
    },
    [begin],
  )
  return { canvasRef, editing, message, begin, nudge, commit, cancel, pointerDown, click }
}
