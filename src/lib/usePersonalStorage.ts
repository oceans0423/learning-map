import { useEffect, useState } from 'react'
import type { PersonalState } from './personal'
import { PERSONAL_STORAGE_KEY, serializePersonal } from './personalStorage'

export function usePersonalStorage(
  state: PersonalState,
  initial: { enabled: boolean; message: string },
) {
  const [enabled, setEnabled] = useState(initial.enabled)
  const [message, setMessage] = useState(initial.message)
  useEffect(() => {
    if (!enabled) return
    // Coalesce changes in the same render cycle; cancelled effects never write stale drafts.
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      try {
        window.localStorage.setItem(PERSONAL_STORAGE_KEY, serializePersonal(state, true))
        setMessage('已儲存在這台裝置；之後的修改會自動更新。清除瀏覽器資料會移除存檔。')
      } catch {
        setEnabled(false)
        setMessage('儲存失敗，已停止自動寫入；當前草稿仍在，可重試。舊存檔可能仍在。')
      }
    })
    return () => {
      cancelled = true
    }
  }, [state, enabled])
  function enable() {
    try {
      window.localStorage.setItem(PERSONAL_STORAGE_KEY, serializePersonal(state, true))
      setEnabled(true)
      setMessage('已儲存在這台裝置；之後的修改會自動更新。')
    } catch {
      setMessage('儲存失敗；當前草稿仍在，可重試。')
    }
  }
  function disable() {
    setEnabled(false)
    try {
      const raw = window.localStorage.getItem(PERSONAL_STORAGE_KEY)
      if (raw !== null) {
        const saved: unknown = JSON.parse(raw)
        if (!saved || typeof saved !== 'object') throw new Error('Invalid snapshot')
        window.localStorage.setItem(
          PERSONAL_STORAGE_KEY,
          JSON.stringify({ ...saved, consent: false }),
        )
      }
      setMessage('已停用保存，保留當前草稿；舊存檔不再更新或自動還原。需要移除請另按刪除。')
    } catch {
      setMessage(
        '本次已停止保存，但無法更新裝置上的同意狀態；重載可能還原舊存檔。當前草稿保留，可重試或刪除。',
      )
    }
  }
  function remove() {
    setEnabled(false)
    try {
      window.localStorage.removeItem(PERSONAL_STORAGE_KEY)
      setMessage('已刪除此裝置的存檔並停用保存；目前草稿保留，重載後不會還原。')
    } catch {
      setMessage('刪除失敗，本次已停止保存；舊存檔可能仍在。當前草稿保留。')
    }
  }
  return { enabled, message, enable, disable, remove }
}
