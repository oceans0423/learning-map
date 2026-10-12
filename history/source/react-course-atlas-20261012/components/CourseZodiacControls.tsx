import { zodiacProfiles } from '../data/zodiac'
import { ZODIAC_TOPICS, isZodiacId, type ZodiacId, type ZodiacProfile } from '../config/zodiac'
import type { matchZodiac } from '../lib/zodiac'
import { selectZodiacCourses, zodiacCourseConnection } from '../lib/zodiac'
import { courses } from '../data/courses'
import { YEAR_LABELS } from '../config/courseAreas'
import type { Course } from '../types/course'
import { Button } from './Button'

interface SelectorProps {
  value: ZodiacId | null
  automatic?: ZodiacProfile
  onChange: (id: ZodiacId | null) => void
}
export function ZodiacSelector({ value, automatic, onChange }: SelectorProps) {
  return (
    <label className="ca-zodiac-select">
      {automatic ? '星圖造型（不改變已選課程）' : '選擇星座主題'}
      <select
        id={automatic ? 'atlas-zodiac-shape' : 'atlas-zodiac-theme'}
        value={value ?? (automatic ? '' : 'aries')}
        onChange={(event) =>
          onChange(isZodiacId(event.target.value) ? event.target.value : null)
        }
      >
        {automatic && <option value="">依課程配對 · {automatic.label}</option>}
        {zodiacProfiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.label} · {profile.theme}
          </option>
        ))}
      </select>
    </label>
  )
}

function ZodiacIntro({ profile }: { profile: ZodiacProfile }) {
  return (
    <div className="ca-zodiac-intro">
      <p className="ca-zodiac-tagline">{profile.tagline}</p>
      <p>{profile.description}</p>
    </div>
  )
}

export function CourseZodiacMatch({
  match,
  profile,
  manual,
  onShape,
  onExplore,
}: {
  match: NonNullable<ReturnType<typeof matchZodiac>>
  profile: ZodiacProfile
  manual: ZodiacId | null
  onShape: (id: ZodiacId | null) => void
  onExplore: () => void
}) {
  const top = match.ranked[0]
  return (
    <section className="ca-zodiac-panel" aria-labelledby="atlas-match-title">
      <p className="ca-eyebrow">COURSES → CONSTELLATION</p>
      <h3 id="atlas-match-title" tabIndex={-1}>
        {match.preliminary ? '初步結果' : '課程配對'}：{top.profile.label} · {top.profile.theme}
      </h3>
      <ZodiacIntro profile={top.profile} />
      {match.tied.length > 1 && (
        <p>
          同分主題：{match.tied.map((rank) => rank.profile.label).join('、')}
          。目前先顯示第一款，你可以自由換造型。
        </p>
      )}
      {match.preliminary && (
        <p>目前只有 {match.count} 門課程，先提供探索方向；不用集滿也能生成星圖。</p>
      )}
      <p className="ca-zodiac-note">探索主題設計草案 · 非人格測驗或正式選課建議。</p>
      {match.broad && <p>課程跨越多種主題；這是相近方向之一。</p>}
      <p>
        興趣線索：
        {top.evidence
          .slice(0, 2)
          .map(({ tag }) => ZODIAC_TOPICS[tag])
          .join(' × ')}
      </p>
      <details className="ca-zodiac-method">
        <summary>配對怎麼來？</summary>
        <p>因為你選擇了：</p>
        <ul className="ca-zodiac-evidence">
          {top.evidence.slice(0, 2).map(({ tag, courses }) => (
            <li key={tag}>
              <strong>{ZODIAC_TOPICS[tag]}</strong> ·{' '}
              {courses
                .slice(0, 2)
                .map((course) => course.name)
                .join('、')}
              {courses.length > 2 ? '等課程' : ''}
              <span className="ca-zodiac-angle">{top.profile.interpretations[tag]}</span>
            </li>
          ))}
        </ul>
        <p>
          設計草案：69 門課程各有 2–3
          個人工探索標籤，每門的貢獻均分；共同必修基礎課權重為一般課的一半。比較課程主題分布與十二種主題的相近程度，不看生日，也不評判人格或適性。主題分類尚未經學系審核。
        </p>
      </details>
      <ZodiacSelector value={manual} automatic={top.profile} onChange={onShape} />
      {manual && (
        <p>
          目前自行選擇：{profile.label}造型；課程配對仍是{top.profile.label}，收藏不變。
        </p>
      )}
      <Button id="atlas-explore-matched" onClick={onExplore}>
        看看{profile.label}的主題課程
      </Button>
    </section>
  )
}

export function CourseZodiacExplorer({
  profile,
  onChange,
}: {
  profile: ZodiacProfile
  onChange: (id: ZodiacId | null) => void
}) {
  return (
    <section className="ca-zodiac-panel" aria-labelledby="atlas-theme-title">
      <p className="ca-eyebrow">TWELVE THEMES / 十二種探索方向</p>
      <ZodiacSelector value={profile.id} onChange={onChange} />
      <h3 id="atlas-theme-title" aria-live="polite">
        {profile.label} · {profile.theme}
      </h3>
      <ZodiacIntro profile={profile} />
      <details className="ca-zodiac-reasons">
        <summary>為什麼是這些課程？</summary>
        <p>
          這個組合依主要與延伸主題納入相關課程，不為了湊年級而加入；同一門課可以從不同星座的角度閱讀。
        </p>
        <ul className="ca-zodiac-evidence">
          {profile.exampleIds.map((id) => (
            <li key={id}>
              <strong>{courses.find((course) => course.id === id)!.name}</strong>
              <span className="ca-zodiac-angle">
                {zodiacCourseConnection(profile, id)!.reason}
              </span>
            </li>
          ))}
        </ul>
        <p className="ca-zodiac-note">
          以上是組合示例，不是你的收藏或課程成果保證；完整課程在下方依年級查看。
        </p>
      </details>
      <p className="ca-zodiac-note">
        設計草案 ·
        這是學習主題的創意詮釋，不是生日限制、人格判定或正式選課建議。四年課程不代表先修順序；查看詳情後自行決定要不要加入。切換主題不會修改收藏。
      </p>
      <details className="ca-zodiac-gallery">
        <summary>一次看看十二種星座造型</summary>
        <div>
          {zodiacProfiles.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => onChange(p.id)}
              aria-label={`探索${p.label}`}
              aria-pressed={p.id === profile.id}
            >
              <svg viewBox="0 0 100 125" aria-hidden="true">
                {p.edges.map(([a, b]) => (
                  <line
                    key={`${a}-${b}`}
                    x1={p.points[a][0] * 100}
                    y1={p.points[a][1] * 125}
                    x2={p.points[b][0] * 100}
                    y2={p.points[b][1] * 125}
                  />
                ))}
                {p.points.map(([x, y], i) => (
                  <circle key={i} cx={x * 100} cy={y * 125} r="2" />
                ))}
              </svg>
              <span>{p.label}</span>
              <small>{p.theme}</small>
            </button>
          ))}
        </div>
      </details>
    </section>
  )
}

export function CourseZodiacYears({
  profile,
  year,
  onYear,
}: {
  profile: ZodiacProfile
  year: Course['year'] | null
  onYear: (year: Course['year'] | null) => void
}) {
  const all = selectZodiacCourses(profile)
  const counts = [1, 2, 3, 4].map(
    (value) => all.filter((course) => course.year === value).length,
  )
  return (
    <div className="ca-zodiac-years">
      <p className="ca-zodiac-year-counts">
        {YEAR_LABELS.map((label, index) => `${label} ${counts[index]} 門`).join(' · ')}
      </p>
      <label className="ca-zodiac-select">
        查看星座課程年級
        <select
          id="atlas-zodiac-year"
          value={year ?? ''}
          onChange={(event) =>
            onYear(event.target.value ? (Number(event.target.value) as Course['year']) : null)
          }
        >
          <option value="">全部年級 · {all.length} 門</option>
          {YEAR_LABELS.map((label, index) => (
            <option key={label} value={index + 1}>
              {label} · {counts[index]} 門
            </option>
          ))}
        </select>
      </label>
      <p className="ca-zodiac-note">
        星圖與下方清單顯示同一年級；課程分頁呈現，不必一次看完或全部收藏。
      </p>
    </div>
  )
}
