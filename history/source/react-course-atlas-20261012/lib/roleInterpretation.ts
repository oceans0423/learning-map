export const ROLE_RULE_VERSION = '2026-10-11-v0.2'

export interface RoleFacetEvidence {
  facetId: string
  abilityId: string
}

export interface RoleRelation {
  courseId: string
  courseName: string
  characterId: string
  relationType: '代表' | '支援'
  abilityFacets: RoleFacetEvidence[]
  reason: string
  limitations: string
}

export interface RoleDefinition {
  id: string
  name: string
  facets: Record<string, string>
  requiredFacets: string[]
}

export interface PendingRoleCourse {
  courseId: string
  courseName: string
  pendingReason: string
}

export interface RoleData {
  mappingVersion: string
  annotationVersion: string
  courseIds: string[]
  roles: RoleDefinition[]
  relations: RoleRelation[]
  pending: PendingRoleCourse[]
  abilityNames: Record<string, string>
}

export interface RoleDirection {
  characterId: string
  name: string
  evidence: RoleRelation[]
  facetEvidence: Array<{
    facetId: string
    label: string
    sources: Array<{ courseId: string; abilityId: string }>
  }>
  missingFacets: string[]
  hasRepresentative: boolean
  singleCourseEvidence: boolean
  limitations: string[]
}

export interface RoleInterpretation {
  ruleVersion: string
  mappingVersion: string
  annotationVersion: string
  snapshot: string[]
  ignoredIds: string[]
  invalidEntryCount: number
  status: 'insufficient' | 'single' | 'dual' | 'multiple'
  directions: RoleDirection[]
  partialDirections: RoleDirection[]
  pending: PendingRoleCourse[]
}

export async function loadRoleData(): Promise<RoleData> {
  const module = await import('../../doc/design/character-home-20261011/role-data.json')
  return module.default as unknown as RoleData
}

export function interpretRoles(input: unknown[], data: RoleData): RoleInterpretation {
  const validIds = new Set(data.courseIds)
  const snapshot = [
    ...new Set(input.filter((id): id is string => typeof id === 'string' && validIds.has(id))),
  ].sort()
  const ignoredIds = [
    ...new Set(input.filter((id): id is string => typeof id === 'string' && !validIds.has(id))),
  ].sort()
  const selected = new Set(snapshot)
  const directions: RoleDirection[] = []
  const partialDirections: RoleDirection[] = []

  for (const role of data.roles) {
    const evidence = data.relations
      .filter((row) => row.characterId === role.id && selected.has(row.courseId))
      .map((row) => structuredClone(row))
      .sort((a, b) => a.courseId.localeCompare(b.courseId))
    if (!evidence.length) continue
    const covered = new Set(
      evidence.flatMap((row) => row.abilityFacets.map((facet) => facet.facetId)),
    )
    const missingFacets = role.requiredFacets.filter((id) => !covered.has(id))
    const hasRepresentative = evidence.some((row) => row.relationType === '代表')
    const result: RoleDirection = {
      characterId: role.id,
      name: role.name,
      evidence,
      facetEvidence: role.requiredFacets.map((facetId) => ({
        facetId,
        label: role.facets[facetId],
        sources: evidence.flatMap((row) =>
          row.abilityFacets
            .filter((facet) => facet.facetId === facetId)
            .map((facet) => ({ courseId: row.courseId, abilityId: facet.abilityId })),
        ),
      })),
      missingFacets,
      hasRepresentative,
      singleCourseEvidence: evidence.length === 1,
      limitations: [...new Set(evidence.map((row) => row.limitations))],
    }
    ;(hasRepresentative && missingFacets.length === 0 ? directions : partialDirections).push(
      result,
    )
  }

  return {
    ruleVersion: ROLE_RULE_VERSION,
    mappingVersion: data.mappingVersion,
    annotationVersion: data.annotationVersion,
    snapshot,
    ignoredIds,
    invalidEntryCount: input.filter((id) => typeof id !== 'string').length,
    status:
      directions.length === 0
        ? 'insufficient'
        : directions.length === 1
          ? 'single'
          : directions.length === 2
            ? 'dual'
            : 'multiple',
    directions,
    partialDirections,
    pending: data.pending
      .filter((row) => selected.has(row.courseId))
      .map((row) => ({ ...row })),
  }
}
