---
name: htmemo
description: Add the HTMemo review toolbar to an HTML page, remove it before release, or apply a change-request prompt copied from HTMemo ("# Design change requests" / "# 디자인 수정 요청"). Use when the user wants to review a web page visually with memos, or pastes an HTMemo prompt.
---

# HTMemo

HTMemo is a single-file review toolbar (https://github.com/kkjjjy1b/htmemo). Reviewers leave comments, region notes, inline text edits and style tweaks on a page, then press "Copy prompt" and paste the result here.

## Add it to a page

Insert this line right before `</body>` of the HTML page the user names (ask which page if unclear):

```html
<script src="https://cdn.jsdelivr.net/gh/kkjjjy1b/htmemo@v0.1.0/htmemo.js" defer></script>
```

- Optional attributes: `data-lang="ko|en"`, `data-bottom="76"` (lift the toolbar above a fixed bottom bar), `data-mobile-bottom`, `data-container=".container"` (grid alignment), `data-colors="#111,#2563eb"` (style swatches).
- If the page is opened as a local `file://` page, that's fine; the toolbar works there too.
- Tell the user it is a review-only line and should be removed before release. Remove it when asked.

## Apply a pasted HTMemo prompt

The prompt is Markdown grouped by page section. Each item ends with a CSS selector path in backticks.

1. Find the element in the source by the selector path and the quoted text. Paths use `:nth-of-type()` from the nearest element with an `id`; if the markup changed, match by the quoted text instead.
2. Respect "Applies to": "All screens" changes every width; "Desktop only" / "Mobile only" must be scoped with a media query (use the project's existing breakpoints).
3. `[Text edit]` items give the exact before → after text. Replace the text verbatim, keeping inline markup.
4. `[Style tweak]` items give exact before → after values (px, em, hex). When a color shows `var(--name)`, use that custom property instead of the hex value. Prefer changing the existing CSS rule over inline styles.
5. `[Region]` items describe an area as percentages of the section; use them to locate what the note is about.
6. When an item is ambiguous, apply the others and list the unclear ones back to the user instead of guessing.
