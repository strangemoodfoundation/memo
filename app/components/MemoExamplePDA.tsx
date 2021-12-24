// CHANGE IT TO USE PDAs

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
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
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

// const memoAccount = Keypair.generate();

export const MemoExamplePDA: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const opts: anchor.web3.ConfirmOptions = {
    preflightCommitment: 'recent',
    commitment: 'recent',
  };

  const getMemoAccountPDA = async (walletAddress: PublicKey) => {
    const [pubKeyAddy, bump] = findProgramAddressSync(
      [Buffer.from('message'), walletAddress.toBuffer()],
      programID
    );
    return { pubkey: new PublicKey(pubKeyAddy), bump };
  };

  const getTransferFn = async (walletAddress: PublicKey) => {
    const { pubkey, bump } = await getMemoAccountPDA(walletAddress);
    const memoAccountInfo = await connection.getAccountInfo(pubkey);

    console.log(memoAccountInfo?.data.toJSON().data.toString());

    return {
      isNewAccount: !memoAccountInfo?.data,
      pubkey,
      bump,
    };
  };

  async function getProvider() {
    if (!wallet.publicKey) throw new WalletNotConnectedError();

    const provider = new anchor.Provider(
      connection,
      // @ts-ignore
      wallet,
      opts.preflightCommitment
    );

    console.log(provider);

    return provider;
  }

  async function demo_memo(amt: number) {
    console.log('TRYING SOMETHING NEW HERE');
    const provider = await getProvider();
    // if (!provider.wallet.publicKey) return;

    /* create the program interface combining the idl, program ID, and provider */
    // @ts-ignore
    const program = new anchor.Program(idl, programID, provider);

    const message = 'THIS IS WORKING';
    const utf8encodedMemo = Buffer.from(message);

    console.log('creating rando acct to send sol to...');
    const transferTo = Keypair.generate().publicKey;
    console.log({ transferTo: transferTo.toString() });

    const {
      pubkey: memoAccountPubkey,
      bump,
      isNewAccount,
    } = await getTransferFn(provider.wallet.publicKey);

    try {
      let tx;
      /* interact with the program via rpc */
      if (isNewAccount) {
        const accounts = {
          memoAccount: memoAccountPubkey, // publickey for our new account
          // authority: provider.wallet.publicKey, // publickey of our anchor wallet provider

          transferFrom: provider.wallet.publicKey,
          transferTo, // send moneys to a random acct for now!

          systemProgram: SystemProgram.programId, // just for Anchor reference
        };
        console.log(
          'Memo Account Does Not Exist: Initializing and Transfering'
        );
        tx = await program.rpc.initPdaAndTransfer(bump, utf8encodedMemo, {
          accounts,
        });
      } else {
        const accounts = {
          memoAccount: memoAccountPubkey, // publickey for our new account
          // authority: provider.wallet.publicKey, // publickey of our anchor wallet provider

          transferFrom: provider.wallet.publicKey,
          transferTo, // send moneys to a random acct for now!
          systemProgram: SystemProgram.programId, // just for Anchor reference
        };
        //   CURRENTLY FAILING
        console.log(
          'Memo Account Exists: simply doing transfer',
          memoAccountPubkey.toString()
        );
        tx = await program.rpc.memoTransfer(utf8encodedMemo, {
          accounts,
        });
      }

      console.log({ tx });

      console.log(memoAccountPubkey.toString());
      // setValue(account.data.toString());
      // setDataList(account.dataList);
    } catch (err) {
      console.log('Transaction error: ', err);
    }
  }

  return (
    <div>
      <p>TRYING SOMETHING NEW</p>
      <button onClick={() => demo_memo(1)} disabled={!wallet}>
        Make PDA Init And Transactions!
      </button>
      {/* <button onClick={() => getLastMemos()} disabled={!wallet}>
        Log all memos
      </button>
      <div>{!value && <button onClick={initialize}>Initialize</button>}</div>
      <div>
        {!value && (
          <button onClick={demo_memo}>demo memo log and transfer</button>
        )}
      </div> */}
    </div>
  );
};
