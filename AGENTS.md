<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- seoagent:skill -->

## SEOAgent

This repo uses SEOAgent — a persistent AI SEO agent. Its state lives in `.seoagent/`.

- At session start, read `.claude/skills/seoagent/SKILL.md` — the working contract for all SEO tasks.
- Each session: run `seoagent sync`, then triage `.seoagent/inbox/` for pending actions.
- Run `seoagent ack <id>` after completing each inbox action.
