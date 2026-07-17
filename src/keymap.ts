import { ExitPromptError } from "@inquirer/core";
import { Separator, select } from "@inquirer/prompts";
import { ACTIONS, CATEGORY_ORDER, PaletteBack } from "./actions.ts";
import { loadEffectiveKeys } from "./config.ts";
import { NAV_THEME, headed } from "./herdr-cli.ts";

const BACK = "__back__";
const EXIT = "__exit__";

async function pickCategory(): Promise<string> {
  return select({
    message: headed("Category"),
    theme: NAV_THEME,
    choices: [
      { name: "❯ Exit", value: EXIT },
      new Separator(),
      ...CATEGORY_ORDER.map((cat) => {
        const count = Object.values(ACTIONS).filter((e) => e.category === cat).length;
        return { name: `${cat} (${count})`, value: cat };
      }),
    ],
  });
}

async function pickAction(category: string, keys: Record<string, string>): Promise<string> {
  const namesInCategory = Object.keys(ACTIONS).filter((n) => ACTIONS[n].category === category);
  return select({
    message: headed(`[${category}] commands (${namesInCategory.length})`),
    theme: NAV_THEME,
    choices: [
      { name: "❮ Back", value: BACK },
      new Separator(),
      ...namesInCategory.map((n) => {
        const entry = ACTIONS[n];
        const key = entry.noKey ? "(cmd)" : keys[n] || "(unassigned)";
        const tag = entry.executor ? "" : `  [${entry.noCli}]`;
        return { name: `${key.padEnd(22)} ${entry.description}${tag}`, value: n };
      }),
    ],
  });
}

async function main() {
  const keys = loadEffectiveKeys();

  try {
    while (true) {
      const category = await pickCategory();
      if (category === EXIT) break;

      while (true) {
        const name = await pickAction(category, keys);
        if (name === BACK) break;

        const entry = ACTIONS[name];
        if (!entry.executor) {
          // Keep the palette open so the key stays readable — it grabs all
          // terminal input, so the user must close it before pressing it.
          const key = keys[name];
          console.log(
            key
              ? `'${name}' has no CLI equivalent (${entry.noCli}). Close the palette (Esc), then press: ${key}`
              : `'${name}' has no CLI equivalent (${entry.noCli}) and has no key bound — assign one in config.toml.`,
          );
          continue;
        }
        try {
          await entry.executor();
        } catch (err) {
          // "❮ Back", an empty/declined prompt, or Esc/Ctrl+C inside a sub-prompt
          // all mean "cancel this action" — return to the action list, don't exit.
          if (err instanceof PaletteBack || err instanceof ExitPromptError) continue;
          console.log(`error: ${(err as Error).message}`);
        }
        return; // one command per palette open — reopen (prefix+m) for another
      }
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err;
    // clean exit: Esc or Ctrl+C/Ctrl+D at any prompt
  }
}

const isMain = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main();
}
