"""HTMemo end-to-end test (Python Playwright + system Chrome).

Run from the repo root:
    python3 test/e2e.py            # results in stdout, screenshots in test/out/
Requires: pip install playwright  (uses the installed Google Chrome via channel='chrome')
"""
import functools, http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'test', 'out')
os.makedirs(OUT, exist_ok=True)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
Handler = functools.partial(Quiet, directory=ROOT)
srv = socketserver.TCPServer(('127.0.0.1', 0), Handler)
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://localhost:{PORT}'
DEMO = BASE + '/demo/index.html'

results = []
def check(name, ok, detail=''):
    results.append((name, bool(ok)))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail and not ok else ''))

def new_page(browser, locale='en-US', w=1440, h=900):
    ctx = browser.new_context(locale=locale, viewport={'width': w, 'height': h})
    ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    return ctx, page, errors

def count(page):
    return page.evaluate('HTMemo.getItems().length')

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)

    # ── main flow (English) ──
    ctx, page, errors = new_page(browser)
    page.goto(DEMO); page.wait_for_selector('.htm-dock')
    check('loads without errors', not errors, errors)
    check('English UI by browser locale', page.inner_text('.htm-dock [data-act="copy"]') == 'Copy prompt')
    check('expanded on desktop', not page.eval_on_selector('.htm-dock', 'e => e.classList.contains("htm-min")'))
    check('dock order', page.evaluate('[...document.querySelectorAll(".htm-dock > button")].map(b => b.dataset.mode || b.dataset.act).join(",")') == 'min,comment,region,edit,tune,more,list,copy')

    # comment
    page.keyboard.press('c')
    check('C enters comment mode', page.evaluate('document.body.classList.contains("htm-mode-comment")'))
    page.hover('.hero h1');
    check('hover label shows section', 'Hero' in page.inner_text('.htm-hover b'))
    page.click('.hero h1')
    page.wait_for_selector('.htm-pop')
    page.click('.htm-chips button >> nth=0')
    page.fill('.htm-pop textarea', 'Bigger, tighten the line height')
    page.keyboard.press('Control+Enter')
    check('comment saved', count(page) == 1 and page.locator('.htm-pin').count() == 1)
    page.keyboard.press('Escape')

    # region
    page.keyboard.press('r')
    page.locator('#features .section-title').scroll_into_view_if_needed()
    page.evaluate('document.querySelector("#features").scrollIntoView()')
    box = page.locator('.features__grid').bounding_box()
    page.mouse.move(box['x'] + 10, box['y'] + 10); page.mouse.down()
    page.mouse.move(box['x'] + 300, box['y'] + 150, steps=5); page.mouse.up()
    page.wait_for_selector('.htm-pop')
    page.fill('.htm-pop textarea', 'Too much empty space here')
    page.click('.htm-pop input[value="mobile"]', force=True)
    page.click('.htm-pop [data-a="save"]')
    reg = [i for i in page.evaluate('HTMemo.getItems()') if i['kind'] == 'region']
    check('region saved', count(page) == 2 and page.locator('.htm-rect').count() == 1 and reg and reg[0]['sec'].startswith('Everything your team'), reg)
    page.keyboard.press('Escape')

    # edit text
    page.keyboard.press('e')
    page.click('.card >> nth=0 >> p')
    page.keyboard.press('Meta+A' if sys.platform == 'darwin' else 'Control+A')
    page.keyboard.type('Search everything in under a second.')
    page.click('.section-lead >> nth=0', position={'x': 2, 'y': 2})  # blur
    page.evaluate('document.activeElement && document.activeElement.blur()')
    items = page.evaluate('HTMemo.getItems()')
    copy_items = [i for i in items if i['kind'] == 'copy']
    check('text edit recorded', len(copy_items) == 1 and copy_items[0]['after'].startswith('Search everything') and copy_items[0]['sec'].startswith('Everything your team'), copy_items)
    page.keyboard.press('Escape')

    # style
    page.keyboard.press('t')
    page.click('.plan--best .plan__price')
    page.wait_for_selector('.htm-tune')
    sw_titles = page.eval_on_selector_all('.htm-tune [data-row="color"] button', 'bs => bs.map(b => b.title)')
    check('palette from CSS custom properties', '--brand' in sw_titles and '--ink' in sw_titles and '--radius' not in sw_titles, sw_titles)
    page.eval_on_selector('.htm-tune input[data-k="font-size"]', 'e => { e.value = 48; e.dispatchEvent(new Event("input", {bubbles: true})); }')
    fs = page.eval_on_selector('.htm-tuning', 'e => [getComputedStyle(e).fontSize, e.tagName]')
    check('slider applies live', fs[0] == '48px', fs)
    page.click('.htm-tune [data-row="color"] button[title="--brand"]')
    page.click('.htm-tune [data-a="save"]')
    tune = [i for i in page.evaluate('HTMemo.getItems()') if i['kind'] == 'tune']
    check('style saved with var name', tune and any('var(--brand)' in c['after'] for c in tune[0]['changes']), tune)
    page.keyboard.press('Escape')

    # measure
    page.keyboard.press('m')
    page.click('.hero h1', position={'x': 300, 'y': 30}); page.hover('.hero p')
    check('measure shows distances', page.locator('.htm-measure .htm-tag').count() >= 2)
    page.keyboard.press('Escape')

    # grid
    page.keyboard.press('g')
    g = page.evaluate('(() => { const g = document.querySelector(".htm-grid"), c = document.querySelector(".container"), r = c.getBoundingClientRect(); return { cols: g.children.length, left: g.getBoundingClientRect().left, cl: r.left + 24 }; })()')
    check('grid 12 columns on container', g['cols'] == 12 and abs(g['left'] - g['cl']) < 1, g)

    # hide
    page.keyboard.press('h')
    check('hide toggles', page.evaluate('document.body.classList.contains("htm-hide")'))
    page.keyboard.press('h'); page.keyboard.press('g')

    # IME: Korean layout sends e.key 'ㅊ' with code 'KeyC'
    page.evaluate('document.dispatchEvent(new KeyboardEvent("keydown", { key: "ㅊ", code: "KeyC", bubbles: true }))')
    check('shortcut works under Korean IME', page.evaluate('document.body.classList.contains("htm-mode-comment")'))
    page.keyboard.press('Escape')

    # list
    page.keyboard.press('l')
    check('list shows all memos', page.locator('.htm-panel.htm-open .htm-item').count() == 4)
    page.click('.htm-panel [data-p="close"]')

    # copy prompt
    page.click('.htm-dock [data-act="copy"]')
    page.wait_for_timeout(300)
    md = page.evaluate('navigator.clipboard.readText()')
    open(os.path.join(OUT, 'prompt-en.md'), 'w').write(md)
    check('prompt copied to clipboard', md.startswith('# Design change requests') and '## Hero' in md and '[Region]' in md and '[Text edit]' in md and '[Style tweak]' in md and 'Mobile only' in md, md[:200])
    page.screenshot(path=os.path.join(OUT, 'desktop-en.png'))

    # persistence
    page.reload(); page.wait_for_selector('.htm-dock')
    check('memos persist after reload', count(page) == 4)
    check('storage key prefix', page.evaluate('Object.keys(localStorage).some(k => k === "htmemo:/demo/index.html")'))
    check('edited text re-applied', page.inner_text('.card >> nth=0 >> p').startswith('Search everything'))

    # width preview
    page.click('.htm-dock [data-act="more"]')
    page.click('.htm-more [data-w="375"]')
    frame = page.frame_locator('.htm-frame iframe')
    frame.locator('.htm-dock').wait_for()
    check('width preview 375 loads HTMemo inside', frame.locator('.htm-dock.htm-min').count() == 1)
    page.screenshot(path=os.path.join(OUT, 'width-375.png'))
    page.keyboard.press('Escape')
    page.click('.htm-close') if page.locator('.htm-close').count() else None
    check('width preview closes', page.locator('.htm-frame').count() == 0)
    check('no errors in main flow', not errors, errors)
    ctx.close()

    # ── Korean locale ──
    ctx, page, errors = new_page(browser, locale='ko-KR')
    page.goto(DEMO); page.wait_for_selector('.htm-dock')
    check('Korean UI by browser locale', page.inner_text('.htm-dock [data-act="copy"]') == 'Prompt 복사' and '코멘트' in page.inner_text('.htm-dock'))
    page.screenshot(path=os.path.join(OUT, 'desktop-ko.png'))
    ctx.close()

    # ── responsive layouts, both languages ──
    for loc in ('en-US', 'ko-KR'):
        for w in (375, 500, 700, 1000):
            ctx, page, errors = new_page(browser, locale=loc, w=w, h=760)
            page.goto(DEMO); page.wait_for_selector('.htm-dock')
            if w < 768:
                check(f'{loc} {w}px starts collapsed', page.eval_on_selector('.htm-dock', 'e => e.classList.contains("htm-min")'))
                page.click('.htm-toggle')
            r = page.evaluate('(() => { const d = document.querySelector(".htm-dock").getBoundingClientRect(); return { l: d.left, r: d.right, h: d.height, vw: document.documentElement.clientWidth }; })()')
            rows = 1 if r['h'] < 50 else 2
            expect_rows = 1 if w >= 634 else 2
            check(f'{loc} {w}px dock inside viewport, {expect_rows} row(s)', r['l'] >= 0 and r['r'] <= r['vw'] and rows == expect_rows, r)
            page.screenshot(path=os.path.join(OUT, f'dock-{loc[:2]}-{w}.png'))
            ctx.close()

    # ── options: data-* on the script tag ──
    ctx, page, errors = new_page(browser)
    html = open(os.path.join(ROOT, 'demo', 'index.html')).read().replace(
        '<script src="../htmemo.js" defer></script>',
        '<script src="../htmemo.js" data-lang="ko" data-bottom="80" data-colors="#ff0000, #00ff00" data-container=".plans" defer></script>')
    page.route('**/demo/options.html', lambda r: r.fulfill(body=html, content_type='text/html'))
    page.goto(BASE + '/demo/options.html'); page.wait_for_selector('.htm-dock')
    check('data-lang overrides locale', page.inner_text('.htm-dock [data-act="copy"]') == 'Prompt 복사')
    check('data-bottom offset', abs(page.evaluate('innerHeight - document.querySelector(".htm-dock").getBoundingClientRect().bottom') - 80) < 1)
    page.keyboard.press('t'); page.click('.hero h1')
    check('data-colors swatches', page.eval_on_selector_all('.htm-tune [data-row="color"] button', 'bs => bs.map(b => b.dataset.v)') == ['#ff0000', '#00ff00'])
    page.keyboard.press('Escape'); page.keyboard.press('Escape')
    page.keyboard.press('g')
    g = page.evaluate('(() => { const g = document.querySelector(".htm-grid").getBoundingClientRect(), c = document.querySelector(".plans").getBoundingClientRect(); return [g.left, c.left, g.width, c.width]; })()')
    check('data-container drives grid', abs(g[0] - g[1]) < 1 and abs(g[2] - g[3]) < 1, g)
    ctx.close()

    # ── script in <head> without defer, and window.HTMemo config ──
    ctx, page, errors = new_page(browser)
    html2 = open(os.path.join(ROOT, 'demo', 'index.html')).read().replace('<script src="../htmemo.js" defer></script>', '').replace(
        '</title>', '</title><script>window.HTMemo = { lang: "en", mobileBottom: 90, collapsed: true };</script><script src="../htmemo.js"></script>')
    page.route('**/demo/head.html', lambda r: r.fulfill(body=html2, content_type='text/html'))
    page.goto(BASE + '/demo/head.html'); page.wait_for_selector('.htm-dock')
    check('works from <head> without defer', not errors and page.evaluate('HTMemo.version') == '0.1.0', errors)
    check('window.HTMemo collapsed option', page.eval_on_selector('.htm-dock', 'e => e.classList.contains("htm-min")'))
    ctx.close()

    # ── bookmarklet on a page without the script ──
    ctx, page, errors = new_page(browser)
    html3 = open(os.path.join(ROOT, 'demo', 'index.html')).read().replace('<script src="../htmemo.js" defer></script>', '')
    page.route('**/demo/plain.html', lambda r: r.fulfill(body=html3, content_type='text/html'))
    page.goto(BASE + '/demo/plain.html')
    bm = "(()=>{if(window.__htmemo)return;var s=document.createElement('script');s.src='%s/htmemo.js';document.body.appendChild(s)})()" % BASE
    page.evaluate(bm); page.wait_for_selector('.htm-dock')
    page.evaluate(bm); page.wait_for_timeout(300)
    check('bookmarklet loads once', page.locator('.htm-dock').count() == 1)
    page.click('.htm-dock [data-act="more"]'); page.click('.htm-more [data-w="768"]')
    page.frame_locator('.htm-frame iframe').locator('.htm-dock').wait_for(timeout=5000)
    check('bookmarklet: width preview injects HTMemo', True)
    check('no errors with bookmarklet', not errors, errors)
    ctx.close()

    browser.close()

srv.shutdown()
failed = [n for n, ok in results if not ok]
print(f'\n{len(results) - len(failed)}/{len(results)} passed')
sys.exit(1 if failed else 0)
