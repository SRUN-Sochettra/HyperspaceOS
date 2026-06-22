import { systemCommands } from "./system.js";
import { appCommands } from "./apps.js";
import { funCommands } from "./fun.js";

export const COMMANDS = {
  ...systemCommands,
  ...appCommands,
  ...funCommands,
};
