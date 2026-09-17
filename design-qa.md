# Project search redesign QA

- Source visual truth: `C:\Users\admin\.codex\codex-remote-attachments\019f54a5-e628-7372-973f-38f10cd3d526\C4BAD0E7-FE5B-4781-BFF1-E56AD7C6A6DA\1-照片-1.jpg`
- Implementation route: `/pages-sub/project/project`
- Target viewport: 390 x 844
- State: initial project-list load

## Full-view comparison evidence

The reference uses approximately 6.5% side margins, a large title offset below the top navigation, 12px-scale card corners, 1px neutral outlines, 20px vertical card gaps, muted secondary identifiers, pale-green status labels, and plain text actions. The implementation now maps those measurements to project-search semantics: a 25px mobile side margin, 86px title offset, 12px card radius, 1px outline, 20px card gap, and explicit text copy actions.

## Focused region comparison

The header/search region was captured in the in-app browser. The project-card region could not be captured because the local H5 preview remains in its loading state while the project-list request is unresolved. No visual comparison of populated cards is available from the local preview.

## Findings

- [P1] Populated project cards are not available in the local H5 capture.
  - Location: local H5 preview of `/pages-sub/project/project`.
  - Evidence: the current capture shows the page loading state rather than project data.
  - Impact: card typography, long-number truncation, and the explicit `复制` actions cannot be visually verified against the reference at this time.
  - Fix: run the mini-program with a reachable project-list backend, then recapture the same 390 x 844 state.

## Implementation checklist

1. Verify the populated list in the mini-program runtime.
2. Check long project numbers and names at 390px width.
3. Confirm that both `复制` actions remain tappable.

## Comparison history

- Initial pass: changed the previous dark concept to the reference's white, outlined, low-elevation account-list visual system.
- Second pass: replaced the earlier larger-radius/looser card layout with the reference-derived margin, radius, border, and vertical-gap values.

final result: blocked

---

# Employee Certification Expanding Swiper QA

## Evidence

- Source visual truth: `C:\Users\admin\Documents\xwechat_files\liuwenchina_6d11\msg\video\2026-08\991a5d3bbaae234d683a797d84262942.mp4`
- Indicator reference: `C:\Users\admin\AppData\Local\Temp\codex-clipboard-844c7349-d94b-45cf-9ddf-3ffd151daf39.png`
- Normalized source frame: `D:\devTools\workspace\vscode\office-mp\employee-certification-reference.png`
- Pre-correction implementation screenshot: `D:\devTools\workspace\vscode\office-mp\employee-certification-implementation.png`
- Pre-correction combined comparison: `D:\devTools\workspace\vscode\office-mp\employee-certification-comparison.png`
- Viewport: 393 x 852 CSS px at device pixel ratio 1.
- Pixel dimensions: source video 592 x 1280; normalized source frame and implementation screenshot 393 x 852; the source frame was scaled to the implementation viewport for comparison.
- State: settled expanded card with the next narrow card visible; implementation also tested after one left swipe.

## Full-view and Focused Comparison

- The side-by-side comparison confirms the requested structure: a wide active card, a narrow next-card preview, fixed-height image cropping, rounded white cards, and the next card entering from the right.
- A separate focused crop was not required because both carousel regions and their card edges remain clearly readable at native size in the combined 786 x 852 comparison.

## Required Fidelity Surfaces

- Fonts and typography: the employee sequence, department, name, and phone retain the existing 17px semibold treatment; wrapping remains inside the card as its width changes.
- Spacing and layout rhythm: every card now keeps the same 54vw width. The carousel begins at an 8vw left inset and uses a 200rpx trailing margin so roughly half of the adjacent full-width card remains outside the viewport; inactive cards sit 35px lower.
- Colors and visual tokens: the existing `#f1f3f7` page surface, white cards, neutral text, card shadow, and primary status tag are preserved.
- Image quality and asset fidelity: employee images remain real API-provided assets and use `aspectFill`, so the transition changes the visible crop without stretching the image.
- Copy and content: the existing employee sequence, department, name, phone number, and `已审核` / `未审核` status remain unchanged.

## Findings

- [P2] The corrected fixed-width vertical interpolation has not been captured on the target runtime.
  - Evidence: user feedback identified that the cards should never change width; the narrow appearance comes from viewport clipping. The code now keeps every card at 54vw, places roughly half of the adjacent card offscreen, and moves inactive cards down by 35px, but the available comparison image predates that correction.
  - Fix: capture one completed swipe in WeChat DevTools or on a device and compare the outgoing/downward and incoming/upward paths with the reference video.

## Primary Interactions and Console

- One left drag changed the active card from the first employee to the second, expanded the incoming card, reduced the outgoing card, and changed the status from `未审核` to `已审核`.
- The H5 interaction emitted no console warnings or errors.
- The production mini-program build passed and generated native `bindtransition`, `bindchange`, and `bindanimationfinish` bindings. WeChat DevTools device rendering remains unavailable because its CLI service port is disabled.

## Comparison History

- Initial state: the page used the native Skyline Tinder stack with a single 83vw card and no adjacent expanding-card interpolation.
- Implementation pass: replaced the stack with a left-anchored carousel and continuous width interpolation based on swipe distance.
- Interaction pass: verified the next card preview, completed swipe, active employee update, and status update at 393 x 852.
- User-correction pass: removed width interpolation, fixed every card at 54vw, adjusted the item stride so roughly half of the adjacent card stays offscreen, and added a 0px-to-35px Y-axis interpolation so the outgoing card sinks while the incoming card rises. Lint and the production mini-program build passed, but a current runtime capture is still required.
- Smoothness pass: removed high-frequency JavaScript updates from the Swiper transition event, retained the current 3000ms autoplay interval with a 500ms horizontal duration, and moved the 0px/35px Y change to a 500ms CSS transform transition. The generated mini-program output contains the autoplay settings and transition CSS; target-runtime visual capture remains outstanding.
- Exit-timing pass: the outgoing card now remains at `translateY(0)` for the whole horizontal transition. The incoming card rises from 35px to 0, and the outgoing card resets to 35px only after `animationfinish`, when it is already offscreen.
- Indicator pass: added the missing left-aligned pagination treatment from the supplied crop: 8rpx light-blue dots, a 28rpx dark-blue active pill, 10rpx gaps, and a 300ms width/color transition synchronized to the active employee index.

## Implementation Checklist

1. Keep API data loading and employee fields unchanged.
2. Keep the swipe-distance interpolation scoped to the active and adjacent cards.
3. Repeat the drag once in WeChat DevTools or on a device when the service port is available.

final result: blocked

---

# Maintenance customer fieldset QA

- Source visual truth: `C:\Users\admin\AppData\Local\Temp\codex-clipboard-43099496-c17b-4778-b32c-bf650acf7e91.png`
- Implementation screenshot: `C:\Users\admin\AppData\Local\Temp\office-mp-maintenance-customer-fieldset.png`
- Focused implementation crop: `C:\Users\admin\AppData\Local\Temp\office-mp-maintenance-customer-fieldset-crop.png`
- Viewport: 390 x 844 CSS px; responsive check repeated at 320 x 844 CSS px
- Pixel dimensions and density: source 940 x 116 px; implementation 390 x 844 px at device scale 1; focused crop 360 x 145 px; no density normalization was required
- State: new maintenance form with the existing project-selection condition temporarily exposed for local visual QA, then restored

## Full-view comparison evidence

The source is an illustrative fieldset fragment rather than a complete mobile screen, so the meaningful full-view comparison is the complete source fragment against the rendered project-information card. The implementation reproduces the defining structure: a neutral one-pixel enclosure, a `客户方` title interrupting the top border, and both contact fields inside the enclosure. The existing mobile card, input surface, spacing system, and two-column contact layout were intentionally preserved.

## Focused region comparison

The source fragment and focused implementation crop were opened together. The implementation matches the requested border-and-legend treatment. Its 8px radius, muted title color, and gray input surfaces follow the existing maintenance form design system rather than copying the browser-default square inputs from the illustrative source.

## Required fidelity surfaces

- Fonts and typography: `客户方`, `联系人`, and `联系电话` use the existing app font stack at 14px; the legend remains readable and visually distinct without introducing a new font.
- Spacing and layout rhythm: the fieldset renders at 330 x 106 px in the 390px viewport with 12px horizontal padding and no page overflow. At 320px it remains within the viewport at 260px wide with no horizontal scroll.
- Colors and visual tokens: white legend mask, `#d9dde5` border, `#667085` legend, and existing `#f7f8fa` input surfaces are consistent with the surrounding form.
- Image quality and asset fidelity: no image or icon assets are part of this component.
- Copy and content: `客户方`, `联系人`, `联系电话`, and both placeholders are present and correct.

## Findings

No actionable P0, P1, or P2 differences remain. The vertical field arrangement in the desktop example was treated as illustrative because the requested change was the enclosure, while the production mobile form already uses a responsive two-column contact layout.

## Primary interactions and console

- Both contact inputs accepted local test values and retained their independent bindings.
- Project selection and work-order submission were not exercised; no data was submitted.
- The browser showed an existing local API load failure and an unrelated `WdUpload` listener warning. Neither was introduced by the fieldset change or affected its rendering.

## Comparison history

- Initial pass: added the border, legend mask, and scoped spacing while preserving the existing selected-project condition and input bindings.
- Visual pass: confirmed the title sits across the top border and both fields remain inside the enclosure at 390px.
- Responsive pass: confirmed no overflow at 320px and verified both inputs accept text; restored the original selected-project condition afterward.

## Implementation checklist

1. Keep the customer fieldset scoped to the create form.
2. Preserve the selected-project visibility condition and existing form bindings.
3. Verify the same selected-project state once in WeChat DevTools when its service port is available.

final result: passed

---

# Project Search Yellow Shell QA

## Evidence

- Source visual truth: `C:\Users\admin\.codex\codex-remote-attachments\01a04afd-cdd9-70a3-9417-4602d9e68f28\1082D63A-33C6-4DA2-AC6B-DC1B9AA9969E\1-照片-1.jpg`
- Implementation screenshot: `D:\devTools\workspace\vscode\office-mp\project-search-implementation.png`
- Combined comparison: `D:\devTools\workspace\vscode\office-mp\project-search-comparison.png`
- Viewport: 393 x 852 CSS px at device pixel ratio 1.
- Pixel dimensions: source 1280 x 509; implementation 393 x 852. The source was proportionally normalized to 393 x 156 for the combined focused comparison; the implementation remained at 393 x 852.
- State: H5 project-search route at initial load. The mini-program-only authenticated API request failed in H5, leaving the existing loading overlay visible.

## Required Fidelity Surfaces

- Fonts and typography: existing project-search typography and copy were intentionally preserved; the reference was used only for the requested yellow shell and white rounded content treatment.
- Spacing and layout rhythm: computed browser evidence shows the white content starts directly below the navbar at y=44, spans the full 393px width, and uses `22px 22px 0 0` corner radii.
- Colors and visual tokens: the navbar and scroll shell both render as `rgb(255, 216, 77)`; the content renders as `rgb(255, 255, 255)`.
- Image quality and asset fidelity: the requested treatment contains no app-owned raster or icon assets, so no assets were generated or substituted.
- Copy and content: `项目检索`, the subtitle, and the search placeholder remain unchanged.

## Findings

- [P2] Unobscured mini-program visual capture is unavailable.
  Location: `pages-sub/project/project` rendered state.
  Evidence: the H5 fallback renders the requested color and radius, but an existing authenticated API failure leaves the global loading overlay visible; WeChat DevTools CLI capture is unavailable because its service port is disabled.
  Impact: the exact safe-area height and unobscured card/list appearance cannot be compared against the reference on the target runtime.
  Fix: open the built mini-program in WeChat DevTools with the service port enabled and capture the authenticated project-search page.

## Full-view and Focused Comparison

- Full-view evidence confirms the yellow navbar/shell and white content surface are present at the mobile viewport, but the loading overlay prevents a passing full-screen comparison.
- The combined focused comparison confirms the requested yellow-to-white transition and rounded white top edge. No additional focused region was needed because no typography, icons, cards, or interactions were requested to change.

## Primary Interactions and Console

- Search and card actions were not exercised because the authenticated project list did not load in H5.
- Console check found one existing project-page API error object during initialization.

## Comparison History

- Initial implementation: changed the outer page and navbar to solid yellow and added a 22px top radius to the existing white content wrapper.
- Browser check: confirmed computed colors and radii at 393 x 852; no CSS correction was needed.
- Target-runtime check: blocked by the disabled WeChat DevTools service port and authenticated H5 API failure.

## Implementation Checklist

1. Keep the yellow treatment scoped to the project-search navbar, page, and scroll shell.
2. Keep existing search, project-card, map, address-edit, and QR behavior unchanged.
3. Repeat the visual capture in an authenticated WeChat DevTools session when its CLI service port is available.

final result: blocked

---

# Employee Certification Heading QA

## Evidence

- Source visual truth: `C:\Users\admin\AppData\Local\Temp\codex-clipboard-21b64684-3495-4c47-9c61-d9e7aa23fd5c.png`
- Implementation screenshot: `D:\devTools\workspace\vscode\office-mp\employee-certification-heading-implementation.png`
- Focused combined comparison: `D:\devTools\workspace\vscode\office-mp\employee-certification-heading-comparison.png`
- Target runtime and viewport: WeChat DevTools Skyline renderer, iPhone 12/13 simulator at 390 CSS px wide.
- Pixel dimensions and normalization: source 480 x 518; full implementation capture 1250 x 1000 including DevTools chrome. The source heading crop and implementation heading crop were each normalized to 382 x 105 and combined into a 764 x 105 comparison.
- State: employee-certification page with API-provided cards loaded and the heading in its settled position.

## Full-view and Focused Comparison

- The full runtime capture confirms the heading sits below the custom navbar, above the card, and does not overlap the card, pagination, or adjacent preview.
- The focused side-by-side comparison confirms the title/subtitle hierarchy, left alignment, two-line vertical rhythm, and card-top gap. The red rectangle in the source is an annotation and was intentionally not implemented.

## Required Fidelity Surfaces

- Fonts and typography: the title uses the app font stack at 20px/28px with weight 700; the subtitle uses 14px/20px and remains on one line at the target width.
- Spacing and layout rhythm: the heading aligns to the card's `8vw + 8rpx` left edge. The first runtime pass placed it about 14px too close to the card; the final pass moved it upward and matches the source crop's title-to-card rhythm.
- Colors and visual tokens: title `#171717` and subtitle `#999` reproduce the source's dark heading and muted supporting copy on the existing `#f1f3f7` page.
- Image quality and asset fidelity: no new image asset was requested; existing employee images remain API-provided and unchanged.
- Copy and content: `解锁专业服务` and `依托「纽迪希亚」128年科研实力，为你打造智慧孕育` match the supplied reference.

## Findings

No actionable P0, P1, or P2 differences remain for the requested heading addition.

## Comparison History

- Initial implementation: added the two text rows with reference-derived hierarchy and card alignment.
- First runtime pass: found the text group approximately 14px too close to the card.
- Final runtime pass: moved the group upward by 14px and confirmed the corrected spacing in the focused combined comparison.

## Implementation Checklist

1. Keep the heading visible only when employee cards are present.
2. Preserve the existing swiper gestures, autoplay, indicator, and API data.
3. Keep the source's red review rectangle out of production UI.

final result: passed

---

# Employee Certification Layered Coverflow QA

## Evidence

- Source visual truth: `C:\Users\admin\AppData\Local\Temp\codex-swiper-709a2898\frame-3.png`
- Motion reference: `C:\Users\admin\AppData\Local\Temp\codex-swiper-709a2898\transition-strip.jpg`
- Implementation screenshot: unavailable after the latest stacked-card rewrite.
- Target runtime and viewport: WeChat DevTools Skyline renderer, iPhone 12/13 simulator at approximately 390 CSS px wide.
- Source pixels: 592 x 1280. Implementation pixels and density normalization are unavailable without a current runtime capture.
- State: second employee-certification screen, settled center card and horizontal transition.

## Required Fidelity Surfaces

- Fonts and typography: existing API-backed department, name, and status typography is preserved; current runtime comparison is unavailable.
- Spacing and layout rhythm: the deck now uses one absolute-positioned layer for every card, a 580rpx center card, 470rpx spacing to the left card and 390rpx spacing to the right preview card. Its three explicit settled poses are: left `Y=0rpx / scale=.78 / rotate=-10deg`, center `Y=70rpx / scale=1 / rotate=0deg`, and right `Y=220rpx / scale=.78 / rotate=-12deg`. Scaling and rotation use the card's top-center as the origin so reducing the side cards no longer pushes their visible top edges downward. The deck is 780rpx tall and allows vertical overflow so the lowered right card is not clipped by the card-stage boundary.
- Colors and visual tokens: the cream surface, blue active category, gold side categories, and blue pagination remain source-aligned; current runtime comparison is unavailable.
- Image quality and asset fidelity: the supplied curved rail crop remains a real raster asset; employee images remain API-provided rather than reference-video artwork.
- Copy and content: employee department, name, and audit status remain unchanged.

## Findings

- [P1] Current Skyline overlap rendering has not been captured after replacing native swiper items with the absolute-positioned deck.
  Location: `coverflow-showcase.vue` layered card deck.
  Evidence: lint, generated code, and the mini-program build pass, but no post-change runtime screenshot exists.
  Impact: z-index overlap, clipping, and the exact side-card exposure cannot be declared visually correct yet.
  Fix: open the second screen in WeChat DevTools and capture both the settled state and a mid-transition state.

## Comparison History

- Earlier implementation: native `swiper-item` ownership separated the cards, so adjacent cards could not visibly cover one another as in the source.
- Current fix: replaced the native horizontal swiper with a single absolute-positioned card deck; every card now shares one stacking context, with `z-index` increasing from left to center to right throughout the gesture. The top category animation is delayed until the 650ms card transition finishes, and each category label and its CSS-rendered dot now move in one container over the stationary raster curve. Category items use three cyclic render copies, so the left copy exits and a separate right copy enters instead of one visible item jumping across the track when the logical index wraps.
- Latest clipping fix: reduced both adjacent cards from `.86` to `.78`, increased the card stage from 720rpx to 780rpx, and changed only that stage from hidden to visible overflow.
- Latest pose fix: matched the supplied settled-state screenshot with an asymmetric leftward fan: the left card is highest with a slight counterclockwise tilt, the center card is level, and the right card is lowest with a stronger counterclockwise tilt.
- Latest preview fix: moved only the right card 80rpx farther into the viewport so its subject and approximate content are visible while preserving the left-card spacing.
- Latest track fix: replaced direct circular-offset reassignment with a 520ms progress animation plus transition-free index normalization; changed the label/dot Y path from absolute-distance interpolation to the quadratic curve `distance² × 8rpx`, capped at 32rpx, so the center has a smooth tangent instead of a V-shaped corner.
- Latest dot fix: replaced the cropped dot images with user-requested CSS circles; inactive dots are 10rpx pale gold and the active dot transitions to 20rpx blue while remaining centered on the same moving category item.
- Latest gesture fix: stopped the coverflow deck's complete touch sequence from bubbling into the parent vertical swiper and prevented the deck's default touchmove behavior. The mini-program build confirms these handlers compile to `catchtouchstart`, `catchtouchmove`, `catchtouchend`, and `catchtouchcancel` on the deck.
- Post-fix visual evidence: pending.

## Implementation Checklist

1. Confirm the right card covers the center card and the center card covers the left card in the settled state.
2. Confirm the left-to-right Y order and inverse fan angles remain correct around the transition midpoint.
3. Confirm the center card alone remains at original scale while both adjacent cards are reduced.
4. Confirm each category dot travels with its label only after the card transition completes.
5. Confirm the far-left category exits offscreen while a separate copy enters from the far right, with no cross-track jump in either direction.
6. Confirm autoplay, left swipe, right swipe, category labels, and pagination remain synchronized.
7. Confirm horizontal card dragging no longer moves the outer vertical page swiper.

final result: blocked
