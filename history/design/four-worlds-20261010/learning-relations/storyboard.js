/* global window, URLSearchParams, location, URL, history, document */
/* 獨立設計小樣：不讀寫正式收藏、不接入正式路由。 */
window.learningPreview = function () {
  return {
    screen: new URLSearchParams(location.search).get('mode') === 'screen',
    embedded: new URLSearchParams(location.search).get('embedded') === '1',
    route: { view: 'overview', id: null, group: null, depth: 0, trail: [], scroll: 0 },
    areaId: new URLSearchParams(location.search).get('area') || 'digital',
    origin: null,
    mapScroll: 0,
    returned: false,
    navigationPending: false,
    closeQueued: false,
    data: globalThis.learningStory,
    steps: [
      {
        state: 'overview',
        title: '01｜四年總覽',
        text: '先看完整安排，課程名稱旁直接說明學習內容。',
      },
      {
        state: 'detail',
        title: '02｜查看一門課',
        text: '點開一門課，先理解內容與能力，再決定是否看關聯。',
      },
      {
        state: 'relations',
        title: '03｜展開學習關聯',
        text: '同一個面板內，按年級看相關課程與連結理由。',
      },
      {
        state: 'return',
        title: '04｜回到閱讀位置',
        text: '關閉面板，回到剛才的課程、捲動位置與操作焦點。',
      },
    ],
    get domain() {
      return this.data.areas.find((area) => area.id === this.areaId) || this.data.areas[2]
    },
    get domainCourses() {
      return this.data.courses.filter((course) => course.area === this.domain.id)
    },
    get selected() {
      return this.data.courses.find((course) => course.id === this.route.id)
    },
    get relation() {
      return this.data.groups.find(
        (group) => group.id === (this.route.group || this.selected?.relationId),
      )
    },
    get hasRelation() {
      return Boolean(this.relation?.members.some((member) => member.id === this.route.id))
    },
    get previous() {
      return this.route.trail.at(-1)
    },
    coursesForYear(year) {
      return this.domainCourses.filter((course) => course.year === year)
    },
    relatedForYear(year) {
      return (this.relation?.members || [])
        .map((member) => ({
          ...this.data.courses.find((course) => course.id === member.id),
          reason: member.reason,
        }))
        .filter((course) => course.year === year)
        .sort(
          (left, right) => left.semester - right.semester || left.id.localeCompare(right.id),
        )
    },
    labelForYear(year) {
      return ['大一', '大二', '大三', '大四'][year - 1]
    },
    nameFor(id) {
      return this.data.courses.find((course) => course.id === id)?.name || ''
    },
    domainName(id) {
      return this.data.areas.find((area) => area.id === id)?.name || ''
    },
    boardUrl(area) {
      const url = new URL(location.href)
      url.search = ''
      url.hash = ''
      url.searchParams.set('area', area)
      return url.href
    },
    screenUrl(state, embedded = false, area = this.domain.id) {
      const url = new URL(location.href)
      url.search = ''
      url.hash = ''
      url.searchParams.set('mode', 'screen')
      url.searchParams.set('area', area)
      if (state) url.searchParams.set('state', state)
      if (embedded) url.searchParams.set('embedded', '1')
      return url.href
    },
    init() {
      this.areaId = this.domain.id
      if (!this.screen) return
      history.replaceState(
        JSON.parse(JSON.stringify({ learningPreview: true, ...this.route })),
        '',
        location.href,
      )
      window.addEventListener('popstate', (event) => {
        if (!event.state?.learningPreview) return
        this.navigationPending = false
        this.applyRoute(event.state)
        if (this.closeQueued) {
          this.closeQueued = false
          if (this.route.depth > 0) this.closeCourse()
        }
      })
      const initial = new URLSearchParams(location.search).get('state')
      if (['detail', 'relations', 'return'].includes(initial)) {
        this.$nextTick(() => {
          const requested = new URLSearchParams(location.search).get('course')
          const id = this.domainCourses.some((course) => course.id === requested)
            ? requested
            : this.domain.representative
          const button = document.getElementById(id)
          if (!button) return
          const bounds = button.getBoundingClientRect()
          window.scrollTo({
            top: bounds.top + window.scrollY - window.innerHeight / 2 + bounds.height / 2,
            behavior: 'instant',
          })
          this.origin = id
          this.mapScroll = window.scrollY
          if (initial === 'return') {
            this.returned = true
            button.focus({ preventScroll: true })
          } else {
            this.openCourse(id)
            if (initial === 'relations') this.toggleRelations()
          }
        })
      }
    },
    pushRoute(next) {
      if (this.route.view !== 'overview') {
        this.route.scroll = this.$refs.sheetBody.scrollTop
        history.replaceState(
          JSON.parse(JSON.stringify({ learningPreview: true, ...this.route })),
          '',
          location.href,
        )
      }
      const record = JSON.parse(JSON.stringify({ learningPreview: true, ...next }))
      history.pushState(record, '', location.href)
      this.applyRoute(record)
    },
    applyRoute(next) {
      const oldId = this.route.id
      this.route = next
      this.$nextTick(() => {
        const sheet = this.$refs.sheet
        if (!sheet) return
        if (this.route.view === 'overview') {
          if (sheet.open) sheet.close()
          this.$refs.map.inert = false
          document.documentElement.style.overflow = ''
          this.returned = Boolean(this.origin)
          window.scrollTo({ top: this.mapScroll, behavior: 'instant' })
          document.getElementById(this.origin)?.focus({ preventScroll: true })
        } else {
          if (!sheet.open) {
            document.documentElement.style.overflow = 'hidden'
            if (this.embedded) {
              sheet.setAttribute('open', '')
              this.$refs.map.inert = true
            } else sheet.showModal()
            this.$refs.close.focus({ preventScroll: true })
          }
          if (oldId !== this.route.id) this.$refs.sheetBody.scrollTop = this.route.scroll || 0
        }
      })
    },
    openCourse(id) {
      if (this.navigationPending) return
      if (!this.data.courses.some((course) => course.id === id)) return
      let trail = []
      if (this.route.view === 'overview') {
        this.origin = id
        this.mapScroll = window.scrollY
        this.returned = false
      } else {
        trail = [
          ...this.route.trail,
          { id: this.route.id, view: this.route.view, depth: this.route.depth },
        ]
      }
      const course = this.data.courses.find((item) => item.id === id)
      const group =
        this.route.view !== 'overview' &&
        this.relation?.members.some((member) => member.id === id)
          ? this.relation.id
          : course.relationId
      this.pushRoute({
        view: 'detail',
        id,
        group,
        depth: this.route.depth + 1,
        trail,
        scroll: 0,
      })
    },
    toggleRelations() {
      if (!this.hasRelation || this.navigationPending) return
      if (this.route.view === 'relations') this.navigateBack(-1)
      else this.pushRoute({ ...this.route, view: 'relations', depth: this.route.depth + 1 })
    },
    navigateBack(delta) {
      if (this.navigationPending) return
      this.navigationPending = true
      history.go(delta)
    },
    backWithinSheet() {
      if (this.previous) this.navigateBack(this.previous.depth - this.route.depth)
    },
    closeCourse() {
      if (this.navigationPending) {
        this.closeQueued = true
        return
      }
      if (this.route.depth > 0) this.navigateBack(-this.route.depth)
    },
  }
}
