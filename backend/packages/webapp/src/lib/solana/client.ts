import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import idl from "./idl.json";

export interface DatasetAccountData {
  address: string;
  owner: PublicKey;
  datasetHash: number;
  price: BN;
}

export const PROGRAM_ID = new PublicKey(
  (idl as { address?: string }).address ?? "ERtSQNoAiE3p1zP6W6hmyc4da6HxrpPED2SsD7Ds3Mck",
);

const DATASET_SEED = Buffer.from("dataset");

type ProgramReturn = {
  connection: Connection;
  wallet: Wallet;
  provider: AnchorProvider;
  program: Program;
};

export function initSolanaClient(
  rpcUrl: string,
  walletKeypair: Keypair,
): ProgramReturn {
  const connection = new Connection(rpcUrl, "confirmed");
  const signTx = async <T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> => {
    if (transaction instanceof Transaction) {
      transaction.partialSign(walletKeypair);
    } else {
      transaction.sign([walletKeypair]);
    }
    return transaction;
  };

  const wallet: Wallet = {
    publicKey: walletKeypair.publicKey,
    signTransaction: signTx,
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      transactions: T[],
    ): Promise<T[]> => {
      const signed: T[] = [];
      for (const tx of transactions) {
        signed.push(await signTx(tx));
      }
      return signed;
    },
    payer: walletKeypair,
  };

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl as any, provider);

  return { connection, wallet, provider, program };
}

function ensureFourByteSeed(datasetHash: number): Buffer {
  if (!Number.isInteger(datasetHash) || datasetHash < 0 || datasetHash > 0xffffffff) {
    throw new Error(`Dataset hash must be a 32-bit unsigned integer. Received: ${datasetHash}`);
  }
  const seed = Buffer.alloc(4);
  seed.writeUInt32LE(datasetHash, 0);
  return seed;
}

export function deriveDatasetPda(datasetHash: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [DATASET_SEED, ensureFourByteSeed(datasetHash)],
    PROGRAM_ID,
  );
}

export function bufferToDatasetHashNumber(datasetHash: Buffer): number {
  if (datasetHash.length < 4) {
    throw new Error("Dataset hash buffer must be at least 4 bytes");
  }
  return datasetHash.readUInt32LE(0);
}

export async function registerDatasetOnChain(
  program: Program,
  datasetHashBuffer: Buffer,
  priceLamports: BN | number,
): Promise<{
  datasetAccount: string;
  signature: string;
  datasetHash: number;
}> {
  const datasetHash = bufferToDatasetHashNumber(datasetHashBuffer);
  const [datasetAccount] = deriveDatasetPda(datasetHash);

  const price = BN.isBN(priceLamports)
    ? priceLamports
    : new BN(priceLamports);

  const tx = await program.methods
    .addDataset(datasetHash, price)
    .accounts({
      datasetAccount,
      user: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    datasetAccount: datasetAccount.toBase58(),
    signature: tx,
    datasetHash,
  };
}

export async function fetchDatasetAccount(
  program: Program,
  datasetHash: number,
): Promise<DatasetAccountData | null> {
  const [datasetAccount] = deriveDatasetPda(datasetHash);
  return fetchDatasetAccountByAddress(program, datasetAccount.toBase58());
}

export async function fetchDatasetAccountByAddress(
  program: Program,
  datasetAccountAddress: string,
): Promise<DatasetAccountData | null> {
  try {
    const datasetAccountPubkey = new PublicKey(datasetAccountAddress);
    const account = await (program.account as any).datasetAccount.fetchNullable(
      datasetAccountPubkey,
    );

    if (!account) {
      return null;
    }

    return {
      address: datasetAccountPubkey.toBase58(),
      owner: account.owner as PublicKey,
      datasetHash: account.datasetHash as number,
      price: account.price as BN,
    };
  } catch (error) {
    console.error("Failed to fetch dataset account:", error);
    return null;
  }
}

export async function fetchDatasetsByOwner(
  program: Program,
  ownerAddress?: string,
): Promise<DatasetAccountData[]> {
  const owner = ownerAddress
    ? new PublicKey(ownerAddress)
    : program.provider.publicKey!;

  const accounts: any[] = await (program.account as any).datasetAccount.all([
    {
      memcmp: {
        offset: 8,
        bytes: owner.toBase58(),
      },
    },
  ]);

  return accounts.map((entry) => ({
    address: entry.publicKey.toBase58(),
    owner: entry.account.owner as PublicKey,
    datasetHash: entry.account.datasetHash as number,
    price: entry.account.price as BN,
  }));
}
