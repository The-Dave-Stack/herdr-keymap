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

// ponytail: overlay panes may themselves count as the "focused" pane/workspace
// while open — verify empirically once installed; if pane-scoped actions
// (focus/split/zoom/close_pane) target this palette instead of the pane the
// user meant, resolve the target before opening the palette instead.
export function currentPane(): any {
  const wsId = currentWorkspaceId();
  const { panes } = herdr("pane", "list", "--workspace", wsId);
  const pane = panes.find((p: any) => p.focused);
  if (!pane) throw new Error("no focused pane found");
  return pane;
}
