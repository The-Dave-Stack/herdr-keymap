# Changelog

All notable changes to this plugin are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning is
[SemVer](https://semver.org/).

## [0.5.0] - 2026-07-17

### Added
- Banner header (plugin name + version, read from `herdr-plugin.toml` at
  runtime) shown atop the navigation screens — category list, command list,
  and the workspace/tab/agent pickers — so it stays visible while navigating.

## [0.4.0] - 2026-07-17

### Changed
- Unified cancellation: any way you back out of an action (a `❮ Back` choice,
  an empty rename, declining a close confirmation, or `Esc`/`Ctrl+C` inside a
  prompt) now returns to the action list without running anything — no more
  forced `Ctrl+C` that dropped the whole palette. The palette only closes via
  `❯ Exit` / `Esc` at the category screen, or after a command runs.
- `switch_tab` is now a tab picker (with `❮ Back`) instead of a
  type-the-number prompt.

## [0.3.1] - 2026-07-17

### Added
- `❮ Back` choice in the agent and workspace pickers — cancel a selection and
  return to the action list without Ctrl+C.

### Changed
- Agent picker labels each agent with its workspace (was the raw cwd), so the
  full-session list (a herdr session spans all its workspaces) is legible.

## [0.3.0] - 2026-07-17

### Added
- Special `agent` category exposing herdr `agent` subcommands (Focus agent,
  Rename agent) with an agent picker. These are commands, not keybindings, so
  they render as `(cmd)` and carry no key. Powered by `herdr agent
  list/focus/rename` (target = `terminal_id`).

## [0.2.1] - 2026-07-17

### Changed
- Selecting an action with no CLI equivalent now names the key to press
  (and says to close the palette first, since it grabs all terminal input)
  instead of just saying "use the keyboard shortcut". Actions with no key
  bound say so and point at `config.toml`.

## [0.2.0] - 2026-07-16

### Fixed
- Pane-scoped actions (`split`, `focus`, `zoom`, `close_pane`) targeted the
  palette overlay instead of the pane the user came from. Splitting the
  overlay also made herdr ignore `--direction`, so a horizontal split came
  out vertical. These now resolve the originating pane from
  `HERDR_PLUGIN_CONTEXT_JSON.focused_pane_id`.

### Added
- Focus follows the newly created pane on split, and the new workspace, tab,
  and worktree on create (`--focus`).

### Changed
- New tab / workspace inherit the current pane's working directory
  (`focused_pane_cwd`) instead of the palette overlay's cwd (the plugin dir).

## [0.1.0] - 2026-07-08

### Added
- Initial release: overlay palette listing herdr keybindings by category and
  running the ones with a CLI equivalent. Published to
  [The-Dave-Stack/herdr-keymap](https://github.com/The-Dave-Stack/herdr-keymap).
