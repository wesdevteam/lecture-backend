export type AccountType = {
  _id: string;
  name: string;
  email: string;
  password: string;
};

export type AccountFilterType = Partial<AccountType>;

export type AccountDocumentType = AccountType & Document;
