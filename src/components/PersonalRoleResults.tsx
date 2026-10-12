import { useState } from 'react'
import { Button } from './Button'
import {
  interpretRoles,
  loadRoleData,
  type RoleData,
  type RoleDirection,
  type RoleInterpretation,
} from '../lib/roleInterpretation'

const descriptions: Record<string, string> = {
  P1: '從文本與現場材料，追問文化現象背後的原因。',
  P2: '把觀察與想像，轉成有自己觀點的作品。',
  P3: '換一種說法，讓人文知識更容易被理解。',
  P4: '整理與分析人文資料，再回到人的故事與文化脈絡。',
  P5: '把文化內容化為展覽、影音與互動，讓人走進文化。',
  P6: '從人的需求出發，把點子做成可以試用與修正的方案。',
  P7: '從文化創意發想，規劃目標、資源與推動方式。',
  P8: '走進地方與社群，以參與和社會設計開創新的可能。',
}

interface Props {
  ids: string[]
  onCourse: (id: string, element: HTMLElement) => void
}

function RoleCard({
  role,
  data,
  onCourse,
}: {
  role: RoleDirection
  data: RoleData
  onCourse: Props['onCourse']
}) {
  const definition = data.roles.find((item) => item.id === role.characterId)!
  return (
    <article className="ca-role-card">
      <p className="ca-role-kicker">一種可以探索的方向</p>
      <h4>{role.name}</h4>
      <p>{descriptions[role.characterId]}</p>
      <p className="ca-role-facets">
        {definition.requiredFacets.map((id) => definition.facets[id]).join('、')}
      </p>
      <details>
        <summary>為什麼連向{role.name}？</summary>
        <ul className="ca-role-evidence">
          {role.evidence.map((row) => (
            <li key={row.courseId}>
              <button
                type="button"
                onClick={(event) => onCourse(row.courseId, event.currentTarget)}
              >
                {row.courseName} <span aria-hidden="true">↗</span>
              </button>
              <small>{row.relationType === '代表' ? '直接呈現工作方式' : '提供支援線索'}</small>
              <p>{row.reason}</p>
            </li>
          ))}
        </ul>
        {role.limitations.length > 0 && <p>解讀限制：{role.limitations.join('；')}</p>}
      </details>
    </article>
  )
}

export function PersonalRoleResults({ ids, onCourse }: Props) {
  const signature = [...ids].sort().join(',')
  const [shownSignature, setShownSignature] = useState<string | null>(null)
  const [data, setData] = useState<RoleData | null>(null)
  const [result, setResult] = useState<RoleInterpretation | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const stale = shownSignature !== null && shownSignature !== signature
  const titles = {
    single: '目前呈現一個探索方向',
    dual: '這些選擇，連結了兩個方向',
    multiple: '你的好奇，涵蓋多種方向',
    insufficient: '你的探索正在起步',
  }

  async function show() {
    const requestedSignature = signature
    setBusy(true)
    setFailed(false)
    try {
      const loaded = data ?? (await loadRoleData())
      setData(loaded)
      setResult(interpretRoles(ids, loaded))
      setShownSignature(requestedSignature)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="ca-role-results" aria-labelledby="ca-role-title">
      <div>
        <p className="ca-role-kicker">選用功能</p>
        <h3 id="ca-role-title">看看收藏連成哪些角色方向</h3>
        <p>這是課程線索的整理，不是人格、能力或職涯測驗，也不會替你排名。</p>
      </div>
      <Button variant="primary" onClick={show} disabled={ids.length === 0 || busy}>
        {busy
          ? '正在整理方向…'
          : result || stale
            ? '重新查看探索方向'
            : failed
              ? '重新讀取角色方向'
              : '看看我的探索方向'}
      </Button>
      {ids.length === 0 && <p role="status">先收藏感興趣的課程，再回來整理方向。</p>}
      {stale && <p role="status">收藏已更新，請重新查看探索方向。</p>}
      {failed && <p role="alert">角色方向暫時無法讀取，收藏資料沒有受到影響。</p>}
      {result && data && !stale && (
        <div className="ca-role-output" aria-live="polite">
          <h3 tabIndex={-1}>{titles[result.status]}</h3>
          <p>
            {result.status === 'insufficient'
              ? '目前只有片段線索；這不代表能力不足，可以繼續認識課程。'
              : `依目前 ${result.snapshot.length} 門收藏，呈現 ${result.directions.length} 個不分排名的方向。`}
          </p>
          <div className="ca-role-grid">
            {result.directions.map((role) => (
              <RoleCard key={role.characterId} role={role} data={data} onCourse={onCourse} />
            ))}
          </div>
          {result.partialDirections.length > 0 && (
            <details className="ca-role-secondary">
              <summary>其他學習線索（{result.partialDirections.length} 個方向）</summary>
              <ul>
                {result.partialDirections.map((role) => (
                  <li key={role.characterId}>
                    <strong>{role.name}</strong>：
                    {role.missingFacets.length
                      ? `尚缺少「${role.missingFacets.map((id) => data.roles.find((item) => item.id === role.characterId)!.facets[id]).join('」與「')}」的課程線索。`
                      : '目前以支援課程為主，尚未出現代表課程。'}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.pending.length > 0 && (
            <details className="ca-role-secondary">
              <summary>整合所學的課程（{result.pending.length} 門）</summary>
              <ul>
                {result.pending.map((row) => (
                  <li key={row.courseId}>
                    {row.courseName}：{row.pendingReason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}
