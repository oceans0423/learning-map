"""Independent browser checks. Generates evidence; never rewrites course facts or UI."""
import hashlib
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
EVIDENCE = HERE / 'evidence'
EVIDENCE.mkdir(exist_ok=True)
URL = (HERE / 'index.html').as_uri()
errors = []
checks = []
QUICK = '--focused' in sys.argv


def check(condition, name):
    assert condition, name
    checks.append(name)


def app(page, expression):
    return page.evaluate("expression => { const s = Alpine.$data(document.body); return Function('s', 'return (' + expression + ')')(s) }", expression)


def ready(page, query=''):
    page.goto(URL + query)
    page.wait_for_function("window.Alpine && document.body.hasAttribute('data-page')")
    page.wait_for_function("Array.from(document.images).every(i => i.complete)")


def settled(page, view):
    page.wait_for_function("view => Alpine.$data(document.body).route.view === view && !Alpine.$data(document.body).navigationPending", arg=view)
    if view == 'overview':
        page.wait_for_function("!document.querySelector('dialog').open")
        page.wait_for_function("() => { const s = Alpine.$data(document.body); return s.route.page !== 'map' || !s.origin || document.activeElement.id === s.origin }")
    else:
        page.wait_for_function("document.querySelector('dialog').open")
    page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')


def screenshot(page, name, full=False):
    page.screenshot(path=str(EVIDENCE / name), full_page=full, animations='disabled')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    ready(page)
    facts = json.loads((ROOT / 'src/data/courses.json').read_text(encoding='utf-8'))['courses']
    data = page.evaluate('globalThis.learningStory')
    check(len(data['courses']) == len(facts) == 69, '69 courses loaded')
    for original in facts:
        actual = next(c for c in data['courses'] if c['id'] == original['id'])
        check(all(actual[key] == original[key] for key in ['name', 'year', 'semester', 'type', 'credits', 'module']), original['id'] + ' facts unchanged')
    source_hash = hashlib.sha256((ROOT / 'src/data/courses.json').read_bytes()).hexdigest().upper()
    check(source_hash == data['sourceHash'], 'source SHA256 unchanged')
    check(len(data['groups']) == 13, '13 original learning groups')
    check(page.locator('.world-card').count() == 4, 'four world selectors')
    check(page.locator('.world-selector').bounding_box()['y'] + page.locator('.world-selector').bounding_box()['height'] <= 844, 'all worlds visible at 390x844')
    check(page.locator('.scene-viewport').bounding_box()['y'] < 230, 'scene appears before 230px')
    check(page.evaluate('Array.from(document.images).every(i => i.naturalWidth > 0)'), 'all local images loaded')
    screenshot(page, 'entry-digital-390.png', True)

    # Horizontal drag changes the world; the last world does not wrap unexpectedly.
    bounds = page.locator('.scene-viewport').bounding_box()
    page.mouse.move(bounds['x'] + 250, bounds['y'] + 100)
    page.mouse.down()
    page.mouse.move(bounds['x'] + 100, bounds['y'] + 105, steps=8)
    page.mouse.up()
    check(app(page, 's.domain.id') == 'culture', 'mouse drag selects next world')
    check(page.locator('.scene-controls button').last.is_disabled(), 'last world boundary disabled')
    page.locator('.world-card').nth(0).click()
    check(page.locator('.scene-controls button').first.is_disabled(), 'first world boundary disabled')
    page.locator('.world-card').nth(2).click()

    # Real touch input (Chromium emulation), horizontal swipe vs native vertical scroll.
    cdp = context.new_cdp_session(page)
    bounds = page.locator('.scene-viewport').bounding_box()
    x, y = bounds['x'] + 240, bounds['y'] + 90
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x - 140, 'y': y + 2}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    page.wait_for_function("Alpine.$data(document.body).domain.id === 'culture'")
    check(app(page, 's.domain.id') == 'culture', 'touch swipe selects next world')
    page.locator('.world-card').nth(2).click()
    page.evaluate('scrollTo(0,0)')
    before = page.evaluate('scrollY')
    for kind, yy in [('touchStart', 410), ('touchMove', 370), ('touchMove', 300), ('touchMove', 210), ('touchEnd', 0)]:
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': 180, 'y': yy}]})
    page.wait_for_timeout(150)
    check(page.evaluate('scrollY') > before + 20, 'vertical touch scroll remains native')
    check(app(page, 's.domain.id') == 'digital', 'vertical touch does not change world')

    page.locator('.explore-button').click()
    check(app(page, 's.route.page') == 'map', 'entry to course map')
    check(page.locator('.course-row').count() == 12, 'all 12 digital courses displayed')
    screenshot(page, 'map-digital-390.png', True)
    page.locator('.year-nav a').nth(2).click()
    check(abs(page.locator('#year-3').bounding_box()['y'] - 24) < 3, 'year jump works without untracked history')
    page.locator('#course-049').click()
    settled(page, 'detail')
    map_scroll = app(page, 's.mapScroll')
    screenshot(page, 'detail-digital-390.png')
    check(page.evaluate('document.activeElement.classList.contains("close-button")'), 'dialog focuses close button')
    check(page.locator('main').evaluate('(m)=>m.inert'), 'background inert during dialog')
    for _ in range(8):
        page.keyboard.press('Tab')
        check(page.evaluate('document.querySelector("dialog").contains(document.activeElement)'), 'native modal traps Tab')
    page.locator('#relation-toggle').click()
    settled(page, 'relations')
    screenshot(page, 'relations-digital-390.png')
    check(page.locator('.related-course').count() == 5, 'five related digital-content courses')
    check(page.locator('.relation-years .here strong').inner_text() == '大三', 'current year visible in relationship summary')
    page.locator('.relation-years button').nth(2).click()
    screenshot(page, 'relations-current-390.png')
    page.locator('#related-course-030').scroll_into_view_if_needed()
    relation_scroll = page.locator('.sheet-body').evaluate('(e)=>e.scrollTop')
    page.locator('#related-course-030').click()
    settled(page, 'detail')
    check(app(page, 's.selected.id') == 'course-030', 'related course stays in same dialog')
    page.locator('.back-related').click()
    settled(page, 'relations')
    check(app(page, 's.selected.id') == 'course-049', 'related return restores original course')
    check(abs(page.locator('.sheet-body').evaluate('(e)=>e.scrollTop') - relation_scroll) < 2, 'relationship scroll restored exactly')
    check(page.evaluate('document.activeElement.id') == 'related-course-030', 'related trigger focus restored')
    page.keyboard.press('Escape')
    settled(page, 'overview')
    check(page.evaluate('document.activeElement.id') == 'course-049', 'Escape restores map trigger focus')
    check(abs(page.evaluate('scrollY') - map_scroll) < 2, 'map scroll restored exactly after year jump and related visit')
    check(not page.locator('main').evaluate('(m)=>m.inert'), 'background unlocked')
    screenshot(page, 'returned-digital-390.png')

    # Browser history is part of the interaction, not just custom buttons.
    page.locator('#course-049').click()
    page.locator('#relation-toggle').click()
    page.go_back()
    settled(page, 'detail')
    check(app(page, 's.selected.id') == 'course-049', 'browser Back: relations to detail')
    page.go_back()
    settled(page, 'overview')
    check(page.evaluate('document.activeElement.id') == 'course-049', 'browser Back: detail to original course')
    page.go_forward()
    settled(page, 'detail')
    page.locator('.close-button').click()
    settled(page, 'overview')
    page.go_back()
    check(app(page, 's.route.page') == 'entry', 'browser Back: map to entrance')

    # Four areas: 69 actual open/relations/close cycles, including original facts.
    expected = {'thinking': [6,4,1,2], 'narrative': [2,10,11,3], 'digital': [3,3,4,2], 'culture': [1,6,7,4]}
    for area, counts in ([] if QUICK else expected.items()):
        print('Checking course cycles: ' + area, flush=True)
        ready(page, '?area=' + area + '&state=overview')
        check(page.locator('.course-row').count() == sum(counts), area + ' full course list')
        check([page.locator('#year-' + str(y) + ' .course-row').count() for y in range(1,5)] == counts, area + ' four-year counts')
        for course in [c for c in data['courses'] if c['area'] == area]:
            page.locator('#' + course['id']).click()
            settled(page, 'detail')
            check(page.locator('#sheet-title').inner_text() == course['name'], course['id'] + ' opens')
            page.locator('#relation-toggle').click()
            settled(page, 'relations')
            check(page.locator('.related-course.current').count() == 1, course['id'] + ' current marker')
            page.locator('.close-button').click()
            settled(page, 'overview')
            check(page.evaluate('document.activeElement.id') == course['id'], course['id'] + ' restores focus')

    # Responsive pressure cases: entire text, no horizontal overflow, visible dialog close.
    for width, height in ([] if QUICK else [(320,740), (390,844), (768,1024), (1280,900)]):
        print('Checking viewport: ' + str(width), flush=True)
        page.set_viewport_size({'width': width, 'height': height})
        for area in expected:
            ready(page, '?area=' + area)
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{area} entrance no overflow {width}')
            for button in page.locator('.world-card').all():
                check(button.bounding_box()['height'] >= 44, f'world target >=44px {width}')
                check(button.locator('strong').evaluate('(e)=>e.scrollWidth <= e.clientWidth + 1'), f'full domain label fits {width}')
            if area == 'digital' or width == 320:
                screenshot(page, f'entry-{area}-{width}.png', True)
            ready(page, '?area=' + area + '&state=overview')
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{area} map no overflow {width}')
            page.locator('.course-row').last.click()
            settled(page, 'detail')
            close = page.locator('.close-button').bounding_box()
            check(close['width'] >= 43.99 and close['height'] >= 43.99 and close['x'] + close['width'] <= width + .01, f'{area} visible close target {width}: {close}')
            page.locator('#relation-toggle').click()
            check(page.locator('dialog').evaluate('(e)=>e.scrollWidth <= e.clientWidth'), f'{area} relations no overflow {width}')
            if area == 'narrative' and width in [320,1280]:
                screenshot(page, f'relations-narrative-{width}.png')
        ready(page, '?area=digital&state=overview')
        screenshot(page, f'map-digital-{width}.png', True)

    # Cross-domain selection preserves the original group, domain and return origin.
    page.set_viewport_size({'width': 320, 'height': 740})
    ready(page, '?area=narrative&state=relations&course=course-046')
    settled(page, 'relations')
    check(app(page, 's.relation.id') == 'nature-writing', 'cross-domain original relation')
    page.locator('#related-course-013').click()
    settled(page, 'detail')
    check(app(page, 's.domain.id') == 'narrative' and app(page, 's.selected.area') == 'thinking', 'cross-domain retains map context')
    page.locator('#relation-toggle').click()
    check(app(page, 's.relation.id') == 'nature-writing', 'cross-domain retains relationship')
    screenshot(page, 'cross-domain-320.png')
    page.locator('.back-related').click()
    settled(page, 'relations')
    check(app(page, 's.selected.id') == 'course-046', 'cross-domain return')
    page.locator('.close-button').click()
    settled(page, 'overview')
    check(page.evaluate('document.activeElement.id') == 'course-046', 'cross-domain original trigger: ' + page.evaluate('document.activeElement.id') + '; origin: ' + str(app(page, 's.origin')))

    ready(page, '?area=unknown&state=relations&course=missing')
    settled(page, 'relations')
    check(app(page, 's.domain.id') == 'digital' and app(page, 's.selected.id') == 'course-049', 'invalid deep-link safely falls back')
    page.locator('.close-button').click()
    settled(page, 'overview')
    ready(page, '?area=digital&state=relations&course=course-049')
    settled(page, 'relations')
    page.locator('.relation-back').click()
    settled(page, 'detail')
    check(app(page, 's.selected.id') == 'course-049', 'direct relationship link can return to introduction without leaving the document')
    page.locator('#relation-toggle').click()
    settled(page, 'relations')
    page.locator('.close-button').click()
    settled(page, 'overview')

    # Image failure keeps text, counts, selection and exploration usable.
    blocked = browser.new_context(viewport={'width':390, 'height':844})
    fallback = blocked.new_page()
    fallback.on('pageerror', lambda error: errors.append(str(error)))
    fallback.route('**/*.webp', lambda route: route.abort())
    ready(fallback)
    check(fallback.locator('.world-card').count() == 4, 'image failure keeps all selectors')
    fallback.locator('.explore-button').click()
    fallback.locator('#course-008').click()
    settled(fallback, 'detail')
    check(fallback.locator('#sheet-title').inner_text() == '數位人文方法與應用', 'image failure keeps course flow')
    blocked.close()

    reduced = browser.new_context(viewport={'width':320, 'height':740}, reduced_motion='reduce')
    quiet = reduced.new_page()
    quiet.on('pageerror', lambda error: errors.append(str(error)))
    ready(quiet, '?state=detail')
    settled(quiet, 'detail')
    check(quiet.locator('dialog').evaluate('(e)=>getComputedStyle(e).animationName') == 'none', 'reduced motion removes dialog animation')
    quiet.locator('#relation-toggle').click()
    check(quiet.locator('#learning-relations').evaluate('(e)=>getComputedStyle(e).transitionDuration') == '0s', 'reduced motion removes relation transition')
    reduced.close()

    # Actual 200% text-size stress, not device scale factor / a claim of browser zoom.
    ready(page, '?area=culture')
    page.evaluate("""() => {
      const items = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,button,a,small,strong,span,figcaption')).map(e => [e, parseFloat(getComputedStyle(e).fontSize)]);
      items.forEach(([e,size]) => e.style.setProperty('font-size', (size * 2) + 'px', 'important'));
    }""")
    check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), '200% text-size entrance no horizontal overflow')
    screenshot(page, 'text-size-200-percent-320.png', True)
    check(not errors, 'no browser JS/console errors')

    # Serving URL confirmed independently of file:// preview.
    served = browser.new_page()
    response = served.goto('http://127.0.0.1:8776/doc/design/four-worlds-20261010/creative-studio/index.html')
    check(response.status == 200 and served.locator('.world-card').count() == 4, 'localhost preview serves the new prototype')
    served.close()
    context.close()
    browser.close()

report = {'checksPassed':len(checks), 'checks': checks, 'sourceSHA256': source_hash, 'errors': errors,
          'limits':['Chromium emulation, not a real phone', 'Text-size stress is not browser UI zoom', 'No student comprehension test or screen-reader certification']}
(EVIDENCE / ('focused-results.json' if QUICK else 'results.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'PASS: {len(checks)} checks; suite: {"focused" if QUICK else "full"}; touch, keyboard, Back, focus, scroll, image fallback, reduced motion.')
