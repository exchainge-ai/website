import {
  Keypair,
  type PublicKey,
  type Transaction,
} from "@solana/web3.js";

export interface ClientSigner {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

export function toClientSigner(keypair: Keypair): ClientSigner {
  const signTransaction = async (transaction: Transaction) => {
    transaction.partialSign(keypair);
    return transaction;
  };

  return {
    publicKey: keypair.publicKey,
    signTransaction,
    signAllTransactions: async (transactions: Transaction[]) => {
      await Promise.all(transactions.map(signTransaction));
      return transactions;
    },
  };
}
