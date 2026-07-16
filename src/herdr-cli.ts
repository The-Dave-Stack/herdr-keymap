import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { join } from "node:path";

// herdr has no documented way for a pane command to redirect its own stdout
// into "herdr plugin log list" (that only captures build failures) — so we
// keep our own log file instead of printing results to the visible pane.
// HERDR_PLUGIN_STATE_DIR is unset outside a real plugin run (e.g. tests), in
// which case this silently no-ops rather than writing next to the source.
function logLine(text: string): void {
  const stateDir = process.env.HERDR_PLUGIN_STATE_DIR;
  if (!stateDir) return;
  appendFileSync(join(stateDir, "keymap.log"), `${new Date().toISOString()} ${text}\n`);
}

// HERDR_SOCKET_PATH is already injected by whichever server spawned this
// plugin process — never pass --session here, it would override that.
export function herdr(...args: string[]): any {
  try {
    const out = execFileSync("herdr", args, { encoding: "utf8" });
    const result = JSON.parse(out).result;
    logLine(`ok    herdr ${args.join(" ")} -> ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    logLine(`error herdr ${args.join(" ")} -> ${(err as Error).message}`);
    throw err;
  }
}

export function currentWorkspaceId(): string {
  const { workspaces } = herdr("workspace", "list");
  const ws = workspaces.find((w: any) => w.focused);
  if (!ws) throw new Error("no focused workspace found");
  return ws.workspace_id;
}

export function currentPane(): any {
  const wsId = currentWorkspaceId();
  const { panes } = herdr("pane", "list", "--workspace", wsId);
  const pane = panes.find((p: any) => p.focused);
  if (!pane) throw new Error("no focused pane found");
  return pane;
}

// The palette runs as an overlay pane, so IT is the focused pane while open —
// `--current` (and currentPane()) resolve to the palette, not the pane the
// user came from. Splitting the overlay makes herdr ignore --direction, so
// pane-scoped actions (split/focus/zoom/close_pane) must target the
// originating pane. herdr hands it to us in HERDR_PLUGIN_CONTEXT_JSON as
// `focused_pane_id` (confirmed from a live invocation). NB: HERDR_PANE_ID is
// set too, but it's the overlay's own id — do NOT use it here.
export function originPaneId(): string {
  const raw = process.env.HERDR_PLUGIN_CONTEXT_JSON;
  if (raw) {
    const pid = JSON.parse(raw).focused_pane_id;
    if (typeof pid === "string" && pid) return pid;
  }
  // Fail loud rather than fall back to the focused pane (the overlay), which
  // would silently resurrect the wrong-target split bug.
  throw new Error("no focused_pane_id in HERDR_PLUGIN_CONTEXT_JSON");
}
