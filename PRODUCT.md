# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the owner, who uses these tools in their own daily work. Visitors are a welcome second audience: they get the same tools, and work that serves them is worth doing.

## Product Purpose

tools.rares.blog is a public collection of small, simple web tools. The repo is also a workbench for building and refining new ones quickly.

Success means four things:

- The owner keeps reaching for the tools in real work.
- Adding, refining, and shipping a new tool stays quick.
- Other people can use the tools and reuse them in their own work.
- The tools spread online, and the owner becomes known for them.

## Positioning

A working toolbox published as it is used. The owner's own work leads what gets built and kept, and the public gets the same tools rather than a separate product.

## Capabilities and Constraints

Tools run in the browser, and the site is served from Cloudflare.

**Rule: user data stays in the browser.** The server does no processing of user files or keys. A tool that needs an outside service calls it directly from the browser with the visitor's own key.

Terminology: "tool" is the public word. "Artifact" is the repo word for a folder under `src/artifacts/`.

## Brand Commitments

The public name is `tools.rares.blog`. The design is simple, minimal, square, and sharp, and `DESIGN.md` holds the rules. That doc is open to revision if it stops producing a clean, modern, cohesive result.

Terminal support is not a requirement. A future terminal app would be built separately and does not constrain the web components.

## Evidence on Hand

The repo holds no usage data, testimonials, or user counts. Do not claim adoption or popularity.

## Product Principles

- **Earn repeat use.** A tool is worth its place when the owner keeps reaching for it.
- **Owner first, visitors welcome.** The owner's daily work comes first. Making a tool easier for visitors to find and use is worthwhile work in its own right.
- **Keep the build loop short.** Changes to the shell and shared kit should make a new tool easier to add and refine, or at least no harder.
- **Keep it usable by outsiders.** A tool or prompt should make sense to someone who does not share the owner's private context.
- **Keep user data off the server.** New tools work within the browser-only rule rather than adding server processing.
