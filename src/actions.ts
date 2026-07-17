import { Separator, confirm, input, select } from "@inquirer/prompts";
import { NAV_THEME, currentPane, currentWorkspaceId, headed, herdr, originCwd, originPaneId } from "./herdr-cli.ts";

// display order only — doesn't affect execution, just groups the palette.
export const CATEGORY_ORDER = ["workspace", "tab", "worktree", "pane", "agent", "general"];

// Thrown by a picker's "❮ Back" choice (or a cancel) to abort the action and
// return to the action list — caught in keymap.ts. Avoids forcing Ctrl+C.
export class PaletteBack extends Error {}
const BACK = "__back__";

async function newWorkspace() {
  const label = (await input({ message: "Label (empty to skip, Esc to cancel):" })).trim();
  const args = ["workspace", "create", "--focus"];
  const cwd = originCwd();
  if (cwd) args.push("--cwd", cwd);
  if (label) args.push("--label", label);
  herdr(...args);
}

async function renameWorkspace() {
  const label = (await input({ message: "New name (empty to cancel):" })).trim();
  if (!label) throw new PaletteBack();
  herdr("workspace", "rename", currentWorkspaceId(), label);
}

async function closeWorkspace() {
  if (!(await confirm({ message: "Close the current workspace?", default: false }))) {
    throw new PaletteBack();
  }
  herdr("workspace", "close", currentWorkspaceId());
}

// number+focused are real fields on workspace/tab list entries (confirmed
// live against a running session, not guessed from docs) — enough to
// replicate the sidebar's up/down navigation and the workspace picker.
async function navigateWorkspace(direction: 1 | -1) {
  const { workspaces } = herdr("workspace", "list");
  const sorted = [...workspaces].sort((a: any, b: any) => a.number - b.number);
  const idx = sorted.findIndex((w: any) => w.focused);
  if (idx === -1) throw new Error("no focused workspace found");
  const next = sorted[(idx + direction + sorted.length) % sorted.length];
  herdr("workspace", "focus", next.workspace_id);
}

async function workspacePicker() {
  const { workspaces } = herdr("workspace", "list");
  const sorted = [...workspaces].sort((a: any, b: any) => a.number - b.number);
  const id = await select({
    message: headed("Go to workspace"),
    theme: NAV_THEME,
    choices: [
      { name: "❮ Back", value: BACK },
      new Separator(),
      ...sorted.map((w: any) => ({
        name: `${w.number}. ${w.label ?? w.workspace_id}${w.focused ? "  (current)" : ""}`,
        value: w.workspace_id,
      })),
    ],
  });
  if (id === BACK) throw new PaletteBack();
  herdr("workspace", "focus", id);
}

async function navigateTab(direction: 1 | -1) {
  const wsId = currentWorkspaceId();
  const { tabs } = herdr("tab", "list", "--workspace", wsId);
  const sorted = [...tabs].sort((a: any, b: any) => a.number - b.number);
  const idx = sorted.findIndex((t: any) => t.focused);
  if (idx === -1) throw new Error("no focused tab found");
  const next = sorted[(idx + direction + sorted.length) % sorted.length];
  herdr("tab", "focus", next.tab_id);
}

async function switchTab() {
  const wsId = currentWorkspaceId();
  const { tabs } = herdr("tab", "list", "--workspace", wsId);
  const sorted = [...tabs].sort((a: any, b: any) => a.number - b.number);
  const id = await select({
    message: headed("Go to tab"),
    theme: NAV_THEME,
    choices: [
      { name: "❮ Back", value: BACK },
      new Separator(),
      ...sorted.map((t: any) => ({
        name: `${t.number}. ${t.label ?? t.tab_id}${t.focused ? "  (current)" : ""}`,
        value: t.tab_id,
      })),
    ],
  });
  if (id === BACK) throw new PaletteBack();
  herdr("tab", "focus", id);
}

async function newWorktree() {
  const branch = (await input({ message: "Branch (empty to skip, Esc to cancel):" })).trim();
  const args = ["worktree", "create", "--workspace", currentWorkspaceId(), "--focus"];
  if (branch) args.push("--branch", branch);
  herdr(...args);
}

async function newTab() {
  const label = (await input({ message: "Label (empty to skip, Esc to cancel):" })).trim();
  const args = ["tab", "create", "--workspace", currentWorkspaceId(), "--focus"];
  const cwd = originCwd();
  if (cwd) args.push("--cwd", cwd);
  if (label) args.push("--label", label);
  herdr(...args);
}

async function renameTab() {
  const label = (await input({ message: "New tab name (empty to cancel):" })).trim();
  if (!label) throw new PaletteBack();
  herdr("tab", "rename", currentPane().tab_id, label);
}

async function closeTab() {
  if (!(await confirm({ message: "Close the current tab?", default: false }))) {
    throw new PaletteBack();
  }
  herdr("tab", "close", currentPane().tab_id);
}

function focusPane(direction: string) {
  return async () => herdr("pane", "focus", "--pane", originPaneId(), "--direction", direction);
}

// ponytail: --focus lands focus on the new pane; herdr restores the pre-overlay
// focus when the palette closes, so if focus snaps back to the origin pane,
// this flag is the thing to revisit (may be an unavoidable herdr behavior).
function splitPane(direction: string) {
  return async () => herdr("pane", "split", "--pane", originPaneId(), "--direction", direction, "--focus");
}

async function closePane() {
  if (!(await confirm({ message: "Close the current pane?", default: false }))) {
    throw new PaletteBack();
  }
  herdr("pane", "close", originPaneId());
}

async function zoomPane() {
  herdr("pane", "zoom", "--pane", originPaneId(), "--toggle");
}

// --- agent commands: herdr `agent` subcommands, NOT keybindings, so they
// live in their own "agent" category and carry no key (noKey below).
// Lists every agent in the CURRENT herdr session (a session spans all its
// workspaces, not just the active one), labelled with its workspace so a long
// list stays legible. Throws PaletteBack on "❮ Back" or when there are none.
async function pickAgent(message: string): Promise<string> {
  const { agents } = herdr("agent", "list");
  if (!agents.length) {
    console.log("no agents in this session");
    throw new PaletteBack();
  }
  const { workspaces } = herdr("workspace", "list");
  const wsLabel = new Map(workspaces.map((w: any) => [w.workspace_id, w.label ?? w.workspace_id]));
  const value = await select({
    message: headed(message),
    theme: NAV_THEME,
    choices: [
      { name: "❮ Back", value: BACK },
      new Separator(),
      // terminal_id is the unambiguous target (names can collide / be unset).
      ...agents.map((a: any) => ({
        name: `${a.terminal_title_stripped ?? a.agent}  [${a.agent_status}]  ${wsLabel.get(a.workspace_id) ?? a.workspace_id}${a.focused ? "  (focused)" : ""}`,
        value: a.terminal_id,
      })),
    ],
  });
  if (value === BACK) throw new PaletteBack();
  return value;
}

async function focusAgent() {
  herdr("agent", "focus", await pickAgent("Focus agent"));
}

async function renameAgent() {
  const target = await pickAgent("Rename which agent");
  const name = (await input({ message: "New agent name (empty to cancel):" })).trim();
  if (!name) throw new PaletteBack();
  herdr("agent", "rename", target, name);
}

// executor undefined = no documented CLI equivalent; noCli explains why.
// noKey = a herdr command with no keybinding (agent category), not a keymap.
export interface ActionEntry {
  category: string;
  description: string;
  executor?: () => Promise<void>;
  noCli?: string;
  noKey?: boolean;
}

export const ACTIONS: Record<string, ActionEntry> = {
  new_workspace: { category: "workspace", description: "New workspace", executor: newWorkspace },
  rename_workspace: { category: "workspace", description: "Rename current workspace", executor: renameWorkspace },
  close_workspace: { category: "workspace", description: "Close current workspace", executor: closeWorkspace },
  workspace_picker: { category: "workspace", description: "Workspace picker", executor: workspacePicker },
  goto: { category: "workspace", description: "Go to (goto)", noCli: "scope not precisely documented, not reproduced" },
  navigate_workspace_up: { category: "workspace", description: "Navigate workspace up", executor: () => navigateWorkspace(-1) },
  navigate_workspace_down: { category: "workspace", description: "Navigate workspace down", executor: () => navigateWorkspace(1) },
  new_worktree: { category: "worktree", description: "New worktree", executor: newWorktree },
  new_tab: { category: "tab", description: "New tab", executor: newTab },
  rename_tab: { category: "tab", description: "Rename current tab", executor: renameTab },
  close_tab: { category: "tab", description: "Close current tab", executor: closeTab },
  previous_tab: { category: "tab", description: "Previous tab", executor: () => navigateTab(-1) },
  next_tab: { category: "tab", description: "Next tab", executor: () => navigateTab(1) },
  switch_tab: { category: "tab", description: "Go to tab 1-9", executor: switchTab },
  focus_pane_left: { category: "pane", description: "Focus pane left", executor: focusPane("left") },
  focus_pane_down: { category: "pane", description: "Focus pane down", executor: focusPane("down") },
  focus_pane_up: { category: "pane", description: "Focus pane up", executor: focusPane("up") },
  focus_pane_right: { category: "pane", description: "Focus pane right", executor: focusPane("right") },
  split_vertical: { category: "pane", description: "Split vertical (left/right)", executor: splitPane("right") },
  split_horizontal: { category: "pane", description: "Split horizontal (top/bottom)", executor: splitPane("down") },
  close_pane: { category: "pane", description: "Close current pane", executor: closePane },
  zoom: { category: "pane", description: "Zoom current pane", executor: zoomPane },
  agent_focus: { category: "agent", description: "Focus agent", executor: focusAgent, noKey: true },
  agent_rename: { category: "agent", description: "Rename agent", executor: renameAgent, noKey: true },
  resize_mode: { category: "pane", description: "Resize mode", noCli: "interactive mode, no CLI" },
  swap_pane_left: { category: "pane", description: "Swap pane left", noCli: "no CLI equivalent" },
  swap_pane_down: { category: "pane", description: "Swap pane down", noCli: "no CLI equivalent" },
  swap_pane_up: { category: "pane", description: "Swap pane up", noCli: "no CLI equivalent" },
  swap_pane_right: { category: "pane", description: "Swap pane right", noCli: "no CLI equivalent" },
  cycle_pane_next: { category: "pane", description: "Cycle pane next", noCli: "no CLI equivalent" },
  cycle_pane_previous: { category: "pane", description: "Cycle pane previous", noCli: "no CLI equivalent" },
  navigate_pane_left: { category: "pane", description: "Navigate pane (contextual mode)", noCli: "contextual key, not a standalone binding" },
  navigate_pane_down: { category: "pane", description: "Navigate pane (contextual mode)", noCli: "contextual key, not a standalone binding" },
  navigate_pane_up: { category: "pane", description: "Navigate pane (contextual mode)", noCli: "contextual key, not a standalone binding" },
  navigate_pane_right: { category: "pane", description: "Navigate pane (contextual mode)", noCli: "contextual key, not a standalone binding" },
  detach: { category: "general", description: "Detach", noCli: "client action, no CLI" },
  toggle_sidebar: { category: "general", description: "Toggle sidebar", noCli: "UI only" },
  copy_mode: { category: "general", description: "Copy mode", noCli: "UI only" },
  remote_image_paste: { category: "general", description: "Paste remote image", noCli: "client action, no CLI" },
};
