/*! HTMemo v1.0.0 — leave review memos on any web page and copy them as an AI-ready prompt.
 *  https://github.com/kkjjjy1b/htmemo · MIT License
 *
 *  Install:  <script src="https://cdn.jsdelivr.net/gh/kkjjjy1b/htmemo@v1.0.0/htmemo.js" defer></script>
 *
 *  Modes (shortcut)
 *  - Comment (C)     click any element and leave a change request
 *  - Region (R)      drag a box and leave a request for that area
 *  - Edit text (E)   edit page text in place (original → edited is recorded)
 *  - Style (T)       pick an element and adjust font size, spacing, colors with sliders
 *  - List (L)        see, jump to, complete or delete every memo
 *  - Measure (M)     click a base element, then hover another to see px distances
 *  - Grid (G)        overlay 12/8/4 column grid on the content area
 *  - Hide (H)        temporarily hide pins and overlays
 *  - Width 375/768/1440  preview the page at that width inside the same window
 *  - ↑ / ↓           widen / narrow the target to the parent element
 *  "Copy prompt" copies all memos, grouped by section, as a Markdown prompt.
 *
 *  Options: data-* attributes on the <script> tag, or a window.HTMemo object set before loading.
 *  See README for the full list.
 */
(() => {
  if (window.__htmemo) return;
  window.__htmemo = true;
  const VERSION = '1.0.0';
  const SCRIPT = document.currentScript; // only available while this file first runs
  const boot = () => {
  const SRC = SCRIPT && SCRIPT.src;

  /* ── options ───────────────────────────── */
  const DS = (SCRIPT && SCRIPT.dataset) || {};
  const USER = (window.HTMemo && typeof window.HTMemo === 'object') ? window.HTMemo : {};
  const opt = (k) => (USER[k] !== undefined ? USER[k] : DS[k]);
  const num = (v, d) => (v == null || v === '' || isNaN(+v) ? d : +v);
  const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v.trim() ? v.split(',').map((s) => s.trim()).filter(Boolean) : null);
  const bool = (v) => v === true || v === 'true' || v === '' || v === '1';
  const langOpt = String(opt('lang') || 'auto').toLowerCase();
  const LANG = langOpt === 'ko' || langOpt === 'en' ? langOpt : /^ko\b/i.test(navigator.language || '') ? 'ko' : 'en';
  const bottom = num(opt('bottom'), 12);
  const CFG = {
    storageKey: opt('storageKey') || location.pathname,
    bottom,
    mobileBottom: num(opt('mobileBottom'), bottom),
    container: opt('container') || '.container, .wrapper, .wrap, .content, main',
    colors: list(opt('colors')),
    columns: (list(opt('columns')) || [4, 8, 12]).map(Number),
    breakpoints: (list(opt('breakpoints')) || [768, 1080]).map(Number),
    gridGap: opt('gridGap') || '',
    editable: opt('editable') || 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td, label, figcaption, blockquote, a, button, span, strong, em, small',
    collapsed: opt('collapsed') == null ? null : bool(opt('collapsed')),
  };
  const [BP_TABLET, BP_DESKTOP] = CFG.breakpoints;

  /* ── strings ───────────────────────────── */
  const I18N = {
    ko: {
      toolbar: 'HTMemo 리뷰 도구', collapse: 'HTMemo 막대 접기', expand: 'HTMemo 막대 펼치기',
      comment: '코멘트', region: '영역 댓글', edit: '글자 수정', tune: '스타일', tools: '도구', toolsTitle: '보조 도구 펼치기', toolsGroup: '보조 도구',
      list: '목록', copy: 'Prompt 복사', measure: '측정', grid: '격자', hide: '숨기기', hideTitle: '핀·격자 숨기기', width: '화면 폭',
      tip: { comment: '수정할 곳을 클릭하세요', region: '드래그해서 범위를 잡으세요', edit: '고칠 글자를 클릭해서 바로 수정하세요', tune: '스타일을 바꿀 요소를 클릭하세요', measure: '기준 요소를 클릭한 뒤 다른 요소에 마우스를 올리세요' },
      lift: (n) => ` (상위 ${n}단계)`, scopeHint: '↑↓ 범위',
      kind: { number: '숫자', heading: '제목', button: '버튼', link: '링크', image: '이미지', li: '목록 항목', p: '문단', el: '요소', region: '영역' },
      sec: { page: '페이지', header: '상단 메뉴', footer: '푸터', nav: '메뉴', aside: '사이드', section: '섹션', other: '기타' },
      dragMore: '조금 더 크게 드래그하세요',
      chips: ['더 크게', '더 작게', '더 굵게', '여백 넓게', '여백 좁게', '색 바꾸기', '정렬 맞추기', '위치 옮기기', '줄바꿈 조정', '삭제'],
      placeholder: '무엇을 어떻게 바꿀지 적어 주세요. 예: 옆 카드 가격과 같은 크기로',
      scope: { all: '전체', desktop: '데스크톱만', mobile: '모바일만' }, scopeLabel: '적용 화면',
      del: '삭제', cancel: '취소', save: '저장', popLabel: '수정 요청', needText: '요청 내용을 적어 주세요', saved: '저장했습니다',
      panel: '수정 요청', close: '닫기', clearAll: '모두 지우기', confirmClear: '남긴 요청을 모두 지울까요? 글자 수정과 스타일 조절도 원래대로 돌아갑니다.',
      go: '이동', done: '완료', reopen: '되살리기', empty: '아직 남긴 요청이 없습니다.<br>C 코멘트 · R 영역 댓글 · E 글자 수정',
      textEdit: '글자 수정', style: '스타일', regionMemo: '영역 댓글', notVisible: '이 화면 폭에서는 보이지 않는 요소입니다',
      rTitle: '디자인 수정 요청', rPage: '페이지', rCount: (n) => `요청 ${n}건`, rNote: '경로(`…`)는 CSS 선택자입니다. 적용 화면이 "전체"가 아니면 해당 화면 폭에만 반영해 주세요.',
      rText: '[글자 수정]', rWhere: '위치', rTune: '[스타일 조절]', rApply: '적용', rAt: '남긴 화면', rRegion: '[영역 댓글]',
      rRange: (a, b, c, d) => `범위: 섹션 기준 가로 ${a}~${b}%, 세로 ${c}~${d}%`,
      nothing: '복사할 메모가 없습니다', copied: 'Prompt를 복사했습니다. AI 대화창에 붙여 넣어 주세요', copyFail: '복사하지 못했습니다. 목록에서 직접 확인해 주세요',
      t: { 'font-size': '글자 크기', 'font-weight': '굵기', 'line-height': '줄간격', 'letter-spacing': '자간', 'padding-block': '안쪽 위아래', 'padding-inline': '안쪽 좌우', 'margin-top': '위 간격', 'margin-bottom': '아래 간격', gap: '자식 간격', 'max-width': '최대 폭', color: '글자색', 'background-color': '배경색' },
      none: '없음', revert: '원래대로', notePh: '메모 (선택). 예: 다른 카드에도 같이 적용', tuneLabel: '스타일 조절', noChange: '바뀐 값이 없습니다', tuneSaved: '스타일 값을 저장했습니다',
      base: '기준', pickBase: '기준을 먼저 클릭하세요', dTop: '윗선 차이', dBottom: '아랫선 차이', dLeft: '왼쪽 끝 차이', dRight: '오른쪽 끝 차이',
      hidden: '핀과 격자를 숨겼습니다 (H로 다시 보기)', shown: '다시 표시합니다',
      frameClose: '닫기 (Esc)', frameTitle: '화면 폭 미리보기', frameInfo: (w, s) => `${w}px 화면${s < 1 ? ` · ${Math.round(s * 100)}% 축소 표시` : ''} · 이 안에서 남긴 요청도 같은 목록에 저장됩니다`,
      vp: { mobile: '모바일', tablet: '태블릿', desktop: '데스크톱' },
    },
    en: {
      toolbar: 'HTMemo review toolbar', collapse: 'Collapse HTMemo', expand: 'Expand HTMemo',
      comment: 'Comment', region: 'Region', edit: 'Edit text', tune: 'Style', tools: 'Tools', toolsTitle: 'Show more tools', toolsGroup: 'More tools',
      list: 'List', copy: 'Copy prompt', measure: 'Measure', grid: 'Grid', hide: 'Hide', hideTitle: 'Hide pins and grid', width: 'Width',
      tip: { comment: 'Click the element to change', region: 'Drag to select an area', edit: 'Click any text to edit it in place', tune: 'Click an element to adjust its style', measure: 'Click a base element, then hover another' },
      lift: (n) => ` (parent +${n})`, scopeHint: '↑↓ scope',
      kind: { number: 'Number', heading: 'Heading', button: 'Button', link: 'Link', image: 'Image', li: 'List item', p: 'Paragraph', el: 'Element', region: 'Region' },
      sec: { page: 'Page', header: 'Header', footer: 'Footer', nav: 'Navigation', aside: 'Sidebar', section: 'Section', other: 'Other' },
      dragMore: 'Drag a slightly larger area',
      chips: ['Bigger', 'Smaller', 'Bolder', 'More space', 'Less space', 'Change color', 'Align', 'Move', 'Fix line break', 'Remove'],
      placeholder: 'What should change, and how? e.g. Same size as the price on the next card',
      scope: { all: 'All screens', desktop: 'Desktop only', mobile: 'Mobile only' }, scopeLabel: 'Applies to',
      del: 'Delete', cancel: 'Cancel', save: 'Save', popLabel: 'Change request', needText: 'Please describe the change', saved: 'Saved',
      panel: 'Change requests', close: 'Close', clearAll: 'Clear all', confirmClear: 'Delete all memos? Text edits and style tweaks will be reverted too.',
      go: 'Go', done: 'Done', reopen: 'Reopen', empty: 'No memos yet.<br>C Comment · R Region · E Edit text',
      textEdit: 'Text edit', style: 'Style', regionMemo: 'Region', notVisible: 'This element is not visible at this width',
      rTitle: 'Design change requests', rPage: 'Page', rCount: (n) => `${n} request${n === 1 ? '' : 's'}`, rNote: 'Paths (`…`) are CSS selectors. If "Applies to" is not "All screens", change only that screen size.',
      rText: '[Text edit]', rWhere: 'Location', rTune: '[Style tweak]', rApply: 'Applies to', rAt: 'Captured at', rRegion: '[Region]',
      rRange: (a, b, c, d) => `Area: ${a}–${b}% horizontally, ${c}–${d}% vertically within the section`,
      nothing: 'Nothing to copy yet', copied: 'Prompt copied. Paste it into your AI chat', copyFail: 'Could not copy. Please check the list instead',
      t: { 'font-size': 'Font size', 'font-weight': 'Weight', 'line-height': 'Line height', 'letter-spacing': 'Letter spacing', 'padding-block': 'Padding Y', 'padding-inline': 'Padding X', 'margin-top': 'Margin top', 'margin-bottom': 'Margin bottom', gap: 'Gap', 'max-width': 'Max width', color: 'Text color', 'background-color': 'Background' },
      none: 'None', revert: 'Reset', notePh: 'Note (optional). e.g. Apply to the other cards too', tuneLabel: 'Style tweak', noChange: 'Nothing changed', tuneSaved: 'Style values saved',
      base: 'Base', pickBase: 'click a base element first', dTop: 'top offset', dBottom: 'bottom offset', dLeft: 'left offset', dRight: 'right offset',
      hidden: 'Pins and grid hidden (press H to show)', shown: 'Shown again',
      frameClose: 'Close (Esc)', frameTitle: 'Width preview', frameInfo: (w, s) => `${w}px screen${s < 1 ? ` · shown at ${Math.round(s * 100)}%` : ''} · memos left here go to the same list`,
      vp: { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' },
    },
  };
  const L = I18N[LANG];

  /* ── state ───────────────────────────── */
  const NS = 'htmemo:';
  const KEY = NS + CFG.storageKey;
  const S = { mode: 'view', items: [], seq: 0 };
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  try { Object.assign(S, JSON.parse(store.get(KEY) || '{}')); } catch (e) {}
  S.mode = 'view';
  const save = () => store.set(KEY, JSON.stringify({ items: S.items, seq: S.seq }));
  const scopeText = (s) => L.scope[s] || s; // older data may hold the label itself

  /* ── styles ───────────────────────────── */
  const css = `
  .htm-ui, .htm-ui * { box-sizing: border-box; font-family: "Pretendard Variable", Pretendard, system-ui, -apple-system, "Segoe UI", sans-serif; letter-spacing: 0; }
  .htm-dock { position: fixed; right: 12px; bottom: var(--htm-b, 12px); z-index: 2147483000; display: flex; gap: 4px; padding: 4px; background: #1a1a1a; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
  .htm-dock button { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 10px; border-radius: 7px; color: #e4e1da; font-size: 13px; font-weight: 600; white-space: nowrap; }
  .htm-dock button:hover { background: #2f2e2b; }
  .htm-dock button[aria-pressed="true"] { background: #2563eb; color: #fff; }
  .htm-dock button.htm-primary { background: #fff; color: #1a1a1a; }
  .htm-dock kbd { font: 600 10px/1 system-ui; padding: 2px 4px; border: 1px solid #6b6b66; border-radius: 3px; color: #a8a49b; }
  .htm-dock .htm-count { min-width: 18px; padding: 1px 5px; border-radius: 9px; background: #2563eb; color: #fff; font-size: 11px; text-align: center; }
  .htm-dock.htm-min > :not(.htm-toggle) { display: none; }
  .htm-dock .htm-toggle { gap: 6px; padding: 0 6px 0 8px; margin-right: 2px; }
  .htm-dock:not(.htm-min) .htm-toggle { box-shadow: 1px 0 0 #4a4945; border-radius: 7px 0 0 7px; padding-right: 8px; }
  .htm-logo { display: block; width: 20px; height: 24px; flex: none; }
  .htm-logo svg { display: block; width: 20px; height: 24px; }
  .htm-brand { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: -.02em; }
  .htm-brand__ht { color: #ffc83d; }
  .htm-chev { display: grid; place-items: center; width: 14px; height: 18px; color: #a8a49b; transition: transform .2s; }
  .htm-chev svg { width: 12px; height: 12px; }
  .htm-dock.htm-min .htm-chev { transform: rotate(180deg); }
  .htm-toggle .htm-count { display: none; }
  .htm-dock.htm-min .htm-toggle .htm-count:not(:empty):not([data-zero]) { display: inline-block; }
  @media (prefers-reduced-motion: reduce) { .htm-chev { transition: none; } }
  /* under 768px: hide shortcut hints, keep one row */
  @media (max-width: 767px) {
    .htm-dock { bottom: var(--htm-bm, 12px); right: 8px; }
    .htm-dock kbd { display: none; }
  }
  /* under 634px: two-row card, 400px wide. Top row: name · list · copy. Bottom row: memo tools */
  @media (max-width: 633px) {
    .htm-dock.htm-ui { width: 400px; max-width: calc(100% - 16px); flex-wrap: wrap; row-gap: 4px; }
    .htm-dock > .htm-toggle { order: 0; }
    .htm-dock > [data-act="list"] { order: 1; margin-left: auto; }
    .htm-dock > .htm-primary { order: 2; }
    .htm-dock::before { content: ""; order: 3; flex-basis: 100%; height: 0; }
    .htm-dock > [data-mode], .htm-dock > .htm-more-btn { order: 4; flex: 1 1 0; justify-content: center; padding: 0 4px; }
    .htm-dock.htm-ui.htm-min { width: auto; }
    .htm-dock.htm-min::before { display: none; }
  }
  /* under 416px: centered with 8px side gutters (100vw would include the scrollbar) */
  @media (max-width: 415px) {
    .htm-dock.htm-ui { left: 8px; right: 8px; width: auto; }
    .htm-dock.htm-ui.htm-min { left: auto; }
  }

  .htm-hover { position: absolute; z-index: 2147482990; pointer-events: none; outline: 2px solid #2563eb; outline-offset: 2px; background: rgba(37,99,235,.06); border-radius: 2px; }
  .htm-hover b { position: absolute; left: -2px; bottom: calc(100% + 4px); padding: 3px 7px; background: #2563eb; color: #fff; font: 600 12px/1.3 system-ui; border-radius: 3px; white-space: nowrap; max-width: 70vw; overflow: hidden; text-overflow: ellipsis; }
  body.htm-mode-comment, body.htm-mode-comment * { cursor: crosshair !important; }
  body.htm-mode-region { cursor: crosshair; user-select: none; }
  body.htm-mode-edit [data-htm-editable]:hover { outline: 1px dashed #2563eb; outline-offset: 2px; cursor: text; }
  [contenteditable="true"][data-htm-editing] { outline: 2px solid #1f7a4d !important; outline-offset: 2px; background: rgba(31,122,77,.06); }
  [data-htm-edited] { box-shadow: inset 0 -2px 0 rgba(31,122,77,.55); }

  .htm-layer { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 2147482995; }
  .htm-pin { all: unset; position: absolute; transform: translate(-50%, -50%); width: 26px; height: 26px; border-radius: 50% 50% 50% 4px; background: #2563eb; color: #fff; font: 800 12px/22px system-ui; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,.3); cursor: pointer; border: 2px solid #fff; box-sizing: border-box; }
  .htm-pin.htm-done { background: #6b6b66; }
  .htm-pin.htm-flash { animation: htmflash 1s ease-out 2; }
  @keyframes htmflash { 50% { transform: translate(-50%,-50%) scale(1.5); } }
  .htm-rect { position: absolute; border: 2px dashed #2563eb; background: rgba(37,99,235,.08); pointer-events: none; }
  .htm-rect.htm-done { border-color: #a8a49b; background: transparent; }
  .htm-drawing { position: fixed; z-index: 2147482996; border: 2px solid #2563eb; background: rgba(37,99,235,.12); pointer-events: none; }

  .htm-pop { position: fixed; z-index: 2147483001; width: min(360px, calc(100vw - 16px)); padding: 14px; background: #fff; color: #1a1a1a; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.28); display: flex; flex-direction: column; gap: 10px; font-size: 14px; text-align: left; }
  .htm-pop__target { font-size: 12px; color: #6b6b66; line-height: 1.4; }
  .htm-pop__target b { color: #1a1a1a; }
  .htm-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .htm-chips button { all: unset; cursor: pointer; padding: 5px 9px; border-radius: 999px; background: #f1efea; font-size: 12px; font-weight: 600; color: #2f2e2b; }
  .htm-chips button:hover { background: #e4e1da; }
  .htm-pop textarea { width: 100%; min-height: 76px; padding: 9px 10px; border: 1px solid #8f8b82; border-radius: 6px; font-size: 14px; line-height: 1.5; resize: vertical; color: #1a1a1a; background: #fff; }
  .htm-pop textarea:focus { outline: 2px solid #1a1a1a; outline-offset: -1px; }
  .htm-scope { display: flex; gap: 4px; }
  .htm-scope label { flex: 1; text-align: center; padding: 6px 0; border: 1px solid #cfcbc2; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; color: #4a4945; }
  .htm-scope input { position: absolute; opacity: 0; pointer-events: none; }
  .htm-scope label:has(input:checked) { background: #1a1a1a; border-color: #1a1a1a; color: #fff; }
  .htm-scope label:has(input:focus-visible) { outline: 2px solid #2563eb; outline-offset: 2px; }
  .htm-pop__row { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
  .htm-pop__row .htm-del { margin-right: auto; color: #a83216; }
  .htm-btn { all: unset; cursor: pointer; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; background: #f1efea; color: #1a1a1a; }
  .htm-btn--dark { background: #1a1a1a; color: #fff; }
  .htm-btn:focus-visible, .htm-dock button:focus-visible, .htm-chips button:focus-visible, .htm-pin:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

  .htm-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 2147483002; width: min(400px, 100vw); background: #fcfcfa; color: #1a1a1a; box-shadow: -12px 0 40px rgba(0,0,0,.2); display: none; flex-direction: column; text-align: left; }
  .htm-panel.htm-open { display: flex; animation: htmslide .25s cubic-bezier(.2,0,0,1); }
  @keyframes htmslide { from { transform: translateX(40px); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .htm-panel.htm-open { animation: none; } }
  .htm-panel header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 3px solid #1a1a1a; }
  .htm-panel header b { font-size: 16px; }
  .htm-panel__body { flex: 1; overflow: auto; overscroll-behavior: contain; padding: 8px 16px 16px; }
  .htm-panel__sec { margin: 14px 0 0; font-size: 12px; font-weight: 800; color: #2563eb; }
  .htm-item { display: grid; grid-template-columns: 26px 1fr auto; gap: 4px 10px; padding: 10px 0; border-bottom: 1px solid #e4e1da; font-size: 13px; line-height: 1.45; }
  .htm-item__no { width: 22px; height: 22px; border-radius: 50%; background: #2563eb; color: #fff; font: 800 11px/22px system-ui; text-align: center; }
  .htm-item.htm-done .htm-item__no { background: #a8a49b; }
  .htm-item.htm-done .htm-item__text { text-decoration: line-through; color: #8f8b82; }
  .htm-item__meta { grid-column: 2; font-size: 11px; color: #6b6b66; }
  .htm-item__acts { grid-row: span 2; display: flex; flex-direction: column; gap: 2px; }
  .htm-item__acts button { all: unset; cursor: pointer; font-size: 11px; font-weight: 700; color: #4a4945; padding: 2px 4px; }
  .htm-item__acts button:hover { color: #2563eb; }
  .htm-panel footer { display: flex; gap: 6px; padding: 12px 16px; border-top: 1px solid #e4e1da; }
  .htm-panel footer .htm-btn { flex: 1; text-align: center; }
  .htm-empty { padding: 40px 0; text-align: center; color: #8f8b82; font-size: 13px; line-height: 1.6; }
  .htm-toast { position: fixed; left: 50%; bottom: calc(var(--htm-b, 12px) + 60px); transform: translateX(-50%); z-index: 2147483003; padding: 10px 16px; background: #1a1a1a; color: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; opacity: 0; transition: opacity .2s; pointer-events: none; max-width: calc(100vw - 32px); text-align: center; }
  @media (max-width: 767px) { .htm-toast { bottom: calc(var(--htm-bm, 12px) + 104px); } }
  .htm-toast.htm-show { opacity: 1; }
  .htm-dock { max-width: calc(100vw - 24px); flex-wrap: wrap; justify-content: flex-end; }
  .htm-dock .htm-more-btn span { display: inline-block; transition: transform .2s; }
  .htm-dock .htm-more-btn[aria-expanded="true"] { background: #2f2e2b; }
  .htm-dock .htm-more-btn[aria-expanded="true"] span { transform: rotate(180deg); }
  .htm-more { position: absolute; right: 0; bottom: calc(100% + 6px); display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px; padding: 4px; max-width: calc(100vw - 24px); background: #1a1a1a; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
  .htm-more[hidden] { display: none; }
  .htm-more__label { padding: 0 4px 0 6px; font-size: 12px; color: #a8a49b; }
  .htm-dock.htm-min .htm-more { display: none; }
  .htm-dock .htm-sep { width: 1px; align-self: stretch; margin: 6px 2px; background: #4a4945; }
  .htm-dock .htm-w { padding: 0 7px; font-variant-numeric: tabular-nums; }
  body.htm-mode-tune, body.htm-mode-tune *, body.htm-mode-measure, body.htm-mode-measure * { cursor: crosshair !important; }
  body.htm-hide .htm-layer, body.htm-hide .htm-grid, body.htm-hide .htm-measure, body.htm-hide .htm-hover { display: none !important; }

  .htm-tune { position: fixed; top: 12px; right: 12px; z-index: 2147483001; width: min(330px, calc(100vw - 16px)); max-height: calc(100vh - 90px); overflow: auto; overscroll-behavior: contain; padding: 14px; background: #fff; color: #1a1a1a; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.28); display: flex; flex-direction: column; gap: 10px; font-size: 13px; text-align: left; }
  .htm-tune__head { display: flex; justify-content: space-between; gap: 8px; align-items: start; }
  .htm-tune__head b { font-size: 14px; }
  .htm-tune__head span { font-size: 12px; color: #6b6b66; }
  .htm-tune__row { display: grid; grid-template-columns: 84px 1fr 62px; gap: 8px; align-items: center; }
  .htm-tune__row label { font-size: 12px; font-weight: 600; color: #4a4945; }
  .htm-tune__row input[type=range] { width: 100%; accent-color: #2563eb; }
  .htm-tune__row output { font: 600 12px/1 system-ui; text-align: right; font-variant-numeric: tabular-nums; color: #1a1a1a; }
  .htm-tune__row.htm-changed label, .htm-tune__row.htm-changed output { color: #2563eb; }
  .htm-tune__row select { font: inherit; padding: 4px; border: 1px solid #cfcbc2; border-radius: 4px; }
  .htm-sw { display: flex; gap: 4px; flex-wrap: wrap; }
  .htm-sw button { all: unset; cursor: pointer; width: 22px; height: 22px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.18); }
  .htm-sw button[aria-pressed="true"] { outline: 2px solid #2563eb; outline-offset: 2px; }
  .htm-sw button:focus-visible { outline: 2px solid #1a1a1a; outline-offset: 2px; }
  .htm-sw .htm-none { background: repeating-linear-gradient(45deg, #fff 0 4px, #e4e1da 4px 8px); }
  .htm-tune textarea { width: 100%; min-height: 48px; padding: 8px; border: 1px solid #8f8b82; border-radius: 6px; font: inherit; resize: vertical; color: #1a1a1a; background: #fff; }
  .htm-tuning { outline: 2px solid #1f7a4d !important; outline-offset: 3px; }

  .htm-measure { position: fixed; inset: 0; z-index: 2147482994; pointer-events: none; }
  .htm-measure .htm-box { position: absolute; outline: 2px solid; }
  .htm-measure .htm-box--a { outline-color: #1f7a4d; background: rgba(31,122,77,.07); }
  .htm-measure .htm-box--b { outline-color: #2563eb; background: rgba(37,99,235,.06); }
  .htm-measure .htm-line { position: absolute; background: #2563eb; }
  .htm-measure .htm-tag { position: absolute; transform: translate(-50%, -50%); padding: 2px 6px; background: #2563eb; color: #fff; font: 700 11px/1.3 system-ui; border-radius: 3px; white-space: nowrap; }
  .htm-measure .htm-tag--a { background: #1f7a4d; transform: none; }
  .htm-measure .htm-tag--info { background: #1a1a1a; transform: none; }

  .htm-grid { position: fixed; top: 0; bottom: 0; z-index: 2147482980; pointer-events: none; display: grid; }
  .htm-grid i { background: rgba(37,99,235,.07); box-shadow: inset 1px 0 rgba(37,99,235,.25), inset -1px 0 rgba(37,99,235,.25); }
  .htm-grid::before, .htm-grid::after { content: ""; position: absolute; top: 0; bottom: 0; width: 1px; background: #2563eb; }
  .htm-grid::before { left: 0; } .htm-grid::after { right: 0; }

  .htm-frame { position: fixed; inset: 0; z-index: 2147483004; background: #2f2e2b; display: flex; flex-direction: column; }
  .htm-frame__bar { display: flex; align-items: center; gap: 6px; padding: 8px 12px; color: #e4e1da; font-size: 13px; }
  .htm-frame__bar button { all: unset; cursor: pointer; padding: 6px 10px; border-radius: 6px; font-weight: 700; color: #e4e1da; }
  .htm-frame__bar button[aria-pressed="true"] { background: #2563eb; color: #fff; }
  .htm-frame__bar .htm-close { margin-left: auto; background: #fff; color: #1a1a1a; }
  .htm-frame__stage { flex: 1; overflow: hidden; display: flex; justify-content: center; }
  .htm-frame iframe { border: 0; background: #fff; transform-origin: top center; box-shadow: 0 0 0 1px #4a4945; }
  html.htm-in-frame .htm-dock [data-w], html.htm-in-frame .htm-more__label, html.htm-in-frame .htm-more .htm-sep { display: none; }
  `;
  const styleEl = document.createElement('style');
  styleEl.id = 'htm-style';
  styleEl.textContent = css;
  document.head.append(styleEl);

  /* ── helpers ───────────────────────────── */
  const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isUI = (el) => !!(el && el.closest && el.closest('.htm-ui'));
  const vpName = () => (innerWidth < BP_TABLET ? L.vp.mobile : innerWidth < BP_DESKTOP ? L.vp.tablet : L.vp.desktop);
  const clip = (s, n = 40) => { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
  const quote = (s) => (LANG === 'ko' ? ` “${s}”` : ` "${s}"`);

  // Section = nearest landmark-like ancestor. Name priority:
  // data-htmemo-section > aria-label > first heading > id > generic name.
  const SECTION_SEL = '[data-htmemo-section], section, header, footer, nav, aside';
  function sectionOf(el) {
    const sec = el.closest(SECTION_SEL);
    if (!sec) return { el: document.body, name: L.sec.page };
    const custom = sec.getAttribute('data-htmemo-section') || sec.getAttribute('aria-label');
    if (custom) return { el: sec, name: clip(custom, 24) };
    const tag = sec.tagName.toLowerCase();
    if (tag === 'header' && !sec.closest('article, section')) return { el: sec, name: L.sec.header };
    if (tag === 'footer' && !sec.closest('article, section')) return { el: sec, name: L.sec.footer };
    if (tag === 'nav') return { el: sec, name: L.sec.nav };
    const h = sec.querySelector('h1, h2, h3');
    if (h && h.innerText.trim()) return { el: sec, name: clip(h.innerText.split('\n')[0], 30) };
    if (sec.id) return { el: sec, name: '#' + sec.id };
    return { el: sec, name: tag === 'aside' ? L.sec.aside : L.sec.section };
  }
  function pathOf(el) {
    const parts = [];
    for (let n = el; n && n !== document.body && n.nodeType === 1; n = n.parentElement) {
      if (n.id && !n.id.startsWith('htm-')) { parts.unshift('#' + CSS.escape(n.id)); break; }
      let i = 1, s = n;
      while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
      parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
    }
    return parts.join(' > ');
  }
  const resolve = (p) => { try { return document.querySelector(p); } catch (e) { return null; } };
  function describe(el) {
    const txt = clip(el.innerText || el.getAttribute('aria-label') || el.getAttribute('alt') || '', 36);
    const k = L.kind;
    const kind = (txt && txt.length < 16 && /\d/.test(txt) && !/[a-z가-힣]{4,}/i.test(txt)) ? k.number
      : el.matches('h1,h2,h3,h4,h5,h6') ? k.heading
      : el.matches('button, [role=button], input[type=submit], input[type=button], a.btn, a.button, a[class*="btn"]') ? k.button
      : el.matches('a') ? k.link
      : el.matches('img, svg, picture, video, canvas, [role=img]') ? k.image
      : el.matches('li') ? k.li : el.matches('p') ? k.p : k.el;
    return { txt, kind };
  }
  function toast(msg) {
    let t = document.querySelector('.htm-toast');
    if (!t) { t = $('<div class="htm-toast htm-ui" role="status"></div>'); document.body.append(t); }
    t.textContent = msg; t.classList.add('htm-show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('htm-show'), 1800);
  }
  const kbd = (k) => `<kbd>${k}</kbd>`;

  /* ── dock (toolbar) ───────────────────────── */
  const dock = $(`<div class="htm-dock htm-ui" role="toolbar" aria-label="${L.toolbar}">
    <button class="htm-toggle" data-act="min" aria-expanded="true" title="${L.collapse}">
      <span class="htm-logo" aria-hidden="true"><svg viewBox="0 0 20 24"><path d="M0 0H14L20 6V24H0Z" fill="#ffc83d"/><path d="M14 0V6H20Z" fill="#c9971c"/><g fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="square"><path d="M6.5 10.5L4 13.5L6.5 16.5"/><path d="M11 9.5L9 17.5"/><path d="M13.5 10.5L16 13.5L13.5 16.5"/></g></svg></span>
      <span class="htm-brand"><span class="htm-brand__ht">HT</span>Memo</span>
      <span class="htm-count" data-zero>0</span>
      <span class="htm-chev" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 2.5L7.5 6 4 9.5"/></svg></span>
    </button>
    <button data-mode="comment" aria-pressed="false">${L.comment} ${kbd('C')}</button>
    <button data-mode="region" aria-pressed="false">${L.region} ${kbd('R')}</button>
    <button data-mode="edit" aria-pressed="false">${L.edit} ${kbd('E')}</button>
    <button data-mode="tune" aria-pressed="false">${L.tune} ${kbd('T')}</button>
    <button class="htm-more-btn" data-act="more" aria-expanded="false" aria-controls="htm-more" title="${L.toolsTitle}">${L.tools} <span aria-hidden="true">▴</span></button>
    <button data-act="list">${L.list} <span class="htm-count">0</span></button>
    <button class="htm-primary" data-act="copy">${L.copy}</button>
    <div class="htm-more" id="htm-more" role="group" aria-label="${L.toolsGroup}" hidden>
      <button data-mode="measure" aria-pressed="false">${L.measure} ${kbd('M')}</button>
      <button data-act="grid" aria-pressed="false">${L.grid} ${kbd('G')}</button>
      <button data-act="hide" aria-pressed="false" title="${L.hideTitle}">${L.hide} ${kbd('H')}</button>
      <span class="htm-sep"></span>
      <span class="htm-more__label">${L.width}</span>
      <button class="htm-w" data-w="375">375</button><button class="htm-w" data-w="768">768</button><button class="htm-w" data-w="1440">1440</button>
    </div>
  </div>`);
  dock.style.setProperty('--htm-b', CFG.bottom + 'px');
  dock.style.setProperty('--htm-bm', CFG.mobileBottom + 'px');
  document.documentElement.style.setProperty('--htm-b', CFG.bottom + 'px');
  document.documentElement.style.setProperty('--htm-bm', CFG.mobileBottom + 'px');
  document.body.append(dock);
  const more = dock.querySelector('.htm-more'), moreBtn = dock.querySelector('[data-act="more"]');
  function toggleMore(force) {
    const open = force ?? more.hidden;
    more.hidden = !open; moreBtn.setAttribute('aria-expanded', String(open));
    if (open) placeMore();
    store.set(NS + 'more', open ? '1' : '');
  }
  // Float the extra tools right above the "Tools" button, pushed back inside the viewport.
  function placeMore() {
    if (more.hidden) return;
    more.style.right = 'auto';
    const d = dock.getBoundingClientRect(), w = more.offsetWidth;
    let left = moreBtn.offsetLeft;
    left = Math.min(left, innerWidth - 12 - d.left - w);
    left = Math.max(left, 12 - d.left);
    more.style.left = left + 'px';
  }
  addEventListener('resize', placeMore);
  if (store.get(NS + 'more')) toggleMore(true);
  const inFrame = window !== window.top;
  if (inFrame) document.documentElement.classList.add('htm-in-frame');
  const minBtn = dock.querySelector('.htm-toggle');
  function setMin(on) {
    dock.classList.toggle('htm-min', on);
    minBtn.setAttribute('aria-expanded', String(!on));
    minBtn.title = on ? L.expand : L.collapse;
    if (on) setMode('view'); else placeMore();
    if (innerWidth >= BP_TABLET) store.set(NS + 'min', on ? '1' : '0');
  }
  {
    // Mobile always starts collapsed so the bar doesn't cover the page; desktop remembers the last state.
    const saved = store.get(NS + 'min');
    const start = CFG.collapsed != null ? CFG.collapsed : innerWidth < BP_TABLET || saved === '1';
    if (start) { dock.classList.add('htm-min'); minBtn.setAttribute('aria-expanded', 'false'); minBtn.title = L.expand; }
  }
  const layer = $('<div class="htm-layer htm-ui"></div>'); document.body.append(layer);
  const hover = $('<div class="htm-hover htm-ui"><b></b></div>'); hover.hidden = true; document.body.append(hover);

  dock.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mode) setMode(S.mode === b.dataset.mode ? 'view' : b.dataset.mode);
    if (b.dataset.act === 'list') togglePanel();
    if (b.dataset.act === 'copy') copyAll();
    if (b.dataset.act === 'more') toggleMore();
    if (b.dataset.act === 'grid') toggleGrid();
    if (b.dataset.act === 'hide') toggleHide();
    if (b.dataset.w) openFrame(+b.dataset.w);
    if (b.dataset.act === 'min') setMin(!dock.classList.contains('htm-min'));
  });

  function setMode(m) {
    if (S.mode === 'edit' && m !== 'edit') stopEditing();
    if (S.mode === 'tune' && m !== 'tune') closeTune(true);
    if (S.mode === 'measure' && m !== 'measure') clearMeasure();
    S.mode = m;
    document.body.classList.remove('htm-mode-comment', 'htm-mode-region', 'htm-mode-edit', 'htm-mode-tune', 'htm-mode-measure');
    if (m !== 'view') document.body.classList.add('htm-mode-' + m);
    dock.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    hover.hidden = true;
    if (m === 'edit') markEditable();
    if (L.tip[m]) toast(L.tip[m]);
  }

  // Letter shortcuts. Falls back to the physical key when an IME (e.g. Korean) changes e.key.
  const letter = (e) => { const k = (e.key || '').toLowerCase(); return /^[a-z]$/.test(k) ? k : /^Key[A-Z]$/.test(e.code || '') ? e.code[3].toLowerCase() : k; };
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('textarea, input, select, [contenteditable="true"], [contenteditable=""]')) {
      if (e.key === 'Escape' && isUI(e.target)) { e.target.blur(); closePop(); }
      else if (e.key === 'Escape' && e.target.hasAttribute && e.target.hasAttribute('data-htm-editing')) e.target.blur();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = letter(e);
    if (k === 'c') setMode(S.mode === 'comment' ? 'view' : 'comment');
    else if (k === 'r') setMode(S.mode === 'region' ? 'view' : 'region');
    else if (k === 'e') setMode(S.mode === 'edit' ? 'view' : 'edit');
    else if (k === 'l') togglePanel();
    else if (k === 't') setMode(S.mode === 'tune' ? 'view' : 'tune');
    else if (k === 'm') setMode(S.mode === 'measure' ? 'view' : 'measure');
    else if (k === 'g') toggleGrid();
    else if (k === 'h') toggleHide();
    else if (e.key === 'Escape') { closePop(); setMode('view'); panel.classList.remove('htm-open'); if (frame) closeFrame(); }
  });

  /* ── comment mode: highlight the element under the pointer ─── */
  const containerSel = CFG.container;
  function pickTarget(el) {
    // Prefer the nearest meaningful element over big wrappers (sections, containers).
    let guard = 0;
    while (el && el !== document.body && guard++ < 20 && el.matches('main, section, ' + containerSel)) el = el.firstElementChild || el.parentElement;
    return el;
  }
  // ↑/↓: move to the parent (wrapping) element of what's under the pointer, and back.
  let lift = 0, lastRaw = null;
  function target(raw) { let el = pickTarget(raw); for (let i = 0; i < lift && el && el.parentElement && el.parentElement !== document.body; i++) el = el.parentElement; return el; }
  function drawHover(raw) {
    const el = target(raw); if (!el || el === document.body) return;
    const r = el.getBoundingClientRect();
    Object.assign(hover.style, { left: r.left + scrollX + 'px', top: r.top + scrollY + 'px', width: r.width + 'px', height: r.height + 'px' });
    const d = describe(el);
    hover.querySelector('b').textContent = sectionOf(el).name + ' › ' + d.kind + (d.txt ? quote(d.txt) : '') + (lift ? L.lift(lift) : '') + '  ' + L.scopeHint;
    hover.hidden = false;
  }
  document.addEventListener('keydown', (e) => {
    if (!['comment', 'tune', 'measure'].includes(S.mode) || !lastRaw || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    if (e.target.closest && e.target.closest('textarea, input, select, [contenteditable="true"]')) return;
    e.preventDefault(); lift = Math.max(0, lift + (e.key === 'ArrowUp' ? 1 : -1));
    if (S.mode === 'measure') { mB = target(lastRaw); drawMeasure(); } else drawHover(lastRaw);
  });
  document.addEventListener('mousemove', (e) => {
    if (!isUI(e.target) && e.target !== lastRaw) { lastRaw = e.target; lift = 0; }
  }, { passive: true, capture: true });
  document.addEventListener('mousemove', (e) => {
    const hv = S.mode === 'comment' || S.mode === 'tune';
    if (!hv || isUI(e.target) || popOpen()) { if (!hv) hover.hidden = true; return; }
    drawHover(e.target);
  }, { passive: true });

  // While a mode is on, block link navigation and button actions on the page.
  document.addEventListener('click', (e) => {
    if (S.mode === 'view' || isUI(e.target)) return;
    if (S.mode === 'edit') { if (e.target.closest('a, button')) e.preventDefault(); return; }
    e.preventDefault(); e.stopPropagation();
    if (S.mode === 'tune') { const t = target(e.target); if (t) openTune(t); return; }
    if (S.mode === 'measure') { const t = target(e.target); if (t) { mA = t; drawMeasure(); } return; }
    if (S.mode !== 'comment') return;
    const el = target(e.target); if (!el) return;
    const r = el.getBoundingClientRect();
    openPop({ type: 'el', path: pathOf(el), ox: (e.clientX - r.left) / (r.width || 1), oy: (e.clientY - r.top) / (r.height || 1) }, null, e.clientX, e.clientY);
  }, true);

  /* ── region mode: drag ───────────────────── */
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    if (S.mode !== 'region' || isUI(e.target) || e.button !== 0) return;
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY, box: $('<div class="htm-drawing htm-ui"></div>') };
    document.body.append(drag.box);
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const x = Math.min(drag.x, e.clientX), y = Math.min(drag.y, e.clientY);
    Object.assign(drag.box.style, { left: x + 'px', top: y + 'px', width: Math.abs(e.clientX - drag.x) + 'px', height: Math.abs(e.clientY - drag.y) + 'px' });
  });
  document.addEventListener('pointerup', () => {
    if (!drag) return;
    const r = drag.box.getBoundingClientRect(); drag.box.remove(); drag = null;
    if (r.width < 12 || r.height < 12) return toast(L.dragMore);
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const pick = (x, y) => document.elementsFromPoint(Math.min(Math.max(x, 0), innerWidth - 1), Math.min(Math.max(y, 0), innerHeight - 1)).find((n) => !isUI(n));
    const under = pick(cx, cy) || pick(r.left + 2, r.top + 2) || document.body;
    const sec = sectionOf(under).el, sr = sec.getBoundingClientRect();
    openPop({ type: 'region', path: pathOf(sec) || 'body', rx: (r.left - sr.left) / sr.width, ry: (r.top - sr.top) / sr.height, rw: r.width / sr.width, rh: r.height / sr.height }, null, r.right, r.top);
  });

  /* ── memo popup ───────────────────────── */
  let pop = null, popCtx = null;
  const popOpen = () => !!pop;
  function closePop() { if (pop) pop.remove(); pop = null; popCtx = null; }
  const scopeRadios = (name, cur) => `<div class="htm-scope" role="radiogroup" aria-label="${L.scopeLabel}">${['all', 'desktop', 'mobile'].map((s) => `<label><input type="radio" name="${name}" value="${s}" ${s === cur ? 'checked' : ''}><span>${L.scope[s]}</span></label>`).join('')}</div>`;
  const normScope = (s) => (s === '데스크톱만' || s === 'Desktop only' ? 'desktop' : s === '모바일만' || s === 'Mobile only' ? 'mobile' : s && L.scope[s] ? s : 'all');
  function openPop(tg, item, x, y) {
    closePop();
    const el = tg.type === 'el' ? resolve(tg.path) : null;
    const host = resolve(tg.path);
    const secName = host ? sectionOf(host).name : (item && item.sec) || '';
    const d = el ? describe(el) : { kind: L.kind.region, txt: '' };
    const scope = item ? normScope(item.scope) : 'all';
    pop = $(`<div class="htm-pop htm-ui" role="dialog" aria-label="${L.popLabel}">
      <div class="htm-pop__target"><b>${esc(secName)}</b> › ${esc(d.kind)}${d.txt ? esc(quote(d.txt)) : ''}</div>
      <div class="htm-chips">${L.chips.map((c) => `<button type="button">${esc(c)}</button>`).join('')}</div>
      <textarea aria-label="${L.popLabel}" placeholder="${esc(L.placeholder)}">${item ? esc(item.text) : ''}</textarea>
      ${scopeRadios('htm-scope', scope)}
      <div class="htm-pop__row">${item ? `<button class="htm-btn htm-del" data-a="del">${L.del}</button>` : ''}<button class="htm-btn" data-a="cancel">${L.cancel}</button><button class="htm-btn htm-btn--dark" data-a="save">${L.save} <span style="opacity:.6;font-weight:600">${/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘↵' : 'Ctrl↵'}</span></button></div>
    </div>`);
    document.body.append(pop);
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(x + 12, innerWidth - pw - 8)) + 'px';
    pop.style.top = Math.max(8, Math.min(y + 12, innerHeight - ph - 8)) + 'px';
    popCtx = { target: tg, item, sec: secName, desc: d };
    const ta = pop.querySelector('textarea'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    pop.querySelector('.htm-chips').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      ta.value = ta.value ? ta.value.replace(/\s*$/, '') + ', ' + b.textContent : b.textContent; ta.focus();
    });
    // ⌘/Ctrl+Enter saves; this shortcut does not clash with IME confirmation.
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); savePop(); } });
    pop.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'save') savePop();
      if (a.dataset.a === 'cancel') closePop();
      if (a.dataset.a === 'del') { S.items = S.items.filter((i) => i !== popCtx.item); save(); closePop(); renderAll(); }
    });
  }
  function savePop() {
    const text = pop.querySelector('textarea').value.trim();
    if (!text) return toast(L.needText);
    const scope = pop.querySelector('input[name="htm-scope"]:checked').value;
    if (popCtx.item) Object.assign(popCtx.item, { text, scope });
    else S.items.push({ id: ++S.seq, kind: popCtx.target.type, ...popCtx.target, sec: popCtx.sec, label: popCtx.desc.kind + (popCtx.desc.txt ? quote(popCtx.desc.txt) : ''), text, scope, vp: vpName() + ' ' + innerWidth + 'px', done: false, at: Date.now() });
    save(); closePop(); renderAll(); toast(L.saved);
  }

  /* ── edit-text mode ───────────────────────── */
  const INLINE_OK = 'br, strong, em, b, i, u, s, small, span, code, mark, sup, sub, abbr, time, wbr';
  function markEditable() {
    let nodes = [];
    try { nodes = document.querySelectorAll(CFG.editable); } catch (e) { nodes = []; }
    nodes.forEach((el) => {
      if (isUI(el) || el.closest('[aria-hidden="true"], svg, script, style, noscript')) return;
      if (!el.innerText || !el.innerText.trim()) return;
      if ([...el.children].some((c) => !c.matches(INLINE_OK))) return; // skip blocks that hold other blocks
      el.setAttribute('data-htm-editable', '');
    });
  }
  function stopEditing() { document.querySelectorAll('[data-htm-editing]').forEach((el) => el.blur()); document.querySelectorAll('[data-htm-editable]').forEach((el) => el.removeAttribute('data-htm-editable')); }
  document.addEventListener('click', (e) => {
    if (S.mode !== 'edit' || isUI(e.target)) return;
    const el = e.target.closest('[data-htm-editable]'); if (!el || el.isContentEditable) return;
    if (!el.hasAttribute('data-htm-orig')) el.setAttribute('data-htm-orig', el.innerText);
    el.contentEditable = 'true'; el.setAttribute('data-htm-editing', ''); el.focus();
    el.addEventListener('blur', function done() {
      el.removeEventListener('blur', done); el.removeAttribute('contenteditable'); el.removeAttribute('data-htm-editing');
      const before = el.getAttribute('data-htm-orig'), after = el.innerText;
      const path = pathOf(el); const ex = S.items.find((i) => i.kind === 'copy' && i.path === path);
      if (before === after) { if (ex) { S.items = S.items.filter((i) => i !== ex); el.removeAttribute('data-htm-edited'); } }
      else if (ex) ex.after = after;
      else S.items.push({ id: ++S.seq, kind: 'copy', path, sec: sectionOf(el).name, label: describe(el).kind, before, after, scope: 'all', vp: vpName() + ' ' + innerWidth + 'px', done: false, at: Date.now() });
      if (before !== after) el.setAttribute('data-htm-edited', '');
      save(); renderAll();
    });
  });
  // Show edited text again after a reload.
  function reapplyCopy() {
    S.items.filter((i) => i.kind === 'copy').forEach((i) => {
      const el = resolve(i.path); if (!el) return;
      if (!el.hasAttribute('data-htm-orig')) el.setAttribute('data-htm-orig', i.before);
      if (el.innerText !== i.after) el.innerText = i.after;
      el.setAttribute('data-htm-edited', '');
    });
  }

  /* ── pins and regions ───────────────────────── */
  function renderPins() {
    layer.innerHTML = '';
    let n = 0;
    S.items.forEach((i) => {
      n++;
      if (i.kind === 'copy') return;
      const host = resolve(i.path); if (!host) return;
      const r = host.getBoundingClientRect();
      if (!r.width && !r.height) return; // hidden at this width
      let x, y;
      if (i.kind === 'region') {
        const box = $(`<div class="htm-rect${i.done ? ' htm-done' : ''}"></div>`);
        Object.assign(box.style, { left: r.left + scrollX + i.rx * r.width + 'px', top: r.top + scrollY + i.ry * r.height + 'px', width: i.rw * r.width + 'px', height: i.rh * r.height + 'px' });
        layer.append(box);
        x = r.left + scrollX + i.rx * r.width; y = r.top + scrollY + i.ry * r.height;
      } else { x = r.left + scrollX + i.ox * r.width; y = r.top + scrollY + i.oy * r.height; }
      const pin = $(`<button class="htm-pin${i.done ? ' htm-done' : ''}" data-id="${i.id}" title="${esc(i.text || '')}">${n}</button>`);
      Object.assign(pin.style, { left: x + 'px', top: y + 'px' });
      pin.addEventListener('click', (e) => { e.stopPropagation(); if (i.kind === 'tune') { setMode('tune'); openTune(host, i); return; } const pr = pin.getBoundingClientRect(); openPop(i, i, pr.right, pr.top); });
      layer.append(pin);
    });
  }

  /* ── list panel ───────────────────────────── */
  const panel = $(`<aside class="htm-panel htm-ui" aria-label="${L.panel}">
    <header><b>${L.panel}</b><button class="htm-btn" data-p="close">${L.close}</button></header>
    <div class="htm-panel__body"></div>
    <footer><button class="htm-btn" data-p="clear">${L.clearAll}</button><button class="htm-btn htm-btn--dark" data-p="copy">${L.copy}</button></footer>
  </aside>`);
  document.body.append(panel);
  function togglePanel() { panel.classList.toggle('htm-open'); renderPanel(); }
  function revertCopy(i) { const el = resolve(i.path); if (el) { el.innerText = i.before; el.removeAttribute('data-htm-edited'); el.removeAttribute('data-htm-orig'); } }
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p === 'close') panel.classList.remove('htm-open');
    if (b.dataset.p === 'copy') copyAll();
    if (b.dataset.p === 'clear' && S.items.length && confirm(L.confirmClear)) {
      S.items.filter((i) => i.kind === 'copy').forEach(revertCopy);
      S.items.filter((i) => i.kind === 'tune').forEach(unapplyTune);
      S.items = []; S.seq = 0; save(); renderAll();
    }
    const id = +b.closest('[data-id]')?.dataset.id; const it = S.items.find((i) => i.id === id); if (!it) return;
    if (b.dataset.i === 'go') goTo(it);
    if (b.dataset.i === 'done') { it.done = !it.done; save(); renderAll(); }
    if (b.dataset.i === 'del') {
      if (it.kind === 'tune') unapplyTune(it);
      if (it.kind === 'copy') revertCopy(it);
      S.items = S.items.filter((i) => i !== it); save(); renderAll();
    }
  });
  function goTo(it) {
    const el = resolve(it.path); if (!el) return toast(L.notVisible);
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    if (innerWidth < BP_TABLET) panel.classList.remove('htm-open');
    setTimeout(() => { const p = layer.querySelector(`[data-id="${it.id}"]`); if (p) { p.classList.add('htm-flash'); setTimeout(() => p.classList.remove('htm-flash'), 2100); } }, 500);
  }
  function groups() {
    const g = new Map();
    S.items.forEach((i, idx) => { const k = i.sec || L.sec.other; if (!g.has(k)) g.set(k, []); g.get(k).push({ i, n: idx + 1 }); });
    return g;
  }
  const changeText = (i) => i.changes.map((c) => c.label + ' ' + c.before + ' → ' + c.after).join(', ');
  function renderPanel() {
    const body = panel.querySelector('.htm-panel__body');
    if (!S.items.length) { body.innerHTML = `<p class="htm-empty">${L.empty}</p>`; return; }
    body.innerHTML = [...groups()].map(([sec, items]) => `<p class="htm-panel__sec">${esc(sec)}</p>` + items.map(({ i, n }) => `
      <div class="htm-item${i.done ? ' htm-done' : ''}" data-id="${i.id}">
        <span class="htm-item__no">${n}</span>
        <span class="htm-item__text">${i.kind === 'copy' ? `<b>${L.textEdit}</b>${esc(quote(clip(i.before, 60)))} →${esc(quote(clip(i.after, 60)))}` : i.kind === 'tune' ? `<b>${L.style}</b> ${esc(changeText(i))}${i.text ? ' · ' + esc(i.text) : ''}` : esc(i.text)}</span>
        <span class="htm-item__acts"><button data-i="go">${L.go}</button><button data-i="done">${i.done ? L.reopen : L.done}</button><button data-i="del">${L.del}</button></span>
        <span class="htm-item__meta">${esc(i.kind === 'region' ? L.regionMemo : i.label || '')} · ${esc(scopeText(normScope(i.scope)))} · ${esc(i.vp)}</span>
      </div>`).join('')).join('');
  }

  /* ── copy prompt ───────────────────────────── */
  function report() {
    const open = S.items.filter((i) => !i.done);
    const d = new Date(), p2 = (v) => String(v).padStart(2, '0');
    const when = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    let md = `# ${L.rTitle} (${when})\n`;
    md += `${L.rPage}: ${document.title ? document.title + ' · ' : ''}${location.pathname} · ${L.rCount(open.length)}\n`;
    md += `${L.rNote}\n`;
    let n = 0;
    for (const [sec, items] of groups()) {
      const rows = items.filter(({ i }) => !i.done); if (!rows.length) continue;
      md += `\n## ${sec}\n`;
      rows.forEach(({ i }) => {
        n++;
        const sc = scopeText(normScope(i.scope));
        if (i.kind === 'copy') md += `${n}. ${L.rText} "${i.before.replace(/\n/g, ' / ')}" → "${i.after.replace(/\n/g, ' / ')}"\n   - ${L.rWhere}: ${i.label} · \`${i.path}\`\n`;
        else if (i.kind === 'tune') md += `${n}. ${L.rTune} ${i.label}: ${changeText(i)}${i.text ? ' (' + i.text + ')' : ''}\n   - ${L.rApply}: ${sc} · ${L.rAt}: ${i.vp} · \`${i.path}\`\n`;
        else if (i.kind === 'region') md += `${n}. ${L.rRegion} ${i.text}\n   - ${L.rRange(Math.round(i.rx * 100), Math.round((i.rx + i.rw) * 100), Math.round(i.ry * 100), Math.round((i.ry + i.rh) * 100))} · ${L.rApply}: ${sc} · ${L.rAt}: ${i.vp} · \`${i.path}\`\n`;
        else md += `${n}. ${i.label}: ${i.text}\n   - ${L.rApply}: ${sc} · ${L.rAt}: ${i.vp} · \`${i.path}\`\n`;
      });
    }
    return md;
  }
  // execCommand fallback only for hosts we don't control (http:, denied permission).
  function legacyCopy(text) {
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.className = 'htm-ui'; field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;opacity:0';
    document.body.append(field); field.select();
    try { return document.execCommand('copy'); } catch (e) { return false; } finally { field.remove(); }
  }
  async function copyAll() {
    if (!S.items.some((i) => !i.done)) return toast(L.nothing);
    const md = report();
    let ok = true;
    try { await navigator.clipboard.writeText(md); } catch (e) { ok = legacyCopy(md); }
    toast(ok ? L.copied : L.copyFail);
  }

  /* ── style mode: try values with sliders ─── */
  const px = (v) => parseFloat(v) || 0;
  const TUNE = [
    { k: 'font-size', unit: 'px', min: 10, max: 120, step: 1, read: (cs) => px(cs.fontSize) },
    { k: 'font-weight', type: 'select', opts: [300, 400, 500, 600, 700, 800, 900], read: (cs) => +cs.fontWeight },
    { k: 'line-height', unit: '', min: 0.9, max: 2.2, step: 0.05, read: (cs) => cs.lineHeight === 'normal' ? 1.2 : +(px(cs.lineHeight) / px(cs.fontSize)).toFixed(2) },
    { k: 'letter-spacing', unit: 'em', min: -0.08, max: 0.2, step: 0.005, read: (cs) => cs.letterSpacing === 'normal' ? 0 : +(px(cs.letterSpacing) / px(cs.fontSize)).toFixed(3) },
    { k: 'padding-block', unit: 'px', min: 0, max: 160, step: 2, read: (cs) => px(cs.paddingTop) },
    { k: 'padding-inline', unit: 'px', min: 0, max: 160, step: 2, read: (cs) => px(cs.paddingLeft) },
    { k: 'margin-top', unit: 'px', min: -80, max: 240, step: 2, read: (cs) => px(cs.marginTop) },
    { k: 'margin-bottom', unit: 'px', min: -80, max: 240, step: 2, read: (cs) => px(cs.marginBottom) },
    { k: 'gap', unit: 'px', min: 0, max: 160, step: 2, read: (cs) => px(cs.rowGap), when: (cs) => /flex|grid/.test(cs.display) },
    { k: 'max-width', unit: 'px', min: 120, max: 1440, step: 10, read: (cs, el) => Math.round(el.getBoundingClientRect().width) },
  ];
  const tLabel = (k) => L.t[k] || k;
  const hex = (c) => {
    const m = /^rgba?\(([^)]+)\)$/.exec(String(c).trim()); if (!m) return c;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (p.length > 3 && p[3] < 1) return c;
    return '#' + p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  };
  // Swatches: the `colors` option, or color-valued CSS custom properties declared on :root/html.
  let PALETTE = null;
  function palette() {
    if (PALETTE) return PALETTE;
    const probe = document.createElement('i'); probe.className = 'htm-ui'; probe.style.display = 'none'; document.body.append(probe);
    const norm = (v) => { probe.style.color = ''; probe.style.color = v; return probe.style.color ? hex(getComputedStyle(probe).color) : null; };
    const out = [], seen = new Set();
    const add = (v, name) => { const h = norm(v); if (!h || seen.has(h)) return; seen.add(h); out.push([h, name || h]); };
    if (CFG.colors) CFG.colors.forEach((c) => add(c, c));
    else {
      const names = new Set();
      const walk = (rules) => { for (const r of rules) { if (r.cssRules && !r.selectorText) walk(r.cssRules); if (r.style && /(^|,)\s*(:root|html)\s*(,|$)/.test(r.selectorText || '')) for (const p of r.style) if (p.startsWith('--')) names.add(p); } };
      for (const sh of document.styleSheets) { if (sh.ownerNode === styleEl) continue; let rules; try { rules = sh.cssRules; } catch (e) { continue; } if (rules) walk(rules); }
      const root = getComputedStyle(document.documentElement);
      for (const n of names) {
        if (n.startsWith('--htm-')) continue;
        const v = root.getPropertyValue(n).trim();
        if (!v || /^(transparent|inherit|initial|unset|revert|currentcolor)$/i.test(v) || !CSS.supports('color', v)) continue;
        add(v, n);
        if (out.length >= 18) break;
      }
      if (!out.length) ['#000000', '#333333', '#666666', '#999999', '#dddddd', '#ffffff'].forEach((c) => add(c));
    }
    probe.remove();
    return (PALETTE = out);
  }
  const colorName = (v) => { const p = palette().find(([c]) => c === v); return p && p[1] !== v ? `${v} (var(${p[1]}))` : v; };
  let tune = null;
  const fmt = (d, v) => d.type === 'select' ? String(v) : d.unit === 'em' ? (+v).toFixed(3) + 'em' : d.unit === '' ? (+v).toFixed(2) : Math.round(v) + 'px';
  function openTune(el, item) {
    closeTune(true);
    if (item) unapplyTune(item); // read the original values without the saved tweak
    const cs = getComputedStyle(el);
    const d = describe(el);
    tune = { el, item, origStyle: el.getAttribute('style'), base: {}, now: {} };
    TUNE.forEach((t) => { if (!t.when || t.when(cs)) tune.base[t.k] = t.read(cs, el); });
    tune.base.color = hex(cs.color); tune.base['background-color'] = /^(rgba\(0, 0, 0, 0\)|transparent)$/.test(cs.backgroundColor) ? '' : hex(cs.backgroundColor);
    if (item) item.changes.forEach((c) => { tune.now[c.k] = c.raw; });
    el.classList.add('htm-tuning');
    const rows = TUNE.filter((t) => t.k in tune.base).map((t) => {
      const v = tune.now[t.k] ?? tune.base[t.k];
      const id = 'htm-t-' + t.k;
      const opts = t.opts && !t.opts.includes(v) ? [...t.opts, v].sort((a, b) => a - b) : t.opts;
      const ctl = t.type === 'select' ? `<select id="${id}" data-k="${t.k}">${opts.map((o) => `<option ${o == v ? 'selected' : ''}>${o}</option>`).join('')}</select>`
        : `<input id="${id}" type="range" data-k="${t.k}" min="${Math.min(t.min, v)}" max="${Math.max(t.max, v)}" step="${t.step}" value="${v}">`;
      return `<div class="htm-tune__row" data-row="${t.k}"><label for="${id}">${tLabel(t.k)}</label>${ctl}<output>${fmt(t, v)}</output></div>`;
    }).join('');
    const pal = palette();
    const sw = (k, withNone) => {
      const listC = withNone ? [['', L.none], ...pal] : pal;
      const cur = tune.now[k] ?? tune.base[k];
      return `<div class="htm-tune__row" data-row="${k}"><label>${tLabel(k)}</label><div class="htm-sw" role="group" aria-label="${tLabel(k)}" style="grid-column: span 2">${listC.map(([c, n]) => `<button type="button" data-k="${k}" data-v="${c}" title="${esc(n)}" aria-label="${esc(n)}" class="${c ? '' : 'htm-none'}" style="${c ? 'background:' + c : ''}" aria-pressed="${cur === c}"></button>`).join('')}</div></div>`;
    };
    const box = $(`<div class="htm-tune htm-ui" role="dialog" aria-label="${L.tuneLabel}">
      <div class="htm-tune__head"><div><b>${esc(sectionOf(el).name)}</b><br><span>${esc(d.kind)}${d.txt ? esc(quote(d.txt)) : ''}</span></div><button class="htm-btn" data-a="revert">${L.revert}</button></div>
      ${rows}${sw('color', false)}${sw('background-color', true)}
      <textarea aria-label="${esc(L.notePh)}" placeholder="${esc(L.notePh)}">${item ? esc(item.text || '') : ''}</textarea>
      ${scopeRadios('htm-tscope', item ? normScope(item.scope) : 'all')}
      <div class="htm-pop__row">${item ? `<button class="htm-btn htm-del" data-a="del">${L.del}</button>` : ''}<button class="htm-btn" data-a="cancel">${L.cancel}</button><button class="htm-btn htm-btn--dark" data-a="save">${L.save}</button></div>
    </div>`);
    document.body.append(box); tune.box = box;
    const apply = (k, v) => {
      const t = TUNE.find((x) => x.k === k);
      tune.now[k] = v;
      const val = k === 'color' || k === 'background-color' ? (v || 'transparent') : t.type === 'select' ? v : v + t.unit;
      el.style.setProperty(k, val, 'important');
      const row = box.querySelector(`[data-row="${k}"]`);
      if (t) row.querySelector('output').textContent = fmt(t, v);
      row.classList.toggle('htm-changed', String(v) !== String(tune.base[k]));
      rerender();
    };
    Object.keys(tune.now).forEach((k) => apply(k, tune.now[k]));
    box.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) apply(k, +e.target.value); });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k) { box.querySelectorAll(`button[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); apply(b.dataset.k, b.dataset.v); }
      if (b.dataset.a === 'revert') { const it = tune.item; tune.item = null; openTune(el, null); if (it) { unapplyTune(it); tune.item = it; } }
      if (b.dataset.a === 'cancel') closeTune(true);
      if (b.dataset.a === 'del') { S.items = S.items.filter((i) => i !== tune.item); tune.item = null; save(); closeTune(true); renderAll(); }
      if (b.dataset.a === 'save') saveTune();
    });
  }
  function saveTune() {
    const changes = Object.keys(tune.now).filter((k) => String(tune.now[k]) !== String(tune.base[k])).map((k) => {
      const t = TUNE.find((x) => x.k === k);
      const show = (v) => t ? fmt(t, v) : (v ? colorName(v) : L.none);
      return { k, label: tLabel(k), before: show(tune.base[k]), after: show(tune.now[k]), raw: tune.now[k] };
    });
    if (!changes.length) return toast(L.noChange);
    const text = tune.box.querySelector('textarea').value.trim();
    const scope = tune.box.querySelector('input[name="htm-tscope"]:checked').value;
    const el = tune.el, d = describe(el);
    if (tune.item) Object.assign(tune.item, { changes, text, scope });
    else S.items.push({ id: ++S.seq, kind: 'tune', path: pathOf(el), ox: 1, oy: 0, sec: sectionOf(el).name, label: d.kind + (d.txt ? quote(d.txt) : ''), changes, text, scope, vp: vpName() + ' ' + innerWidth + 'px', done: false, at: Date.now() });
    save(); closeTune(false); renderAll(); toast(L.tuneSaved);
  }
  function closeTune(revert) {
    if (!tune) return;
    tune.el.classList.remove('htm-tuning');
    if (revert) { if (tune.origStyle == null) tune.el.removeAttribute('style'); else tune.el.setAttribute('style', tune.origStyle); if (tune.item) applyTune(tune.item); }
    tune.box.remove(); tune = null; rerender();
  }
  function applyTune(i) {
    const el = resolve(i.path); if (!el) return;
    i.changes.forEach((c) => { const t = TUNE.find((x) => x.k === c.k); const v = t ? (t.type === 'select' ? c.raw : c.raw + t.unit) : (c.raw || 'transparent'); el.style.setProperty(c.k, v, 'important'); });
  }
  function unapplyTune(i) { const el = resolve(i.path); if (el) i.changes.forEach((c) => el.style.removeProperty(c.k)); }

  /* ── measure mode ───────────────────────────── */
  let mA = null, mB = null;
  const meas = $('<div class="htm-measure htm-ui"></div>'); document.body.append(meas);
  function clearMeasure() { mA = mB = null; meas.innerHTML = ''; }
  document.addEventListener('mousemove', (e) => {
    if (S.mode !== 'measure' || isUI(e.target)) return;
    mB = target(e.target); drawMeasure();
  }, { passive: true });
  addEventListener('scroll', () => { if (S.mode === 'measure') drawMeasure(); }, { passive: true });
  function drawMeasure() {
    meas.innerHTML = '';
    const box = (r, cls) => { const d = $(`<div class="htm-box ${cls}"></div>`); Object.assign(d.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); meas.append(d); };
    const tag = (x, y, t, cls = '') => { const d = $(`<span class="htm-tag ${cls}"></span>`); d.textContent = t; Object.assign(d.style, { left: x + 'px', top: y + 'px' }); meas.append(d); };
    const line = (x, y, w, h) => { const d = $('<i class="htm-line"></i>'); Object.assign(d.style, { left: x + 'px', top: y + 'px', width: Math.max(w, 1) + 'px', height: Math.max(h, 1) + 'px' }); meas.append(d); };
    const R = (r) => Math.round(r);
    if (mA) { const a = mA.getBoundingClientRect(); box(a, 'htm-box--a'); tag(a.left, a.top - 20, `${L.base} ${R(a.width)}×${R(a.height)}`, 'htm-tag--a'); }
    if (!mB || mB === mA) return;
    const b = mB.getBoundingClientRect(); box(b, 'htm-box--b');
    if (!mA) { tag(b.left, b.bottom + 4, `${R(b.width)}×${R(b.height)} · ${L.pickBase}`, 'htm-tag--info'); return; }
    const a = mA.getBoundingClientRect();
    const inside = (o, i) => i.left >= o.left - .5 && i.right <= o.right + .5 && i.top >= o.top - .5 && i.bottom <= o.bottom + .5;
    const info = [];
    if (inside(a, b) || inside(b, a)) {
      const o = inside(a, b) ? a : b, i = o === a ? b : a, cy = i.top + i.height / 2, cx = i.left + i.width / 2;
      [[o.left, cy, i.left - o.left], [i.right, cy, o.right - i.right]].forEach(([x, y, w]) => { if (w > .5) { line(x, y, w, 1); tag(x + w / 2, y, R(w)); } });
      [[cx, o.top, i.top - o.top], [cx, i.bottom, o.bottom - i.bottom]].forEach(([x, y, h]) => { if (h > .5) { line(x, y, 1, h); tag(x, y + h / 2, R(h)); } });
    } else {
      const hx = b.left >= a.right ? [a.right, b.left] : a.left >= b.right ? [b.right, a.left] : null;
      const vy = b.top >= a.bottom ? [a.bottom, b.top] : a.top >= b.bottom ? [b.bottom, a.top] : null;
      if (hx) { const y = Math.max(a.top, b.top) + Math.min(a.height, b.height) / 2; line(hx[0], y, hx[1] - hx[0], 1); tag((hx[0] + hx[1]) / 2, y, R(hx[1] - hx[0])); }
      if (vy) { const x = Math.max(a.left, b.left) + Math.min(a.width, b.width) / 2; line(x, vy[0], 1, vy[1] - vy[0]); tag(x, (vy[0] + vy[1]) / 2, R(vy[1] - vy[0])); }
      if (hx && !vy) info.push(`${L.dTop} ${R(b.top - a.top)}px`, `${L.dBottom} ${R(b.bottom - a.bottom)}px`);
      if (vy && !hx) info.push(`${L.dLeft} ${R(b.left - a.left)}px`, `${L.dRight} ${R(b.right - a.right)}px`);
    }
    tag(b.left, b.bottom + 4, [`${R(b.width)}×${R(b.height)}`, ...info].join(' · '), 'htm-tag--info');
  }

  /* ── grid ───────────────────────────── */
  let grid = null;
  function toggleGrid() {
    if (grid) { grid.remove(); grid = null; }
    else { grid = $('<div class="htm-grid htm-ui"></div>'); document.body.append(grid); placeGrid(); }
    dock.querySelector('[data-act="grid"]').setAttribute('aria-pressed', String(!!grid));
  }
  // Content box of the first visible element matching the `container` option (selector order wins);
  // falls back to the full viewport width.
  function findContainer() {
    for (const sel of containerSel.split(',')) {
      let nodes = []; try { nodes = document.querySelectorAll(sel.trim()); } catch (e) {}
      const c = [...nodes].find((n) => n.offsetWidth && !isUI(n));
      if (c) return c;
    }
    return null;
  }
  function placeGrid() {
    if (!grid) return;
    const c = findContainer();
    let left = 0, width = document.documentElement.clientWidth;
    if (c) { const r = c.getBoundingClientRect(), cs = getComputedStyle(c); left = r.left + px(cs.paddingLeft); width = r.width - px(cs.paddingLeft) - px(cs.paddingRight); }
    const [cm, ct, cd] = CFG.columns;
    const n = innerWidth >= BP_DESKTOP ? cd : innerWidth >= BP_TABLET ? ct : cm;
    const gap = CFG.gridGap || getComputedStyle(document.documentElement).getPropertyValue('--grid-gap').trim() || '16px';
    Object.assign(grid.style, { left: left + 'px', width: width + 'px', gridTemplateColumns: `repeat(${n}, 1fr)`, columnGap: gap });
    grid.innerHTML = '<i></i>'.repeat(n);
  }

  /* ── hide ───────────────────────────── */
  function toggleHide() {
    const on = document.body.classList.toggle('htm-hide');
    dock.querySelector('[data-act="hide"]').setAttribute('aria-pressed', String(on));
    toast(on ? L.hidden : L.shown);
  }

  /* ── width preview ───────────────────────── */
  let frame = null;
  function openFrame(w) {
    if (inFrame) return;
    closePop(); setMode('view');
    if (!frame) {
      frame = $(`<div class="htm-frame htm-ui"><div class="htm-frame__bar">${[375, 768, 1440].map((x) => `<button data-fw="${x}">${x}</button>`).join('')}<span class="htm-frame__info"></span><button class="htm-close">${L.frameClose}</button></div><div class="htm-frame__stage"><iframe title="${L.frameTitle}"></iframe></div></div>`);
      document.body.append(frame);
      const f = frame.querySelector('iframe');
      // When loaded by bookmarklet the framed page has no <script> for HTMemo: inject the same file.
      f.addEventListener('load', () => {
        try {
          const w2 = f.contentWindow;
          if (w2.__htmemo || !SRC) return;
          const s = w2.document.createElement('script'); s.src = SRC;
          if (LANG) s.dataset.lang = LANG;
          w2.document.body.append(s);
        } catch (e) {}
      });
      f.src = location.href.split('#')[0];
      frame.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.fw) sizeFrame(+b.dataset.fw); if (b.classList.contains('htm-close')) closeFrame(); });
      document.documentElement.style.overflow = 'hidden';
    }
    sizeFrame(w);
  }
  function sizeFrame(w) {
    frame.dataset.w = w;
    const stage = frame.querySelector('.htm-frame__stage'), f = frame.querySelector('iframe');
    const sc = Math.min(1, (stage.clientWidth - 24) / w);
    Object.assign(f.style, { width: w + 'px', height: stage.clientHeight / sc + 'px', transform: `scale(${sc})` });
    frame.querySelectorAll('[data-fw]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.fw === w)));
    frame.querySelector('.htm-frame__info').textContent = L.frameInfo(w, sc);
  }
  function closeFrame() {
    frame.remove(); frame = null; document.documentElement.style.overflow = '';
    S.items.filter((i) => i.kind === 'tune').forEach(unapplyTune);
    try { const st = JSON.parse(store.get(KEY) || '{}'); S.items = st.items || []; S.seq = st.seq || 0; } catch (e) {}
    reapplyCopy(); S.items.filter((i) => i.kind === 'tune').forEach(applyTune); renderAll();
  }
  addEventListener('resize', () => { if (frame) sizeFrame(+frame.dataset.w); placeGrid(); });

  /* ── render ───────────────────────────── */
  function renderAll() {
    const open = S.items.filter((i) => !i.done).length;
    dock.querySelectorAll('.htm-count').forEach((c) => { c.textContent = open; c.toggleAttribute('data-zero', open === 0); });
    renderPins(); if (panel.classList.contains('htm-open')) renderPanel();
  }
  let raf; const rerender = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderPins); };
  addEventListener('resize', rerender);
  new ResizeObserver(rerender).observe(document.body);
  reapplyCopy();
  S.items.filter((i) => i.kind === 'tune').forEach(applyTune);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(renderAll);
  renderAll();

  /* ── public API ───────────────────────────── */
  const api = {
    version: VERSION,
    lang: LANG,
    getPrompt: report,
    getItems: () => JSON.parse(JSON.stringify(S.items)),
    setMode: (m) => setMode(['comment', 'region', 'edit', 'tune', 'measure'].includes(m) ? m : 'view'),
    copyPrompt: copyAll,
  };
  window.HTMemo = Object.assign(window.HTMemo && typeof window.HTMemo === 'object' ? window.HTMemo : {}, api);
  };
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
