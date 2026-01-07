import { create } from "domain";
import { gsMutator } from "./gsMutator";

export interface IAccount {
  id: string;
  email: string;
  masterPassword: string;
  scriptId: string;
  createdAt: string;
  updatedAt: string;
}

export class Account implements IAccount {
  id: string = ""   ;
  email: string = "";
  masterPassword: string = "";
  scriptId: string = "";
  createdAt: string = "";
  updatedAt: string = "";

  constructor(data: IAccount) {
    this.id = data.id;
    this.email = data.email;
    this.masterPassword = data.masterPassword;
    this.scriptId = data.scriptId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  async createAccount(): Promise<IAccount> {
    const result = await gsMutator.sendMutation({
      action: "create",
      data: JSON.stringify({
        email: this.email,
        masterPassword: this.masterPassword,
        scriptId: this.scriptId,
        createdAt: new Date().toISOString(),
      }),
    });
    return new Account(result as IAccount);
  }

  async updateAccount(): Promise<IAccount> {
    const result = await gsMutator.sendMutation({
      action: "update",
      data: JSON.stringify({
        id: this.id,
        email: this.email,
        masterPassword: this.masterPassword,
        scriptId: this.scriptId,
      }),
    });
    return new Account(result as IAccount);
  }
}

export const getAccounts = async (): Promise<IAccount[]> => {
  const result = await gsMutator.sendMutation({
    action: "get",
  });
  return result.map((account: IAccount) => new Account(account));
};