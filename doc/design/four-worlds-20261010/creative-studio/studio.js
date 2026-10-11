/* global window, document, location, history, URL, URLSearchParams */
/* Reuses the existing facts, getters and tested relation navigation; no production state. */
window.creativeStudio = function () {
  const studio = window.learningPreview()
  const initial = new URLSearchParams(location.search).get('state')
  Object.assign(studio, {
    screen: true,
    embedded: false,
    route: {
      view: 'overview',
      page: ['overview', 'detail', 'relations', 'return'].includes(initial) ? 'map' : 'entry',
      id: null,
      group: null,
      depth: 0,
      trail: [],
      scroll: 0,
    },
    drag: null,
    announcement: '',
    entryScroll: 0,
    visuals: {
      thinking: {
        activity: '觀察・提問・理解',
        caption: '從生活裡，發現值得追問的事',
        alt: '陽光下的巷角，畫架與畫具呈現觀察地方的場景。',
        position: '48% 55%',
      },
      narrative: {
        activity: '閱讀・創作・表達',
        caption: '把想像，變成能被讀懂的內容',
        alt: '窗邊創作角落，書本、畫紙與工具展現取材和創作的空間。',
        position: '62% 55%',
      },
      digital: {
        activity: '材料・分析・數位呈現',
        caption: '一張地圖，可以有新的讀法',
        alt: '研究工作桌上有紙本地圖、照片與筆電，紙本材料和螢幕上的資料彼此呼應。',
        position: '66% 52%',
      },
      culture: {
        activity: '理解・策劃・實踐',
        caption: '讓文化走進人們的生活',
        alt: '陽光下的庭院正在佈置展覽，展架與材料帶出文化活動的準備現場。',
        position: '50% 58%',
      },
    },
    art(area, kind) {
      return '../assets/' + area + '-' + kind + '.webp'
    },
    crop(area) {
      return 'object-position: ' + this.visuals[area].position
    },
    countFor(area) {
      return this.data.courses.filter((course) => course.area === area).length
    },
    courseMeta(course) {
      return (
        this.labelForYear(course.year) +
        '・' +
        (course.semester === 1 ? '上學期' : '下學期') +
        '・' +
        (course.type === 'required' ? '必修' : '選修') +
        '・' +
        course.credits +
        ' 學分'
      )
    },
    urlFor(area, state = 'entry', id = null) {
      const url = new URL(location.href)
      url.search = ''
      url.hash = ''
      url.searchParams.set('area', area)
      url.searchParams.set('state', state)
      if (id) url.searchParams.set('course', id)
      return url.href
    },
    selectArea(id) {
      if (!this.data.areas.some((area) => area.id === id)) return
      this.areaId = id
      this.route.area = id
      history.replaceState(this.record(this.route), '', this.urlFor(id))
    },
    shiftArea(delta) {
      const next = this.data.areas[this.areaIndex + delta]
      if (next) this.selectArea(next.id)
    },
    dragStart(event) {
      if (event.target.closest('button') || !event.isPrimary || event.button !== 0) return
      this.drag = { x: event.clientX, y: event.clientY, id: event.pointerId }
      if (event.pointerType === 'mouse') this.$refs.scene.setPointerCapture(event.pointerId)
    },
    dragEnd(event) {
      if (!this.drag || this.drag.id !== event.pointerId) return
      const dx = event.clientX - this.drag.x
      const dy = event.clientY - this.drag.y
      this.drag = null
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3)
        this.shiftArea(dx < 0 ? 1 : -1)
    },
    record(route) {
      return JSON.parse(
        JSON.stringify({
          learningPreview: true,
          creativeStudio: true,
          ...route,
          origin: this.origin,
          mapScroll: this.mapScroll,
          entryScroll: this.entryScroll,
        }),
      )
    },
    enterDomain() {
      this.entryScroll = window.scrollY
      this.origin = null
      this.returned = false
      this.mapScroll = 0
      this.pushRoute({
        view: 'overview',
        page: 'map',
        area: this.areaId,
        id: null,
        group: null,
        depth: 0,
        trail: [],
        scroll: 0,
      })
      this.$nextTick(() =>
        document.getElementById('domain-title')?.focus({ preventScroll: true }),
      )
    },
    goEntry() {
      if (this.route.page === 'entry') return
      this.mapScroll = window.scrollY
      this.pushRoute({
        view: 'overview',
        page: 'entry',
        area: this.areaId,
        id: null,
        group: null,
        depth: 0,
        trail: [],
        scroll: 0,
      })
      this.$nextTick(() =>
        document.querySelector('.world-card.selected')?.focus({ preventScroll: true }),
      )
    },
    init() {
      this.areaId = this.domain.id
      this.route.area = this.areaId
      history.scrollRestoration = 'manual'
      const restored =
        history.state?.creativeStudio &&
        window.performance.getEntriesByType('navigation')[0]?.type === 'back_forward'
          ? history.state
          : null
      window.addEventListener('popstate', (event) => {
        if (!event.state?.learningPreview) return
        this.navigationPending = false
        this.applyRoute(event.state)
        if (this.closeQueued) {
          this.closeQueued = false
          if (this.route.view !== 'overview') this.closeCourse()
        }
      })
      if (restored) {
        this.applyRoute(restored)
        return
      }
      history.replaceState(
        this.record(this.route),
        '',
        this.urlFor(this.areaId, this.route.page === 'entry' ? 'entry' : 'overview'),
      )
      if (['detail', 'relations', 'return'].includes(initial)) {
        // Read the original query before normalization removes the deep-link course.
        const requested = this.initialCourse
        this.$nextTick(() => {
          const course = this.data.courses.find((item) => item.id === requested)
          const id = course?.id || this.domain.representative
          const origin = this.domainCourses.some((item) => item.id === id)
            ? id
            : this.domain.representative
          const button = document.getElementById(origin)
          if (!button) return
          const bounds = button.getBoundingClientRect()
          window.scrollTo({
            top: bounds.top + window.scrollY - window.innerHeight / 2 + bounds.height / 2,
            behavior: 'instant',
          })
          this.mapScroll = window.scrollY
          this.origin = origin
          if (initial === 'return') {
            this.returned = true
            button.focus({ preventScroll: true })
          } else {
            // A direct link starts here; it should not fabricate two Back entries.
            // In long sessions Chromium can prune unactivated synthetic entries.
            const next = this.record({
              view: initial,
              page: 'map',
              area: this.areaId,
              id,
              group:
                course?.relationId ||
                this.data.courses.find((item) => item.id === id).relationId,
              depth: 0,
              trail: [],
              scroll: 0,
            })
            history.replaceState(next, '', this.urlFor(this.areaId, initial, id))
            this.applyRoute(next)
          }
        })
      }
    },
    pushRoute(next) {
      if (this.route.view !== 'overview') {
        this.route.scroll = this.$refs.sheetBody.scrollTop
      }
      if (
        this.route.page === 'map' &&
        this.origin &&
        !this.domainCourses.some((course) => course.id === this.origin)
      )
        this.origin = this.domain.representative
      history.replaceState(this.record(this.route), '', location.href)
      const record = this.record({ page: this.route.page, area: this.areaId, ...next })
      history.pushState(
        record,
        '',
        this.urlFor(
          record.area,
          record.view === 'overview'
            ? record.page === 'entry'
              ? 'entry'
              : 'overview'
            : record.view,
          record.id,
        ),
      )
      this.applyRoute(record)
    },
    applyRoute(next) {
      const old = this.route
      const oldScroll = this.$refs.sheetBody.scrollTop
      this.route = next
      this.areaId = next.area || this.areaId
      if ('origin' in next) this.origin = next.origin
      this.mapScroll = next.mapScroll ?? this.mapScroll
      this.entryScroll = next.entryScroll ?? this.entryScroll
      this.$nextTick(() => {
        const sheet = this.$refs.sheet
        if (next.view === 'overview') {
          if (sheet.open) sheet.close()
          this.$refs.map.inert = false
          document.documentElement.style.overflow = ''
          if (next.page === 'entry') {
            window.scrollTo({ top: this.entryScroll, behavior: 'instant' })
            document.querySelector('.world-card.selected')?.focus({ preventScroll: true })
          } else {
            this.returned = Boolean(this.origin)
            window.scrollTo({ top: this.mapScroll, behavior: 'instant' })
            document.getElementById(this.origin)?.focus({ preventScroll: true })
            if (this.origin) this.announcement = '已回到「' + this.nameFor(this.origin) + '」'
          }
        } else {
          document.documentElement.style.overflow = 'hidden'
          this.$refs.map.inert = true
          if (!sheet.open) sheet.showModal()
          this.$refs.sheetBody.scrollTop = next.scroll || 0
          if (old.id !== next.id) {
            this.$refs.close.focus({ preventScroll: true })
            this.announcement = '正在查看「' + this.nameFor(next.id) + '」'
          } else if (next.view === 'relations' && old.view !== 'relations') {
            // The whole relation replaces the detail in-place; nothing is hidden behind it.
            document.getElementById('relation-title')?.focus({ preventScroll: true })
          } else if (next.view === 'detail' && old.view === 'relations') {
            document.getElementById('relation-toggle')?.focus({ preventScroll: true })
          }
          if (old.id !== next.id && old.depth > next.depth) {
            // Return to the related-course trigger and the exact relation reading position.
            document.getElementById('related-' + old.id)?.focus({ preventScroll: true })
          }
          if (old.id === next.id && old.view === next.view)
            this.$refs.sheetBody.scrollTop = oldScroll
        }
      })
    },
    toggleRelations() {
      if (!this.hasRelation || this.navigationPending) return
      if (this.route.view === 'relations' && this.route.depth === 0) {
        const next = this.record({ ...this.route, view: 'detail', scroll: 0 })
        history.replaceState(next, '', this.urlFor(this.areaId, 'detail', next.id))
        this.applyRoute(next)
      } else if (this.route.view === 'relations') this.navigateBack(-1)
      else this.pushRoute({ ...this.route, view: 'relations', depth: this.route.depth + 1 })
    },
    closeCourse() {
      if (this.navigationPending) {
        this.closeQueued = true
        return
      }
      if (this.route.depth > 0) {
        this.closeQueued = true
        this.navigateBack(-this.route.depth)
      } else if (this.route.view !== 'overview') {
        const next = this.record({
          view: 'overview',
          page: 'map',
          area: this.areaId,
          id: null,
          group: null,
          depth: 0,
          trail: [],
          scroll: 0,
        })
        history.replaceState(next, '', this.urlFor(this.areaId, 'overview'))
        this.applyRoute(next)
      }
    },
    trapFocus(event) {
      const nodes = Array.from(
        this.$refs.sheet.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]'),
      ).filter((node) => node.getClientRects().length)
      const first = nodes[0]
      const last = nodes.at(-1)
      if (
        event.shiftKey &&
        (document.activeElement === first || !this.$refs.sheet.contains(document.activeElement))
      ) {
        event.preventDefault()
        last?.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !this.$refs.sheet.contains(document.activeElement))
      ) {
        event.preventDefault()
        first?.focus()
      }
    },
    jumpMapYear(year) {
      document
        .getElementById('year-' + year)
        ?.scrollIntoView({ block: 'start', behavior: 'instant' })
      this.mapScroll = window.scrollY
      // Keep year jumps out of the overlay history depth, preserving exact close/back behavior.
      const url = new URL(location.href)
      url.hash = 'year-' + year
      history.replaceState(this.record(this.route), '', url.href)
    },
    skipToMain() {
      if (this.route.page === 'entry') document.getElementById('focus-title')?.focus()
      else {
        this.jumpMapYear(1)
        const title = document.getElementById('year-title-1')
        title?.setAttribute('tabindex', '-1')
        title?.focus({ preventScroll: true })
      }
    },
    jumpRelationYear(year) {
      document
        .getElementById('relation-year-' + year)
        ?.scrollIntoView({ block: 'start', behavior: 'instant' })
    },
  })
  Object.defineProperty(studio, 'areaIndex', {
    get() {
      return this.data.areas.findIndex((area) => area.id === this.domain.id)
    },
  })
  studio.initialCourse = new URLSearchParams(location.search).get('course')
  return studio
}
