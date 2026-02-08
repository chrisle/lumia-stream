import { ManageParams, CommandData } from "../types";

export function hasPermission(params: ManageParams): boolean {
  return (
    params?.isMod === true ||
    params?.isVip === true ||
    params?.isTier2 === true ||
    params?.isTier3 === true
  );
}

export function canManageCommand(
  params: ManageParams,
  command: CommandData
): boolean {
  if (params?.isMod === true) return true;
  return command.creator === params?.username?.toLowerCase();
}
