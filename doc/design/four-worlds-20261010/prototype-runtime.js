/* global window, document, URLSearchParams */
document.addEventListener('alpine:init', () => {
  window.Alpine.data('atlas', () => ({
    areas: window.ATLAS_DATA.areas,
    courses: window.ATLAS_DATA.courses,
    selected: 0,
    screen: 'home',
    savedIds: [],
    detail: null,
    query: '',
    yearFilter: '0',
    typeFilter: 'all',
    page: 1,
    pageSize: 12,
    homeScroll: 0,
    returnScreen: 'home',
    courseTrigger: null,
    gestureCleanup: null,
    years: [1, 2, 3, 4],
    init() {
      this.entryTimer = window.setTimeout(() => this.$root.classList.remove('first-entry'), 600)
      const params = new URLSearchParams(window.location.search)
      const areaId = params.get('area')
      const state = params.get('state')
      if (areaId)
        this.selected = Math.max(
          0,
          this.areas.findIndex((area) => area.id === areaId),
        )
      else if (state === 'domain' || state === 'detail') this.selected = 2
      if (['home', 'domain', 'catalog', 'saved'].includes(state)) this.screen = state
      this.gestureCleanup = window.attachAtlasGestures(this.$root, (direction) =>
        this.shiftArea(direction),
      )
      if (state === 'detail') {
        this.screen = 'domain'
        this.$nextTick(() =>
          this.openDetails(this.courses.find((course) => course.id === 'course-068')),
        )
      }
      if (window.top === window) {
        window.history.replaceState(
          { atlasNavigation: true, screen: this.screen, selected: this.selected },
          '',
        )
        this.popstate = (event) => {
          if (!event.state?.atlasNavigation || window.location.hash.startsWith('#year-')) return
          if (this.$refs.details.open) this.$refs.details.close()
          this.screen = event.state.screen
          this.selected = event.state.selected
          this.$nextTick(() => window.scrollTo(0, 0))
        }
        window.addEventListener('popstate', this.popstate)
      }
    },
    destroy() {
      window.clearTimeout(this.entryTimer)
      this.gestureCleanup?.()
      if (this.popstate) window.removeEventListener('popstate', this.popstate)
    },
    get area() {
      return this.areas[this.selected]
    },
    get domainCourses() {
      return this.courses.filter((course) => course.area === this.selected)
    },
    get savedCourses() {
      return this.courses.filter((course) => this.savedIds.includes(course.id))
    },
    get filteredCourses() {
      const query = this.query.trim().toLocaleLowerCase('zh-TW')
      return this.courses.filter(
        (course) =>
          (!query ||
            `${course.name} ${this.areas[course.area].name}`
              .toLocaleLowerCase('zh-TW')
              .includes(query)) &&
          (this.yearFilter === '0' || course.year === Number(this.yearFilter)) &&
          (this.typeFilter === 'all' || course.type === this.typeFilter),
      )
    },
    get totalPages() {
      return Math.max(1, Math.ceil(this.filteredCourses.length / this.pageSize))
    },
    get results() {
      return this.filteredCourses.slice(
        (this.page - 1) * this.pageSize,
        this.page * this.pageSize,
      )
    },
    coursesFor(year, semester) {
      return this.domainCourses.filter(
        (course) => course.year === year && course.semester === semester,
      )
    },
    countFor(year) {
      return this.domainCourses.filter((course) => course.year === year).length
    },
    yearName(year) {
      return ['大一', '大二', '大三', '大四'][year - 1]
    },
    courseMeta(course) {
      return `${this.yearName(course.year)}・${course.semester === 1 ? '上' : '下'}學期・${course.type === 'required' ? '必修' : '選修'}・${course.credits} 學分`
    },
    focusArea(index) {
      if (index === this.selected) return
      const direction = index > this.selected ? 1 : -1
      this.selected = index
      this.$nextTick(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        this.$root.querySelectorAll('.gesture-content').forEach((element) => {
          element.getAnimations().forEach((animation) => animation.cancel())
          element.animate(
            [
              { opacity: 0.8, transform: `translateX(${12 * direction}px)` },
              { opacity: 1, transform: 'translateX(0)' },
            ],
            { duration: 200, easing: 'cubic-bezier(.2,.7,.2,1)' },
          )
        })
      })
    },
    shiftArea(direction) {
      const next = this.selected + direction
      if (next >= 0 && next < this.areas.length) this.focusArea(next)
    },
    go(screen) {
      if (screen === this.screen) return
      if (this.screen === 'home') this.homeScroll = window.scrollY
      if (window.top === window)
        window.history.replaceState(
          { atlasNavigation: true, screen: this.screen, selected: this.selected },
          '',
        )
      this.returnScreen = this.screen
      this.screen = screen
      if (window.top === window) {
        const nextUrl = new window.URL(window.location.href)
        nextUrl.hash = ''
        nextUrl.searchParams.set('state', screen)
        nextUrl.searchParams.set('area', this.area.id)
        window.history.pushState(
          { atlasNavigation: true, screen, selected: this.selected },
          '',
          nextUrl,
        )
      }
      this.$nextTick(() => {
        window.scrollTo(0, screen === 'home' ? this.homeScroll : 0)
        if (screen === 'catalog') this.$refs.search.focus({ preventScroll: true })
        else
          this.$root
            .querySelector(`[data-screen="${screen}"] h2`)
            ?.focus({ preventScroll: true })
        const heading = this.$root.querySelector(
          `[data-screen="${screen}"] .domain-intro, [data-screen="${screen}"] .selected-info`,
        )
        if (heading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
          heading.animate(
            [
              { opacity: 0.75, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' },
          )
      })
    },
    showAll() {
      this.query = ''
      this.yearFilter = '0'
      this.typeFilter = 'all'
      this.page = 1
      this.go('catalog')
    },
    toggleSaved(id) {
      this.savedIds = this.savedIds.includes(id)
        ? this.savedIds.filter((value) => value !== id)
        : [...this.savedIds, id]
    },
    openDetails(course, event) {
      this.detail = course
      this.courseTrigger = event?.currentTarget || document.activeElement
      this.$nextTick(() => {
        this.$refs.details.showModal()
        this.$refs.closeDetails.focus()
      })
    },
    closeDetails() {
      this.$refs.details.close()
    },
    restoreFocus() {
      this.courseTrigger?.focus({ preventScroll: true })
    },
  }))
})
