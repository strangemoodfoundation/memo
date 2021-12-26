import * as anchor from '@project-serum/anchor';
import { Wallet } from '@project-serum/anchor/dist/cjs/provider';
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { DEVNET } from './constants';

import memoIDL from './memo.json';
import * as types from './types';

export { memoIDL, DEVNET, types };

export const transferWithMemo = async (
  connection: Connection,
  wallet: Wallet,
  transferData: types.TransferData,
  provierConnectionOpts?: ConfirmOptions
) => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  // @ts-ignore
  const provider = await getMemoProvider(
    connection,
    wallet,
    provierConnectionOpts ?? {}
  );

  /* create the program interface combining the idl, program ID, and provider */
  // @ts-ignore
  const program = new anchor.Program(memoIDL, DEVNET.MEMO_PROGRAM_ID, provider);
  const utf8encodedMemo = Buffer.from(transferData.memo);
  const {
    pubkey: memoAccountPubkey,
    bump,
    isNewAccount,
  } = await getMemoAccountForPubkey(connection, provider.wallet.publicKey);

  const accounts = {
    memoAccount: memoAccountPubkey, // publickey for our new account
    transferFrom: transferData.from,
    transferTo: transferData.to, // send moneys to a random acct for now!
    systemProgram: SystemProgram.programId, // just for Anchor reference
  };

  /* interact with the program via rpc */
  try {
    let tx;
    if (isNewAccount) {
      console.log('Memo Account Does Not Exist: Initializing and Transfering');
      tx = await program.rpc.initAndMemoTransfer(
        bump,
        utf8encodedMemo,
        new anchor.BN(transferData.amount),
        {
          accounts,
        }
      );
    } else {
      console.log(
        'Memo Account Exists: simply doing transfer',
        memoAccountPubkey.toString()
      );
      tx = await program.rpc.memoTransfer(
        utf8encodedMemo,
        new anchor.BN(transferData.amount),
        {
          accounts,
        }
      );
    }

    return tx;
  } catch (err) {
    console.log('Transaction error: ', err);
  }
};

export const getMemoAccountForPubkey = async (
  connection: Connection,
  walletAddress: PublicKey
) => {
  const [pubKeyAddy, bump] = findProgramAddressSync(
    [Buffer.from('memo_message'), walletAddress.toBuffer()],
    DEVNET.MEMO_PROGRAM_ID
  );
  const pubkey = new PublicKey(pubKeyAddy);
  const memoAccountInfo = await connection.getAccountInfo(pubkey);

  return {
    isNewAccount: !memoAccountInfo?.data,
    pubkey,
    bump,
  };
};

export const getMemoProvider = async (
  connection: Connection,
  wallet: Wallet,
  opts?: ConfirmOptions
) => {
  if (!wallet) throw new Error('Wallet Not Connected');

  const provider = new anchor.Provider(connection, wallet, opts ?? {});
  return provider;
};

export const getTransactionForAddress = async (
  connection: Connection,
  publicKey: anchor.web3.PublicKey,
  limit = 1000
) => {
  const confirmedSignatureInfo = await connection.getSignaturesForAddress(
    new anchor.web3.PublicKey(publicKey),
    { limit }
  );

  const transactionSignatures = confirmedSignatureInfo.map(
    (sigInfo) => sigInfo.signature
  );
  const parsedConfirmedTransactions =
    await connection.getParsedConfirmedTransactions(transactionSignatures);
  return parsedConfirmedTransactions;
};

export const getLastMemos = async (
  connection: Connection,
  memoAccountPubkey: PublicKey,
  limit = 100
): Promise<types.MemoContentType[]> => {
  const parsedConfirmedTransactions = await getTransactionForAddress(
    connection,
    memoAccountPubkey,
    limit
  );

  if (parsedConfirmedTransactions === null) return;

  const filtered = parsedConfirmedTransactions.filter(
    // @ts-ignore
    (tx: Transaction) =>
      //   @ts-ignore
      tx.meta.logMessages.some((msg) => msg.startsWith('Program log:'))
  );

  const postDetails = filtered.map((tx) => {
    // @ts-ignore
    const timestamp = new Date(tx.blockTime * 1000).toString();
    // @ts-ignore
    const pgmLogs = tx.meta.logMessages.filter((msg) =>
      msg.startsWith('Program log: ')
    );
    const content = pgmLogs.map((log) => log.substring('Program log: '.length));
    // @ts-ignore
    return { content, timestamp, signature: tx.transaction.signatures[0] };
  });

  return postDetails;
};
