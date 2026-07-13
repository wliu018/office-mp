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
