import Account from "@/models/account/account.model";
import { AccountFilterType, AccountType } from "@/types/models/account.type";

export const findAccountS = async (
  filter: AccountFilterType,
): Promise<AccountType | null> => {
  const account = await Account.findOne(filter).exec();
  return account as AccountType | null;
};

export const registerS = async (data: Partial<AccountType>) => {
  const account = await Account.create(data);
  return account;
};
