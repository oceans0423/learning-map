import { courses } from '../data/courses'
import { Button } from './Button'
interface Props {
  ids: readonly string[]
  onRemove: (id: string) => void
  onCourse: (id: string) => void
  onReturn: () => void
  onCreate: () => void
}
export function CollectionPanel({ ids, onRemove, onCourse, onReturn, onCreate }: Props) {
  return (
    <section className="collection-panel" aria-label="收藏課程面板">
      <p>收藏是感興趣的課程，不代表已修課。這些收藏目前只在本工作階段；重載後會清空。</p>
      <Button onClick={onReturn}>返回找課</Button>
      {ids.length > 0 && <Button onClick={onCreate}>用收藏課程建立我的星座</Button>}
      {ids.length ? (
        <ul className="collection-list">
          {ids.map((id) => {
            const course = courses.find((course) => course.id === id)!
            return (
              <li key={id}>
                <div>
                  <strong>{course.name}</strong>
                  <p>
                    大{['一', '二', '三', '四'][course.year - 1]} ·{' '}
                    {course.semester === 1 ? '上' : '下'}學期
                  </p>
                </div>
                <div>
                  <Button onClick={() => onCourse(id)} aria-label={`查看課程：${course.name}`}>
                    查看課程
                  </Button>
                  <Button onClick={() => onRemove(id)} aria-label={`移除收藏：${course.name}`}>
                    移除收藏
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p>目前沒有收藏。可復原最近一次移除，或返回找課。</p>
      )}
    </section>
  )
}
