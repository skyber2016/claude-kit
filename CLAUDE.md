# AG Kit for Claude Code

Use the packaged AG Kit components as follows:

1. Treat `rules/` as persistent engineering constraints. Copy them to your project's `.claude/rules/` directory.
2. Discover `skills/*/SKILL.md` progressively and load only relevant skills.
3. Use `commands/` for repeatable slash-command workflows. Copy them to your project's `.claude/commands/` directory.
4. Use `agents/` as specialist role definitions when working on domain-specific tasks.
5. Preserve user approval checkpoints in planning, deployment, destructive operations, and security-sensitive work.
6. The bundled MCP config is an example only. Never activate placeholder credentials.
7. The bundled `PreToolUse` hook blocks only clearly destructive root-disk operations and does not replace Claude Code's native permission controls.
8. Copy `settings.json` to your project's `.claude/settings.json` to enable hooks and MCP servers.
9. **OpenSpec SDD Integration:** Commands `/wf_brainstorm`, `/wf_plan`, `/wf_create`, `/wf_enhance` auto-detect `openspec/` directory. If present, they use Spec-Driven Development (structured artifacts, change tracking). If absent, they work in classic mode. Run `openspec init --tools claude` in your project to enable SDD.

Prefer the `/orchestrate` or `/coordinate` command for complex multi-domain work. Use at least three independent specialists only when their tasks can be separated cleanly, then synthesize and verify the result.
