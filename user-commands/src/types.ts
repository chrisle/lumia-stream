export interface CommandData {
  response: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManageParams {
  username?: string;
  displayName?: string;
  message?: string;
  isMod?: boolean;
  isVip?: boolean;
  isTier2?: boolean;
  isTier3?: boolean;
}

export interface ExecuteParams {
  commandName?: string;
  username?: string;
  displayName?: string;
  channel?: string;
  game?: string;
  title?: string;
}

export interface ActionConfig {
  type: string;
  value: ManageParams | ExecuteParams;
}

export interface ActionsConfig {
  actions?: ActionConfig[];
}

export interface ParsedMessage {
  action: string;
  commandName: string;
  response: string;
}

export type CommandStore = Record<string, CommandData>;
