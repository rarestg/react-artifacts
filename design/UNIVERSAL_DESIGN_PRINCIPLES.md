# Universal Design Principles

Paste the principles below at the top of any UI/UX brainstorm — *before* the aesthetic is
chosen. They are aesthetic-agnostic: true whether the look ends up flat or maximal, editorial
or brutalist. They set a quality floor; they never tell you which look to pick. (For this
studio's specific house aesthetic, read `SHARP_MINIMAL_DESIGN.md` and `ARTIFACT_DESIGN_GUIDE.md`
— those are *one* set of choices on top of this floor.)

The trace map appendix is for auditing only; it is not part of the paste.

---

Good design is a stack of decisions you could defend out loud: every element earns its place by
serving the subject, the hierarchy, or the action, and the result reads as intended rather than
accidental. This holds before any look is chosen — flat or maximal, editorial or brutalist, the
mechanics below are what separate a considered interface from a generic one.

**1. Start from the work.** Put the primary task or thesis on screen first, and keep every
control beside the thing it affects.
*A handsome surface that buries the main job is wrong before style is even discussed; add
nothing that doesn't improve scanning, comparison, action, or confidence.*

**2. Make every choice answer to the subject.** Trace each color, type, image, and structural device —
numbering, dividers, labels — to the subject, its audience, and the page's job, so each encodes
something true instead of filling space.
*A treatment that would fit an unrelated product unchanged is a default, not a decision, and
reads as generic; number a sequence only when its order is information the reader needs.*

**3. Concentrate emphasis, and let every difference be deliberate.** Emphasis exists only against
what surrounds it: rank what matters, make the steps between levels decisive, and make things that
are alike look alike — so a difference signals a real one, not accidental style or token drift.
*When everything competes, nothing leads and the eye finds no entry point; when peer controls drift
apart in height, weight, or spacing, they imply a hierarchy that isn't there. Even a maximal
composition needs a focal order, and secondary elements should recede without becoming illegible.*

**4. Align what shares a line, and keep comparable peers consistent.** Edges on the same
structural line should line up, and items meant to be compared should share one anatomy and one
separation logic.
*Near-miss alignments read as accidental and jog the layout — a maximal grid jogs too — and peers
that each invent their own structure stop comparing; every broken line or odd-one-out should mark
a real difference.*

**5. Design every state, completely and honestly.** Give default, hover, focus, selected,
disabled, loading, empty, and error each a distinct, visible treatment where it applies, and drive
the counts, highlights, and enablement that depend on a state from one condition.
*Focus is not selection and selection is not hover; keyboard focus must always show; color is
never the only cue, so every state still reads in grayscale — when the signals disagree the
interface lies, like a "0" beside an enabled button.*

**6. Hold the structure steady through change.** Reserve room for shifting labels and counts,
anchor the controls that govern others, and keep the layout intact as content updates — including long labels and values — the
viewport resizes, and the theme switches.
*Elements that jog as state changes get mis-clicked, and a view that collapses by hiding its
governing control stops explaining itself. A responsive view is not a shrunken copy, a dark theme
is not a recolor, and motion moves only with cause — and honors reduced-motion.*

**7. Choose the interaction model before the visual shape.** Decide what a thing *is* — a command,
preference, selection, disclosure, status, or navigation — before deciding how it looks.
*The wrong model makes false promises: a toggle that fires a one-shot action, a disclosure that
hides real controls, a button nested inside a button. Styling can't repair a broken contract, only
hide it.*

**8. Make copy the next move.** Treat words as interface: name things by what the user controls,
keep one vocabulary across a whole flow, and write empty and error states as directions.
*"Publish" should yield "Published," not "Success"; an empty state should say what to do next and
an error what failed and how to recover; vague, clever, or mood-only copy leaves the user with no
move.*

**9. Build the chosen direction fully.** Execute whatever ambition you pick to the level it
demands — an elaborate direction needs elaborate, exact follow-through; a spare one needs precise
spacing, type, and detail.
*A bold gesture that appears once and changes nothing about hierarchy, content, or action reads as
pasted on; a restrained direction without exact spacing, type, and state detail reads unfinished.*

None of this picks a look — it is the floor every look stands on: grounded, focused, honest, and
stable. Good UI is not a costume; it is consistent judgment made visible under use.

---

## Appendix — Trace map (for auditing; not part of the paste)

Every principle is distilled from the source corpus; nothing is invented. Keys:
**SMD** `SHARP_MINIMAL_DESIGN.md` · **ADG** `ARTIFACT_DESIGN_GUIDE.md` ·
**UIN** `UI_IMPLEMENTATION_NOTES.md` · **FUI** `.tmp/frontend-unique-ideas.txt` ·
**F2** `.tmp/frontend2.txt` · **MIN** `.tmp/minimalist.txt`

| # | Traces to |
|---|-----------|
| Thesis | SMD "every line/surface/state should explain structure, priority, or action" + FUI "ground it in the subject" |
| 1 | ADG "Design From The Work" (task not component inventory; working surface on screen immediately; controls close to what they affect; "remove anything that doesn't improve scanning/comparison/action/confidence") + "primary task usable on first screen"; FUI "the page's single job"; F2 "What problem does this solve? Who uses it?" |
| 2 | FUI "Ground it in the subject" + "Structure is information… encode something true, not decorate" + numbered-markers-only-if-real-sequence; F2 "context-specific character" / "Converging on common choices" (anti-pattern); MIN no generic placeholders; SMD "icons as utility marks" / "semantic color only for real meaning" |
| 3 | SMD "fewer, stronger decisions" / "accents sparingly" / "important obvious without being loud" / "secondary subdued, not illegible" / hierarchy via "size, weight, spacing, contrast, position"; FUI "spend your boldness in one place"; F2 "dominant colors with sharp accents outperform timid, evenly-distributed" / "Intentionality > intensity"; MIN "color is a scarce resource". **No-drift clause:** SMD "controls grouped together should share a common shell… not accidental geometry or token drift"; ADG "actions in the same toolbar should share one local action class" |
| 4 | SMD "align edges aggressively" / "create visual throughlines" / "avoid accidental visual jogs" / "preserve comparison by keeping repeated items structurally consistent" / "don't make every repeated item a floating object"; ADG "repeated items preserve comparison" / "keep row anatomy consistent" / "one separator strategy at a time"; UIN-001 (single-source separators; double seams). Calibration exemplar. |
| 5 | ADG State Model (full state list; "focus is not selection. selection is not hover"; "counts/highlights/enabled/actions from the same eligibility predicate"); SMD "focus must always be visible" / "never communicate state through color alone"; ADG "pair color with text/icon/position"; UIN-006/007. "0 beside enabled button" ← UIN-006 verbatim |
| 6 | SMD "avoid layout shift when labels/counters/status change" / "light and dark in same visual language" / motion "restrained… reduced-motion"; ADG "controls do not jump" / "transient status has a stable home" / "keep governing controls anchored" / Responsive-Behavior / "light & dark preserve spacing, geometry, state behavior" / "layout stability matters more than animation"; UIN-002/003/007; FUI "responsive down to mobile, reduced motion respected" |
| 7 | ADG "choose controls by meaning" (button/checkbox/toggle/segmented/menu/status-tag); UIN-006 "choose the control primitive by semantics"; UIN-008 "buttons inside buttons are invalid… stopPropagation patches hide the structural problem"; ADG "disabled controls must show why" |
| 8 | FUI "More on writing" (words are design material; name by what people control; action keeps one name through the flow — Publish→Published; empty screen is an invitation to act; errors never vague); SMD/ADG empty+error rules ("say what failed and how to recover"); MIN "plain, specific language," no clichés |
| 9 | FUI "match complexity to the vision… elegance is executing the chosen vision well" / "cut decoration that doesn't serve the brief" / "let each element do one job"; F2 "match implementation complexity to aesthetic vision" |
| Summary | synthesis; SMD "not plainness… disciplined legibility," generalized to all looks |

### Excluded as HOUSE taste (one aesthetic's choice, not universal)
Cut symmetrically from both schools so the floor leans toward neither:
- **"Quiet by default"** (SMD) → kept *focus*, dropped *quiet*. Symmetric cut: **signature-element
  mandate** (FUI "the one thing it's remembered by" / "take one aesthetic risk") → kept only
  "concentrate emphasis."
- **Form/surface:** square geometry / radius-0, opaque surfaces, ban glass/blur/glow/shadows/
  gradients/floating-cards, no-boxes-in-boxes (SMD/ADG) — *directly contradicted by* MIN (diffuse
  shadows, navbar blur, radial light, grain) and F2 (dramatic shadows, gradient meshes, custom
  cursors). All surface-texture rules excluded.
- **Density/color taste:** "avoid oversized type" / "compact scales" / "strong neutrals, accents
  sparingly" vs MIN big editorial display + F2 dominant color — opposing house tastes, both out.
- **Named specifics (both directions):** font bans/picks, hex palettes, radii, shadow-opacity,
  bento grids, `<kbd>` chrome, faux-OS window, `py-24/32`, `max-w-4xl`, easing/IntersectionObserver
  — named/mechanism.
- **Stack/impl:** tokens, ArtifactThemeRoot, color-mix, mergeClassNames, tabular-nums,
  monospace-for-code, separator mechanics — mechanism (their *effects* — comparison, alignment,
  stability — are kept).
- **Security/domain:** markdown sanitization, never-render-untrusted-HTML, preserve-raw-source —
  out of scope for a look-agnostic aesthetic floor.

### Borderline calls (surfaced, not hidden)
- **Standalone color principle** — the corpus is color-heavy but most is house (neutrals-first,
  accents-sparingly). The surviving universals — *signal color keeps one meaning; never color
  alone; pair with text/icon/shape* — are folded into #2 + #5 rather than given their own line. A
  candidate 10th, if wanted: *"Keep color meanings coherent — a color that signals must mean one
  thing; decorative color is fine, but a signal reused to decorate stops being trusted."*
- **Light/dark "same visual language"** — kept inside #6, but it presumes a dark mode exists;
  robust core = "stay consistent across whatever modes you support."
- **#9 match-execution** — thinnest trace (near-verbatim in FUI/F2; SMD only the minimal pole);
  kept because it is a genuine point of agreement between the two schools.

---

*Provenance: distilled from the corpus above by three independent passes (failure-mode,
first-principles, and scan-legibility lenses), reconciled, change-reviewed, and stress-tested
against an independent fourth synthesis. The principles are the floor; house docs layer a specific
aesthetic on top.*
