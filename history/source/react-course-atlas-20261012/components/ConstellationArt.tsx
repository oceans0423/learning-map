import { courses } from '../data/courses'
import { chronologicalStars, shortCourseName } from '../lib/constellation'
import type { StarPosition } from '../lib/personal'
import { useState } from 'react'
import { useStarMovement } from '../lib/useStarMovement'
import type { Point } from '../lib/starPosition'
import { Button } from './Button'
import { ConstellationExport } from './ConstellationExport'
interface Props {
  stars: readonly StarPosition[]
  name: string
  celebrating: boolean
  onMove: (id: string, point: Point) => void
}
export function ConstellationArt({ stars, name, celebrating, onMove }: Props) {
  const { canvasRef, editing, message, begin, nudge, commit, cancel, pointerDown, click } =
    useStarMovement(stars, onMove)
  const [selectedId, setSelectedId] = useState(stars[0]?.id ?? '')
  const selection = stars.some((star) => star.id === selectedId)
    ? selectedId
    : (stars[0]?.id ?? '')
  const ordered = chronologicalStars(
    stars.map((star) => (editing?.id === star.id ? { ...star, ...editing.point } : star)),
  )
  return (
    <figure
      className={`constellation-art${celebrating ? ' is-celebrating' : ''}`}
      aria-label="個人星座構圖"
    >
      <h4 className="constellation-name-display">{name}</h4>
      <section className="star-move-toolbar" aria-label="星座移動控制">
        <label htmlFor="star-selector">要移動的代表星</label>
        <div className="star-move-selector">
          <select
            id="star-selector"
            value={selection}
            onChange={(event) => {
              setSelectedId(event.target.value)
              if (editing) begin(stars.find((star) => star.id === event.target.value)!)
            }}
          >
            {chronologicalStars(stars).map((star) => (
              <option key={star.id} value={star.id}>
                {courses.find((course) => course.id === star.id)!.name}
              </option>
            ))}
          </select>
          <Button
            aria-pressed={!!editing}
            onClick={() =>
              editing ? cancel() : begin(stars.find((star) => star.id === selection)!)
            }
          >
            移動模式
          </Button>
        </div>
        <div className="star-move-directions" role="group" aria-label="方向調整">
          <Button disabled={!editing} onClick={() => nudge(0, -0.02)}>
            ↑ 上
          </Button>
          <Button disabled={!editing} onClick={() => nudge(-0.02, 0)}>
            ← 左
          </Button>
          <Button disabled={!editing} onClick={() => nudge(0.02, 0)}>
            右 →
          </Button>
          <Button disabled={!editing} onClick={() => nudge(0, 0.02)}>
            下 ↓
          </Button>
          <Button disabled={!editing} onClick={commit}>
            完成移動
          </Button>
          <Button disabled={!editing} onClick={cancel}>
            取消移動
          </Button>
        </div>
        <p>
          拖曳星點把手，或啟用移動模式使用方向按鈕。星點上也可按方向鍵，Enter完成、Esc取消。
        </p>
      </section>
      <div className="constellation-canvas" aria-label="代表星位置" ref={canvasRef}>
        {ordered.length > 1 && (
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              pathLength="1"
              points={ordered.map((star) => `${star.x * 1000},${star.y * 1000}`).join(' ')}
            />
          </svg>
        )}
        {ordered.map((star, index) => {
          const course = courses.find((course) => course.id === star.id)!
          return (
            <div
              key={star.id}
              className="constellation-star"
              data-star-id={star.id}
              data-star-x={star.x}
              data-star-y={star.y}
              style={{ left: `${star.x * 100}%`, top: `${star.y * 100}%` }}
            >
              <Button
                className="star-grip"
                aria-label={`移動代表星：${course.name}`}
                aria-pressed={editing?.id === star.id}
                onPointerDown={(event) => {
                  setSelectedId(star.id)
                  pointerDown(
                    event,
                    stars.find((item) => item.id === star.id)!,
                  )
                }}
                onClick={() => {
                  setSelectedId(star.id)
                  click(stars.find((item) => item.id === star.id)!)
                }}
                title={`移動代表星：${course.name}`}
              >
                <span aria-hidden="true">✦</span>
              </Button>
              <span className="constellation-star-label">
                {index + 1}. {shortCourseName(course.name)}
              </span>
              <span className="constellation-star-label-compact">
                {index + 1}. {shortCourseName(course.name, 4)}
              </span>
              <small>
                大{['一', '二', '三', '四'][course.year - 1]}
                {course.semester === 1 ? '上' : '下'}
              </small>
            </div>
          )
        })}
      </div>
      <p className="star-move-status" role="status">
        {message}
      </p>
      <figcaption>
        連線是你的探索想像，不是課程先修順序。依年級、學期及課程 ID
        連接，沒有箭頭；位置不代表能力或重要性。
      </figcaption>
      <ol className="constellation-course-legend">
        {ordered.map((star) => {
          const course = courses.find((course) => course.id === star.id)!
          return (
            <li key={star.id}>
              {course.name}{' '}
              <span>
                · 大{['一', '二', '三', '四'][course.year - 1]}
                {course.semester === 1 ? '上' : '下'}
              </span>
            </li>
          )
        })}
      </ol>
      <ConstellationExport stars={stars} name={name} editing={!!editing} />
    </figure>
  )
}
