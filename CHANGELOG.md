# Changelog

All notable changes to this plugin are documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/); versioning is
[SemVer](https://semver.org/).

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
