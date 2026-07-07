import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as TOML from "smol-toml";

const CONFIG_PATH = process.env.HERDR_CONFIG_PATH ?? join(homedir(), ".config/herdr/config.toml");

// stable-channel defaults — herdr.dev/docs/configuration (channel confirmed via `herdr channel show`).
// Empty string = unset by default on stable.
export const DEFAULTS: Record<string, string> = {
  prefix: "ctrl+b",
  detach: "prefix+q",
  workspace_picker: "prefix+w",
  goto: "prefix+g",
  new_workspace: "prefix+shift+n",
  new_worktree: "prefix+shift+g",
  rename_workspace: "prefix+shift+w",
  close_workspace: "prefix+shift+d",
  navigate_workspace_up: "up",
  navigate_workspace_down: "down",
  new_tab: "prefix+c",
  previous_tab: "prefix+p",
  next_tab: "prefix+n",
  switch_tab: "prefix+1..9",
  rename_tab: "prefix+shift+t",
  close_tab: "prefix+shift+x",
  copy_mode: "prefix+[",
  focus_pane_left: "prefix+h",
  focus_pane_down: "prefix+j",
  focus_pane_up: "prefix+k",
  focus_pane_right: "prefix+l",
  navigate_pane_left: "h",
  navigate_pane_down: "j",
  navigate_pane_up: "k",
  navigate_pane_right: "l",
  swap_pane_left: "prefix+shift+h",
  swap_pane_down: "prefix+shift+j",
  swap_pane_up: "prefix+shift+k",
  swap_pane_right: "prefix+shift+l",
  cycle_pane_next: "prefix+tab",
  cycle_pane_previous: "prefix+shift+tab",
  split_vertical: "prefix+v",
  split_horizontal: "prefix+minus",
  close_pane: "prefix+x",
  zoom: "prefix+z",
  resize_mode: "prefix+r",
  toggle_sidebar: "prefix+b",
  remote_image_paste: "ctrl+v",
  previous_workspace: "",
  next_workspace: "",
  last_pane: "",
  open_worktree: "",
  remove_worktree: "",
  focus_agent: "",
};

export function loadEffectiveKeys(configPath: string = CONFIG_PATH): Record<string, string> {
  if (!existsSync(configPath)) return { ...DEFAULTS };
  const parsed = TOML.parse(readFileSync(configPath, "utf8")) as { keys?: Record<string, unknown> };
  const merged = { ...DEFAULTS };
  for (const [k, v] of Object.entries(parsed.keys ?? {})) {
    if (typeof v === "string") merged[k] = v;
    // preview-channel arrays (multi-binding): show the first entry only.
    else if (Array.isArray(v) && typeof v[0] === "string") merged[k] = v[0];
  }
  return merged;
}
