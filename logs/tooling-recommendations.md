# Tooling Recommendations

What could make the work ahead faster or more reliable, and what's already
available. Written 2026-08-02 based on what's actually missing per
`project-status.md` — auth, an admin dashboard, payments, real database
provisioning, and deployment are the next real chunks of work.

## How to "plug in" tools — MCP servers

Claude Code connects to external tools via **MCP (Model Context Protocol)
servers**. Each one exposes a set of tools I can call directly, the same way
I call Bash or Read. You add them via `/mcp` in the CLI, or by editing the
project's MCP config. Once added, I don't need to ask you to run commands on
my behalf for that service — I can act on it directly (within whatever
permission mode is active).

I already have a couple connected in this environment:
- **Figma** — for pulling design specs/screenshots directly from Figma files, generating diagrams, or pushing code-to-design. Relevant if more Stitch/Relume-style mockups need translating, or if the business owner starts using Figma directly.
- **Gmail / Google Calendar** — connected but not yet used in this project. Would matter if appointment-booking ever needs real calendar sync, or if order confirmations should send real email (currently no email sending exists anywhere).

## Recommended for the work ahead

**Supabase MCP server** — highest-value addition right now. This project's
database is Supabase but I currently have no direct access to it — every
database interaction so far has gone through either local `prisma dev` (a
throwaway local instance) or by editing `.env`/running Prisma CLI commands
blind, with real credentials never provided to me. A Supabase MCP server
would let me:
- Run real migrations against the actual project once you provide access
- Inspect table state / debug data issues directly
- Manage auth users once real Admin auth is built (Supabase has built-in
  auth — worth considering instead of hand-rolling password hashing +
  sessions, given AGENTS.md just says "real email-and-password
  authentication with a hashed password and session cookie," not
  specifically custom-built)

Note: connecting me to your real Supabase project is a bigger trust step
than everything I've done so far (which never touched real credentials).
Your call whether/when that's worth it — I'd suggest doing it once Admin
auth is imminent, not before, since there's little I can usefully do with
live DB access until then beyond what local `prisma dev` already covers.

**Deployment MCP (Vercel or Railway, whichever you pick)** — there's
currently no deployment config anywhere in this repo. Once you decide on a
host, an MCP for it would let me set up the actual deploy pipeline instead
of just writing config files for you to apply manually.

**Playwright** — not an MCP server exactly, but worth calling out: AGENTS.md
names Playwright as the intended e2e test tool, and none of the manual
browser verification I've been doing (the iframe-injection technique in
`debug-log.md`) is captured as an actual automated test suite. Once the
transactional flow (orders, appointments) exists, real Playwright tests
would catch regressions that ad-hoc manual verification can't.

**GitHub** — if you want PR/issue-based workflow instead of working directly
in this session, `gh` CLI is already available to me via Bash (used it for
one PR-adjacent check earlier in this project's history via other
sessions). A dedicated GitHub MCP would add structured issue/PR management,
but isn't necessary unless you want that workflow specifically.

## Not recommended yet

**Paystack integration tooling** — no payment work has started (confirmed
missing in `project-status.md`), and AGENTS.md requires the business
purpose, authorization model, and acceptance criteria to be documented and
approved *before* evaluating payment integrations at all. Premature to set
up tooling for this before that documentation exists.

**Linear/Jira-style issue tracking** — the `/logs` files set up today plus
my own `TaskCreate`/task-list tool already cover project tracking for a
single-collaborator workflow. Would only be worth adding if more people
start working on this repo and need shared visibility outside these
sessions.
