import { describe, expect, it } from 'vitest'
import { interpretRoles, loadRoleData } from './roleInterpretation'

describe('interpretRoles', () => {
  it('returns an insufficient result without inventing a default role', async () => {
    const result = interpretRoles([], await loadRoleData())
    expect(result.status).toBe('insufficient')
    expect(result.directions).toEqual([])
  })

  it('deduplicates valid IDs and reports invalid input', async () => {
    const result = interpretRoles(
      ['course-001', 'course-001', 'unknown', 1],
      await loadRoleData(),
    )
    expect(result.snapshot).toEqual(['course-001'])
    expect(result.ignoredIds).toEqual(['unknown'])
    expect(result.invalidEntryCount).toBe(1)
  })

  it('requires representative evidence and every required facet', async () => {
    const roleData = await loadRoleData()
    const representative = roleData.relations.find((row) => row.relationType === '代表')!
    const result = interpretRoles([representative.courseId], roleData)
    const role = roleData.roles.find((item) => item.id === representative.characterId)!
    const direction = result.directions.find((item) => item.characterId === role.id)
    const partial = result.partialDirections.find((item) => item.characterId === role.id)
    expect(direction ?? partial).toBeDefined()
    if (direction) {
      expect(direction.hasRepresentative).toBe(true)
      expect(direction.missingFacets).toEqual([])
    } else {
      expect(partial?.missingFacets.length).toBeGreaterThan(0)
    }
  })

  it('keeps the fixed role order instead of ranking with a score', async () => {
    const roleData = await loadRoleData()
    const result = interpretRoles(roleData.courseIds, roleData)
    const order = roleData.roles.map((role) => role.id)
    expect(result.directions.map((role) => role.characterId)).toEqual(
      [...result.directions.map((role) => role.characterId)].sort(
        (a, b) => order.indexOf(a) - order.indexOf(b),
      ),
    )
  })
})
