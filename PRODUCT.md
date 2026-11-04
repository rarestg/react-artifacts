# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the owner, who uses these tools in their own daily work. Visitors are a welcome second audience: they get the same tools, and work that serves them is worth doing.

Other people use the site as a shared resource: they run the tools and copy the prompts into their own work.

## Product Purpose

tools.rares.blog is a public collection of small web tools, built and refined in this repo. The home page also links to tools that live on other sites.

Success means four things:

- The owner keeps reaching for the tools in real work.
- Adding, refining, and shipping a new artifact stays quick.
- Other people can use the tools and copy the prompts for their own work.
- The tools spread online, and the owner becomes known for them.

## Positioning

A working toolbox published as it is used. The owner's own work leads what gets built and kept, and the public gets the same tools rather than a separate product.

## Operating Context

- People open a tool from the sidebar (`/?artifact=<id>`) or full-page without the shell (`/artifact/<id>`).
- The owner adds a tool by dropping a folder into `src/artifacts/`, registering it in `src/artifactManifest.ts`, and refining it in the viewer. The viewer has theme and device preview controls. `npm run check` is the pre-PR gate, and `npm run deploy` ships to the Cloudflare Worker.
- Prompt Library entries get searched, copied, and run in agent work, by a person or by another agent.

## Capabilities and Constraints

**Rule: user data stays in the browser.** The server does no processing of user files or keys. The Worker only serves pages, SEO metadata, the sitemap, `robots.txt`, and a fixed status reply under `/api/`. A tool that needs an outside service calls it directly from the browser with the visitor's own key, so only that service receives the data it needs. PDF OCR does this with Gemini.

Current tools, indexed for search:

- Prompt Library: search and copy reusable prompts for agent workflow tasks.
- Message Unescaper: convert escaped messages and clean dash-based sentence breaks.
- JSONL Structure Viewer: inspect JSONL paths, filter structure, and copy trimmed output.
- Palette Lab: generate OKLCH palettes and export selected CSS color tokens.
- PDF OCR: split a PDF and OCR every page in parallel with Gemini.
- Sharp UI System: showcase shared components and dense artifact UI states.

`example` and `example-app` are copy-targets for new artifacts and stay out of search (`noindex`).

Tools on other sites, linked from the home page. They are not artifacts and are not in this site's sitemap. The browser-only rule above covers this repo's Worker, not these sites.

- BYOBanana (byobanana.com): generate and compare Nano Banana images with your own Google key.
- mdprint (mdprint.net): local-first Markdown workspace for clean, print-ready PDFs.
- Lease PDF (leasepdf.com): make a print-ready sublease PDF from a short form, nothing uploaded.
- PDF → Split → Markdown (pdfsplitparse.com): the app behind PDF OCR: PDF to Markdown with your own Gemini key.

Current behavior, not a rule; future work may change these:

- The sidebar shows the AI model and version that built each tool.
- Tools are small and single-purpose.
- The site has no accounts and no analytics.

Terminology: "tool" is the public word. "Artifact" is the repo word for a folder under `src/artifacts/`. "Viewer" or "shell" means the sidebar app in `src/App.tsx`. "Standalone view" means a tool at `/artifact/<id>` without the shell.

## Brand Commitments

The public name is `tools.rares.blog`, served from that domain. Icons are in `public/` (`favicon.ico`, `icon-light.png`, `icon-dark.png`).

This repo has a deliberate square, sharp design language, documented in `DESIGN.md`. That doc serves the goal of a clean, modern, cohesive design, and it is open to revision if it is overcomplicated or does not lead there.

**Terminal portability is not a requirement.** Components were first meant to work in both a GUI and a TUI (a text interface that runs in a terminal), which is why the owner avoided opacity and CSS a terminal could not render. The owner has dropped that plan. A future TUI would be built bespoke and does not constrain the web components, so the sharp look now stands on its own merits.

## Evidence on Hand

The real evidence is the working tools above and the prompts in `src/artifacts/prompt-library/prompts.ts`.

The repo holds no usage data, testimonials, or user counts. Do not claim adoption or popularity.

## Product Principles

- **Earn repeat use.** A tool is worth its place when the owner keeps reaching for it.
- **Owner first, visitors welcome.** The owner's daily work comes first. Making a tool easier for visitors to find and use is worthwhile work in its own right.
- **Keep the artifact loop short.** Changes to the shell and shared kit should make a new tool easier to add and refine, or at least no harder.
- **Keep it usable by outsiders.** A tool or prompt should make sense to someone who does not share the owner's private context, and prompts should bring value to any repo or area of work.
- **Keep user data off the server.** New tools work within the browser-only rule rather than adding server processing.
