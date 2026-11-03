# Prompt Refinement Checklist

Use this checklist before adding a prompt to the curated library.

## Ready To Add

- The prompt is clear about who should do what.
- The prompt's value carries to other repos and kinds of work within its scope, not only the conversation, tool, or machine it came from.
- The usage context explains when to use the prompt and why it exists.
- The prompt gives enough context guidance without embedding stale specifics.
- The prompt does not name irrelevant concepts just to ban them.
- Negative constraints target likely mistakes for this task; omit bans that only name mistakes an agent would not realistically make.
- The prompt distinguishes context from conclusions.
- The prompt makes room for "no change needed" or "this needs a decision" when that can be the honest result.
- The prompt avoids forcing an output format that may not fit the task.
- The prompt avoids unnecessary process ceremony.
- The prompt does not present one shape or method as the best way unless that workflow or sequence is the reason the prompt exists.
- The prompt treats advice for one model as evidence, not a rule, and names a current model only for a task-specific reason.
- The prompt assumes a particular speaker or shared conversation only when the task needs it, and preserves decision and permission boundaries.
- The prompt optimizes for honest assessment rather than manufactured work.

## Before Committing

- Add at least one workflow tag, such as `review`, `implementation`, or `blog`.
- Reuse existing curated tags only when the tag description actually fits.
- Keep the copied `prompt` body literal and free of UI-only notes.
- Search for similar prompts and merge instead of duplicating when the workflow is the same.
