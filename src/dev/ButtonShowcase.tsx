import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '../components/Button'
import './showcase.css'

export function Showcase() {
  const [selected, setSelected] = useState(false)
  const [semester, setSemester] = useState(1)
  const [collected, setCollected] = useState(false)
  return (
    <main>
      <h1>按鈕狀態 · 直接操作，不需要猜</h1>
      {(['ui-night', 'ui-paper'] as const).map((surface) => (
        <section key={surface} className={surface} aria-label={surface}>
          <h2>{surface === 'ui-night' ? '夜空' : '暖紙'}</h2>
          <div className="showcase-row">
            <Button variant="primary">查看課程</Button>
            <Button>返回總覽</Button>
            <Button>所有課程</Button>
          </div>
          <div className="showcase-row" role="group" aria-label="探索訊號">
            <Button
              variant="toggle"
              aria-pressed={selected}
              onClick={() => setSelected(!selected)}
            >
              {selected ? '✓ ' : ''}文本思辨
            </Button>
            <Button onClick={() => setSelected(false)}>清除訊號</Button>
          </div>
          <div className="showcase-row" role="group" aria-label="學期">
            {[1, 2].map((value) => (
              <Button
                key={value}
                variant="toggle"
                aria-pressed={semester === value}
                onClick={() => setSemester(value)}
              >
                {semester === value ? '✓ ' : ''}
                {value === 1 ? '上學期' : '下學期'}
              </Button>
            ))}
          </div>
          <div className="showcase-row">
            <Button
              stable
              aria-pressed={collected}
              aria-label={collected ? '取消收藏課程' : '收藏課程'}
              onClick={() => setCollected(!collected)}
            >
              {collected ? '✓ 已收藏' : '＋ 收藏課程'}
            </Button>
            <Button>查看收藏</Button>
          </div>
          <Button>用收藏課程建立我的星座</Button>
          <p>
            <Button disabled aria-describedby={`reason-${surface}`}>
              下載作品（尚未提供）
            </Button>
          </p>
          <p id={`reason-${surface}`}>此頁僅展示互動狀態，未實作下載或保存；沒有假 loading。</p>
        </section>
      ))}
      <p role="status">
        {selected ? '已選擇文本思辨' : '未選擇訊號'} · {semester === 1 ? '上' : '下'}學期 ·{' '}
        {collected ? '已收藏' : '未收藏'}
      </p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Showcase />)
