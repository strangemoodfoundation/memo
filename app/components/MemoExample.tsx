import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import {
  useConnection,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react';

import {
  Keypair,
  Transaction,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import React, { FC, useState } from 'react';
import {
  createWrappedNativeAccount,
  sendAndConfirmWalletTransaction,
} from '../lib/util';
// import fs from 'fs';

import idl from './memo.json';

import * as anchor from '@project-serum/anchor';
// import { programId } from './src/lib/constants';
// import { WalletAdaptorPhantom } from 'wallet-adapter-phantom';

let utf8decoder = new TextDecoder(); // default 'utf-8' or 'utf8'

export const programID = new PublicKey(
  '4WfX3TMZ8pv2FgQyLeWabRoJy5GAYAm7tZhkVGVdsUt7'
);

const DEMO_INITIALIZED_MEMO_ACCOUNT =
  'FGiNoUeBPnh3SAbmuiHPtBJoUzgBEdaAv9bjF3Nt6amZ';

// import { programId } from

// Configure the local cluster.
// anchor.setProvider(anchor.Provider.local());

// import * as myFile from '../../target/idl/solmemo.json';

export const MemoExample: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [value, setValue] = useState('');
  const [dataList, setDataList] = useState([]);
  const [input, setInput] = useState('');

  const opts: anchor.web3.ConfirmOptions = {
    preflightCommitment: 'recent',
    commitment: 'recent',
  };
  const memoAccount = Keypair.generate();
  //   const idl = JSON.parse(
  //     fs.readFileSync('../../target/idl/solmemo.json', 'utf8')
  //   );

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    // const HTTP_URI = 'https://api.devnet.solana.com';
    // const connection = new anchor.web3.Connection(HTTP_URI, 'confirmed');

    const provider = new anchor.Provider(
      connection,
      // @ts-ignore
      wallet,
      opts.preflightCommitment
    );

    return provider;
  }

  async function initialize() {
    const provider = await getProvider();
    /* create the program interface combining the idl, program ID, and provider */
    // @ts-ignore
    const program = new anchor.Program(idl, programID, provider);

    const message = 'My Fun Demo Account';
    const utf8encoded = Buffer.from(message);

    try {
      /* interact with the program via rpc */
      const tx = await program.rpc.initialize(utf8encoded, {
        accounts: {
          memoAccount: memoAccount.publicKey, // publickey for our new account
          authority: provider.wallet.publicKey, // publickey of our anchor wallet provider
          systemProgram: SystemProgram.programId, // just for Anchor reference
        },
        signers: [memoAccount],
      });

      console.log({ tx });

      const account = await program.account.memoAccount.fetch(
        memoAccount.publicKey
      );
      console.log('account: ', account);
      console.log(memoAccount.publicKey.toString());
      // setValue(account.data.toString());
      // setDataList(account.dataList);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function demo_memo() {
    console.log('TRYING SOMETHING NEW HERE');
    const provider = await getProvider();
    /* create the program interface combining the idl, program ID, and provider */
    // @ts-ignore
    const program = new anchor.Program(idl, programID, provider);

    const message = 'I AM GOING INSANE';
    const utf8encoded = Buffer.from(message);

    console.log('creating rando acct to send sol to...');
    const transferTo = Keypair.generate().publicKey;
    console.log({ transferTo });

    try {
      /* interact with the program via rpc */
      const tx = await program.rpc.initAndTransfer(utf8encoded, {
        accounts: {
          memoAccount: memoAccount.publicKey, // publickey for our new account
          authority: provider.wallet.publicKey, // publickey of our anchor wallet provider
          systemProgram: SystemProgram.programId, // just for Anchor reference
          // tokenProgram: TOKEN_PROGRAM_ID,
          transferTo, // send moneys to a random acct for now!
        },
        signers: [memoAccount],
      });

      console.log({ tx });

      const account = await program.account.memoAccount.fetch(
        memoAccount.publicKey
      );
      console.log('account: ', account);
      console.log(memoAccount.publicKey.toString());
      // setValue(account.data.toString());
      // setDataList(account.dataList);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  async function makeTransactionWithMemo(
    amount: number, // amt in sols
    memo = 'memo for payment!',
    memoAccountStr = DEMO_INITIALIZED_MEMO_ACCOUNT // demo
  ) {
    const provider = await getProvider();
    /* create the program interface combining the idl, program ID, and provider */
    // @ts-ignore
    const program = new anchor.Program(idl, programID, provider);

    const utf8encoded = Buffer.from(memo);

    // convert our string to PublicKey type
    let currentMemoAccount = new anchor.web3.PublicKey(memoAccountStr);

    console.log(provider.wallet.publicKey.toString());
    console.log(program.provider.wallet.publicKey.toString());

    const transferTo = Keypair.generate().publicKey;
    console.log({ transferTo });

    // Execute the RPC.
    const tx = await program.rpc.memoTransfer(
      // input must be compatible with UTF8 Vector in rust
      utf8encoded,
      // new anchor.BN(amount),
      // now pass the accounts in
      {
        accounts: {
          memoAccount: currentMemoAccount, // needs to be the same publicKey as init, or it won't work
          authority: program.provider.wallet.publicKey, // needs to be the same publicKey as init, or it won't work
          tokenProgram: TOKEN_PROGRAM_ID,
          transferTo, // send moneys to a random acct for now!
        },
        // how is this supposed to work??? i dont think payer is a keypair. are we sure this isnt the memo account keypair ??
        signers: [], // needs to be the same keyPAIR as init, or it won't work
      }
    );
    console.log(
      `Successfully posted ${memo} to https://explorer.solana.com/address/${memoAccount}?cluster=devnet`
    );
    return tx;
  }

  // Read is a pure Solana Web3.js exercise, no Anchor really needed
  const getLastMemos = async (
    memoAccountStr = DEMO_INITIALIZED_MEMO_ACCOUNT, // demo,
    limit = 100
  ) => {
    const accountpublicKey = new anchor.web3.PublicKey(memoAccountStr);

    const parsedConfirmedTransactions = await getTransactionForAddress(
      accountpublicKey,
      limit
    );

    if (parsedConfirmedTransactions === null) return;

    console.log('------------- got last posts');
    console.log({ parsedConfirmedTransactions });

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
      const content = pgmLogs.map((log) =>
        log.substring('Program log: '.length)
      );
      // @ts-ignore
      return { content, timestamp, signature: tx.transaction.signatures[0] };
    });

    console.log({ postDetails });

    return postDetails;
  };

  const getTransactionForAddress = async (
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

  return (
    <div>
      <button onClick={() => makeTransactionWithMemo(1)} disabled={!wallet}>
        Make Transaction with Memo!
      </button>
      <button onClick={() => getLastMemos()} disabled={!wallet}>
        Log all memos
      </button>
      <div>{!value && <button onClick={initialize}>Initialize</button>}</div>
      <div>
        {!value && (
          <button onClick={demo_memo}>demo memo log and transfer</button>
        )}
      </div>
    </div>
  );
};
