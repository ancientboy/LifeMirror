# Life Mirror Institute — Design QA

- Source visual truth: `/workspace/scratch/95b55963f83c/upload/image(3).png`
- Implementation: `http://terminal.local:4173/`
- Browser-rendered evidence: Cloud browser tab `3`, current viewport capture from the homepage
- Viewport: implementation `1363 × 936` CSS px at DPR `1`; source `1536 × 1024` px
- Density normalization: both artifacts are 1×. The source was evaluated proportionally against the narrower implementation viewport; the fixed sidebar remained approximately 280 px in both.
- State: desktop, dark theme, Manifesto selected, top of page

## Full-view comparison evidence

The reference and browser-rendered implementation were emitted together in one comparison input. Both show the same dominant composition: fixed 280 px research sidebar, upper-right metadata row, left-aligned three-line Chinese manifesto, gold emphasis on “一面真正理解自己”, right-biased orbital galaxy, and five equal research gateway cards across the lower hero.

## Focused region evidence

No additional crop was required because the reference and implementation were both legible at the captured sizes. The following high-detail surfaces were checked directly in the paired full-view comparison:

- Brand/seal and active Manifesto navigation treatment
- Chinese headline wrapping, gold emphasis and introductory copy rhythm
- Metadata separators, date/version/research label and search control
- Five gateway cards, numbering, headings, copy, imagery, borders and alignment
- Galaxy focal point, orbital geometry and planet crop

## Required fidelity surfaces

- Fonts and typography: serif display hierarchy and small publication metadata match the source. System Song/Georgia fallbacks are used, so exact glyph contours vary slightly by OS; this is an acceptable P3 difference.
- Spacing and layout rhythm: sidebar, hero copy, five-card rail and top metadata preserve the source proportions at the available viewport. No persistent control is clipped.
- Colors and visual tokens: midnight navy, warm ivory, muted cool gray and restrained gold match the reference balance.
- Image quality and asset fidelity: all six visible custom visuals are real raster assets generated for their measured slots. No placeholder, CSS illustration or sprite-sheet crop is used.
- Copy and content: the reference headline, introduction, navigation taxonomy and five research gateway labels are preserved. Existing Manifesto and Chapter 1 text remains below the hero.

## Interaction and console verification

- WHY gateway navigated to `#chapter-1` and selected the matching sidebar paper.
- Light/glow control toggled the `reduced-glow` state and toggled back.
- Brand link navigated to `#top`.
- No application console errors were found. Logged errors were emitted by the cloud-browser extension itself rather than the page.

## Comparison history

### Initial implementation

- P1: Earlier production screen used a green abstract orb and oversized English institute title instead of the selected cosmic manifesto composition.
- P1: Earlier gateway presentation was a separate research-map section rather than the five-card rail visible in the selected first screen.
- P2: Earlier sidebar labels and active-paper treatment did not match the LM paper hierarchy in the source.

### Fixes and post-fix evidence

- Replaced the hero with a right-biased Milky Way, gold orbital core and planetary horizon asset.
- Restored the three-line Chinese manifesto as the visual anchor.
- Rebuilt the fixed research sidebar and the five gateway cards with five dedicated assets.
- Paired source and post-fix browser capture show no actionable P0/P1/P2 mismatch.

## Follow-up polish

- P3: The source seal is more intricate than the closest Phosphor icon used in code.
- P3: Exact Chinese serif glyph shapes depend on the viewer's installed system fonts.
- Responsive behavior is implemented, but no mobile source visual was supplied for fidelity comparison.

final result: passed
