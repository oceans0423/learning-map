import { useEffect, useRef, useState } from 'react'
import type { Course } from '../types/course'
import { ROLES_BY_ID } from '../config/roles'
import { SIGNAL_BY_ID } from '../config/explorationSignals'
import { getCourseSignal } from '../data/explorationSignals'
import { publishedDetails } from '../lib/publishedDetails'
import { isolateModal } from '../lib/modal'
import { Button } from './Button'
import { courseArea } from '../config/courseAreas'

interface CourseDetailsDialogProps {
  presentation?: 'legacy' | 'atlas'
  course: Course
  onClose: () => void
  responsive?: boolean
  sourceElement?: HTMLElement | null
  collected?: boolean
  onToggleCollection?: () => void
  collectionMessage?: string
}

export function CourseDetailsDialog({
  course,
  presentation = 'legacy',
  onClose,
  responsive = false,
  sourceElement,
  collected = false,
  onToggleCollection,
  collectionMessage = '',
}: CourseDetailsDialogProps) {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const modal = !responsive || !wide
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = () => setWide(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    if (sourceElement) returnFocusRef.current = sourceElement
  }, [sourceElement])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement
    if (!returnFocusRef.current)
      returnFocusRef.current =
        previousFocus instanceof HTMLElement && previousFocus !== document.body
          ? previousFocus
          : null
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const restoreInert =
      modal && panelRef.current?.parentElement
        ? isolateModal(panelRef.current.parentElement)
        : () => {}
    if (modal) {
      document.body.style.overflow = 'hidden'
      closeButtonRef.current?.focus({ preventScroll: true })
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (!modal || event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        event.preventDefault()
        panelRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panelRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panelRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      restoreInert()
    }
  }, [modal])

  // Registered after modal cleanup so inert is removed before returning focus.
  useEffect(() => {
    const panel = panelRef.current
    return () => {
      const current = document.activeElement
      // A nonmodal inspector must not steal focus from a surviving filter or navigation control.
      if (
        current instanceof HTMLElement &&
        current !== document.body &&
        current.isConnected &&
        !panel?.contains(current) &&
        !current.closest('[inert]')
      )
        return
      const source = returnFocusRef.current
      if (source?.isConnected && !source.closest('[inert]'))
        source.focus({ preventScroll: true })
      else
        document
          .querySelector<HTMLElement>(
            '#atlas-content-title, #scorpius-chart-title, #curriculum button, #curriculum',
          )
          ?.focus({ preventScroll: true })
    }
  }, [])

  const role = ROLES_BY_ID[course.role]
  const details = publishedDetails(course)
  const signal = getCourseSignal(course.id)

  return (
    <div
      className={modal ? 'dialog-backdrop wb-drawer' : 'wb-inline-note'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="detail-panel"
        ref={panelRef}
        tabIndex={-1}
        role={modal ? 'dialog' : 'region'}
        aria-modal={modal ? true : undefined}
        aria-labelledby="course-detail-title"
      >
        <header className="detail-header">
          <div>
            <p className="detail-kicker">
              {presentation === 'atlas'
                ? 'COURSE DETAILS / 課程詳情'
                : 'FIELD NOTES / 課程探索筆記'}
            </p>
            <p className="eyebrow">
              {course.type === 'required' ? '必修課程' : '選修課程'}
              {presentation === 'legacy' ? ` · ${role.label}` : ''}
            </p>
            <h2 className="display-type" id="course-detail-title">
              {course.name}
            </h2>
          </div>
          <button
            className="detail-close"
            ref={closeButtonRef}
            type="button"
            aria-label="關閉課程詳情"
            onClick={onClose}
          >
            <span>關閉</span>
          </button>
        </header>

        <dl className="detail-facts">
          {presentation === 'atlas' && (
            <div className="detail-area-fact">
              <dt>領域</dt>
              <dd>{courseArea(course.module).label}</dd>
            </div>
          )}
          <div>
            <dt>年級</dt>
            <dd>{['', '大一', '大二', '大三', '大四'][course.year]}</dd>
          </div>
          <div>
            <dt>學期</dt>
            <dd>{course.semester === 1 ? '上學期' : '下學期'}</dd>
          </div>
          <div>
            <dt>學分</dt>
            <dd>{course.credits} 學分</dd>
          </div>
          <div>
            <dt>修別</dt>
            <dd>{course.type === 'required' ? '必修' : '選修'}</dd>
          </div>
        </dl>

        <div className="detail-body" key={course.id}>
          {modal && collectionMessage && <p role="status">{collectionMessage}</p>}
          {onToggleCollection && (
            <div className="ui-paper">
              <Button
                stable
                className="collection-toggle"
                aria-pressed={collected}
                data-collection-id={course.id}
                aria-label={`${presentation === 'atlas' ? (collected ? '移除我的課程' : '加入我的課程') : collected ? '取消收藏課程' : '收藏課程'}：${course.name}`}
                onClick={onToggleCollection}
              >
                {presentation === 'atlas'
                  ? collected
                    ? '✓ 已加入 · 移除'
                    : '＋ 加入我的課程'
                  : collected
                    ? '✓ 已收藏 · 取消'
                    : '＋ 收藏課程'}
              </Button>
              {presentation === 'atlas' && (
                <p className="detail-selection-note">記下感興趣的課程，並非正式選課。</p>
              )}
            </div>
          )}
          {presentation === 'atlas' ? (
            <details className="detail-position">
              <summary>課程定位（補充資訊）</summary>
              <p>課程作用：{role.label}</p>
              <p>正式探索面向：{course.primaryTrack ?? '未指定主要面向'}</p>
              {course.relatedTracks.length > 0 && (
                <p>相關面向：{course.relatedTracks.join('、')}</p>
              )}
              <p>資料模組：{course.module}</p>
              <p>這些分類不是課程先修順序。</p>
            </details>
          ) : (
            <>
              <section className="detail-section">
                <h3>在四年中的位置</h3>
                <p>
                  這門課是四年課程規劃中的{role.label}
                  課程，讓學習逐步延伸至不同探索面向與實作成果。
                </p>
              </section>
              <section className="detail-section">
                <h3>正式探索面向</h3>
                {course.primaryTrack && (
                  <p>
                    <span className="detail-field-label">主要面向</span>
                    {course.primaryTrack}
                  </p>
                )}
                {course.relatedTracks.length > 0 && (
                  <p>
                    <span className="detail-field-label">相關面向</span>
                    {course.relatedTracks.join('、')}
                  </p>
                )}
                {!course.primaryTrack && course.relatedTracks.length === 0 && (
                  <p>未指定探索面向，仍完整保留於四年課程地圖。</p>
                )}
              </section>
              <section className="detail-section">
                <h3>課程模組</h3>
                <p>{course.module}</p>
              </section>
              <section className="detail-section">
                <h3>探索訊號 · 導覽草案</h3>
                {signal.primary ? (
                  <>
                    <p>
                      <span className="detail-field-label">主訊號</span>
                      {SIGNAL_BY_ID[signal.primary].label}
                    </p>
                    {signal.secondary && (
                      <p>
                        <span className="detail-field-label">次訊號</span>
                        {SIGNAL_BY_ID[signal.secondary].label}
                      </p>
                    )}
                  </>
                ) : (
                  <p>整合匯流：不強制歸入單一探索訊號。</p>
                )}
                <p>這是幫助找課的新分類草案，不是官方分流或先修順序。</p>
              </section>
            </>
          )}
          {
            <>
              {details.summary && (
                <section className="detail-section">
                  <h3>課程簡介</h3>
                  <p>{details.summary}</p>
                </section>
              )}
              {details.activities.length > 0 && (
                <section className="detail-section">
                  <h3>學習活動</h3>
                  <ul>
                    {details.activities.map((activity) => (
                      <li key={activity}>{activity}</li>
                    ))}
                  </ul>
                </section>
              )}
              {details.outputs.length > 0 && (
                <section className="detail-section">
                  <h3>可能產出</h3>
                  <ul>
                    {details.outputs.map((output) => (
                      <li key={output}>{output}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          }
          {details.pending && (
            <p className="details-pending">
              課程詳細說明整理中，實際內容請依當學年度課表及課程大綱為準。
            </p>
          )}
        </div>

        <footer className="detail-footer">
          <p>{course.offeringNote}</p>
          <p>課程說明以當年度課程大綱為準。</p>
        </footer>
      </section>
    </div>
  )
}
