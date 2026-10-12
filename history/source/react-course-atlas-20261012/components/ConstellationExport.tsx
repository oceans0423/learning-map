import { useEffect, useRef, useState } from 'react'
import type { StarPosition } from '../lib/personal'
import { constellationSvg } from '../lib/constellationSvg'
import { Button } from './Button'
interface Props {
  stars: readonly StarPosition[]
  name: string
  editing: boolean
}
export function ConstellationExport({ stars, name, editing }: Props) {
  const [message, setMessage] = useState('')
  const pending = useRef(new Map<number, string>())
  useEffect(() => {
    const downloads = pending.current
    return () => {
      for (const [timer, url] of downloads) {
        window.clearTimeout(timer)
        URL.revokeObjectURL(url)
      }
      downloads.clear()
    }
  }, [])
  function download() {
    let url: string | null = null
    let link: HTMLAnchorElement | null = null
    try {
      const svg = constellationSvg(stars, name)
      url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
      link = document.createElement('a')
      link.href = url
      link.download = 'my-humanities-constellation.svg'
      document.body.append(link)
      link.click()
      link.remove()
      const objectUrl = url
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
        pending.current.delete(timer)
      }, 1000)
      pending.current.set(timer, url)
      setMessage('已交給瀏覽器下載 SVG，請確認下載清單；作品不會上傳。')
    } catch {
      link?.remove()
      if (url) URL.revokeObjectURL(url)
      setMessage('無法建立下載，草稿仍保留；請重試或檢查瀏覽器下載設定。')
    }
  }
  return (
    <section className="constellation-export" aria-label="帶走星座">
      <Button disabled={editing} onClick={download}>
        下載星座 SVG
      </Button>
      <p>
        {editing
          ? '請先完成或取消移動，再下載。'
          : '匯出目前已提交的名稱與位置，不需保存或登入；改名後請先按更新名稱。'}
      </p>
      <p role="status">{message}</p>
    </section>
  )
}
