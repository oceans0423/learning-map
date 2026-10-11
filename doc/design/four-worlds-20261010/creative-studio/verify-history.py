"""Regression: fresh deep link after an existing map document."""
from pathlib import Path
from playwright.sync_api import sync_playwright

url = (Path(__file__).resolve().parent / 'index.html').as_uri()
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1280, 'height':900}, is_mobile=True, has_touch=True)
    page.goto(url + '?area=digital&state=overview')
    page.wait_for_function('window.Alpine && document.body.hasAttribute("data-page")')
    for index in range(55):
        page.goto(url + '?area=digital&state=overview&visit=' + str(index))
    page.set_viewport_size({'width':320, 'height':740})
    page.goto(url + '?area=narrative&state=relations&course=course-046')
    page.wait_for_function('Alpine.$data(document.body).route.view === "relations"')
    session = page.context.new_cdp_session(page)
    print('DEEP HISTORY TAIL', session.send('Page.getNavigationHistory')['entries'][-4:])
    print('DEEP STATE', page.evaluate('JSON.stringify(history.state)'))
    page.locator('#related-course-013').click()
    page.locator('#relation-toggle').click()
    page.locator('.back-related').click()
    page.wait_for_function('Alpine.$data(document.body).selected?.id === "course-046"')
    print('BACK HISTORY TAIL', session.send('Page.getNavigationHistory')['entries'][-4:])
    page.locator('.close-button').click()
    page.wait_for_function('!document.querySelector("dialog").open')
    print('CLOSE HISTORY TAIL', session.send('Page.getNavigationHistory')['entries'][-4:])
    print('CLOSE STATE', page.evaluate('JSON.stringify(history.state)'))
    print('ORIGIN', page.evaluate('Alpine.$data(document.body).origin'))
    page.wait_for_function('document.activeElement.id === "course-046"', timeout=5000)
    print('PASS: deep-link original trigger and map restored after a different document.')
    browser.close()
