import { useState } from 'react'
import { Button } from './Button'
interface Props {
  headingLevel?: 3 | 4
  enabled: boolean
  message: string
  enable: () => void
  disable: () => void
  remove: () => void
}
export function PersonalStorageControls({
  enabled,
  message,
  enable,
  disable,
  remove,
  headingLevel = 4,
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const Heading = headingLevel === 3 ? 'h3' : 'h4'
  return (
    <section className="personal-storage-controls" aria-label="本機保存">
      <Heading>只留在這台裝置</Heading>
      <p>未保存的草稿在重載後會清空。保存為選用，不需登入、不上傳；不能跨裝置同步。</p>
      <div className="personal-storage-buttons">
        <Button onClick={enabled ? disable : enable}>
          {enabled ? '停用保存' : '儲存在這台裝置'}
        </Button>
        <Button onClick={() => setConfirming(true)}>刪除此裝置的資料</Button>
      </div>
      {confirming && (
        <div className="storage-confirm" role="group" aria-label="確認刪除裝置存檔">
          <p>只刪除此網站的星座與收藏存檔，無法復原；當前工作階段草稿仍保留。</p>
          <Button
            onClick={() => {
              remove()
              setConfirming(false)
            }}
          >
            確認刪除存檔
          </Button>
          <Button onClick={() => setConfirming(false)}>取消刪除</Button>
        </div>
      )}
      <p role="status">{message || '尚未開啟本機保存。'}</p>
    </section>
  )
}
