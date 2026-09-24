<!-- FOR AI AGENTS - Human readability is a side effect, not a goal -->
<!-- Managed by agent: keep sections and order; edit content, not structure -->
<!-- Last updated: 2026-09-23 | Last verified: 2026-09-23 -->

# AGENTS.md

**Precedence:** the closest `AGENTS.md` wins. This root file applies to the whole repo until a nearer file exists; explicit user instructions override this file.

## File Map

```text
.claude-plugin/            -> Claude Code plugin + marketplace manifests (plugin.json, marketplace.json)
skills/                    -> 14 repo-local Skills; each has SKILL.md (+ references/, assets/)
skills/init/assets/        -> 23 *.tmpl scaffolding templates emitted by /pw-kit:init
evals/                     -> eval case definitions (evals.json)
.github/workflows/         -> validate.yml plugin-structure CI; robin.yml PR reviewer caller
README.md / CHANGELOG.md   -> user-facing docs; keep in sync with skill behavior
.mcp.json, opencode.jsonc, .codex/, .cursor/, .vscode/ -> committed CodeGraph MCP wiring per client
.codegraph/                -> machine-local CodeGraph index (untracked, gitignored)
```

## Code intelligence: CodeGraph

- **Serena and Superpowers are retired in this repository.** Do not configure, install, or use them here. No operative Serena or Superpowers guidance exists; the `.serena/` ignore line is kept only so a stale local `.serena/` cannot be committed.
- **CodeGraph (`codegraph`) is the only approved code-intelligence index.** Project-local MCP configs are committed for Claude-compatible [`.mcp.json`](.mcp.json), Codex [`.codex/config.toml`](.codex/config.toml), OpenCode [`opencode.jsonc`](opencode.jsonc), Cursor [`.cursor/mcp.json`](.cursor/mcp.json), and VS Code [`.vscode/mcp.json`](.vscode/mcp.json). Each launches `codegraph serve --mcp`, sets `CODEGRAPH_TELEMETRY=0`, and passes `--path ${workspaceFolder}` where the client supports a workspace placeholder. Clients without a workspace placeholder (`.mcp.json`, `.codex/config.toml`, `opencode.jsonc`) rely on the MCP client's project root/`rootUri` instead, so start those clients from this checkout and confirm `codegraph status` reports this project — a CLI run from a parent directory targets that parent. `AGENTS.md` stays the only instruction source; do not let an installer create a competing instruction file, and do not add or edit home-directory configs from this repo.
- **Telemetry is off** via the committed `CODEGRAPH_TELEMETRY=0`. Keep it off.
- **The index stays untracked.** `.codegraph/` is gitignored and must never be committed. Build it once per checkout, then check it:

  ```bash
  CODEGRAPH_TELEMETRY=0 codegraph init .
  CODEGRAPH_TELEMETRY=0 codegraph status   # confirm "Index is up to date"
  ```

- **Use CodeGraph for the indexed code** (the two TypeScript references under `skills/*/references/`) before falling back to grep/read. **This repo is almost entirely Markdown and `*.tmpl` assets, which CodeGraph does not index** — for `SKILL.md`, `references/*.md`, `assets/*.tmpl`, README/CHANGELOG, and workflow YAML, use ordinary search and read. CodeGraph is navigation help, not a source of truth; verify any code finding against the actual file.
- **Canonical source:** `https://github.com/colbymchenry/codegraph`. The global `codegraph` binary is a user-managed, pre-existing install (ask-first to add or update); per-repo setup here is only the wiring plus the local index. Confirm `command -v codegraph` and `codegraph version` before relying on it.
- **Commands:** `codegraph status`, `codegraph query "<symbol>"`, `codegraph node <file-or-symbol>`, `codegraph explore "<area>"`, `codegraph files`.

## Golden Samples

| For | Reference | Key patterns |
|---|---|---|
| Skill frontmatter/body | `skills/locators/SKILL.md` | `paths:` auto-trigger globs, concise workflow body |
| Skill reference detail | `skills/pom/references/base-page-method-catalog.md` | deep guidance kept out of `SKILL.md` |
| Init asset template | `skills/init/assets/base-page.ts.tmpl` | placeholder tokens emitted into generated projects |
| Plugin manifest | `.claude-plugin/plugin.json` | skill/version description must match the skill set |

## Heuristics

| When | Do |
|---|---|
| Adding or removing a skill | Update the skill count/description in `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, and `CHANGELOG.md` |
| Editing a `SKILL.md` | Keep it under 500 lines; move detail to `references/`; keep `paths:`/frontmatter valid for `claude plugin validate` |
| Editing an init template | Change `skills/init/assets/*.tmpl` only; keep the required-template list in `.github/workflows/validate.yml` in sync |
| Touching references | Every `references/...` path mentioned in a `SKILL.md` must resolve, or CI fails |
| Claiming work complete | Run the local equivalent of `.github/workflows/validate.yml` (manifest JSON parse, every `skills/*/SKILL.md` present, all `references/` links resolve, all required init templates present) |

## Boundaries

### Always Do

- Start every session by inspecting Git status and worktrees, fetching origin with pruning, safely fast-forwarding local `main`, and verifying `main` matches `origin/main`. Only then create a task branch from synchronized `main` if needed. Preserve existing task branches and unfinished work. Never reset, discard changes, auto-stash, or force-push merely to synchronize. If safe synchronization is blocked, resolve the blocker before editing or branching.
- Run the smallest relevant check before claiming a change is done, and show the command output as evidence.
- Keep `.claude-plugin/*.json` valid JSON and the skill set described there accurate.

### Ask First

- Adding or removing a skill, or changing the plugin version/name.
- Adding runtime dependencies or network-dependent tooling (this repo has no package manager).
- Changing the plugin's user-facing configuration fields in `.claude-plugin/plugin.json`.

### Never Do

- Commit `.serena/` or `.codegraph/` — both are local/ignored state.
- Reintroduce Serena or Superpowers configuration or guidance.
- Add a competing root instruction file; `AGENTS.md` is the only canonical source.
- Commit secrets, credentials, or `reports/` audit output.

## Codebase State

- This directory is a Git repository with `main` tracking `origin/main`; remote is `antongulin/pw-kit` (local folder name differs from remote — same repo, not a duplicate).
- No package manager, build, or runtime is configured; there is no application test suite.
- CI is `.github/workflows/validate.yml` (plugin-manifest JSON parse, `SKILL.md` presence, `references/` link resolution, required init templates). Robin is installed on `main` via `.github/workflows/robin.yml`, which calls `antongulin/robin/.github/workflows/review.yml@main` on `pull_request` and `issue_comment` events using the `ROBIN_LLM_API_KEY`/`ROBIN_LLM_BASE_URL`/`ROBIN_LLM_MODEL` secrets; it skips fork PRs that lack those secrets.
- `reports/` is untracked user audit output; leave it local.

## Index of scoped AGENTS.md

<!-- AGENTS-GENERATED:START scope-index -->
<!-- No scoped AGENTS.md files yet. Root rules apply globally. -->
<!-- AGENTS-GENERATED:END scope-index -->
