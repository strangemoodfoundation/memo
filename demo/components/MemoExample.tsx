import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair } from '@solana/web3.js';
import React, { FC, useEffect, useState } from 'react';

import * as anchor from '@project-serum/anchor';

import {
  getLastMemos,
  getMemoAccountForPubkey,
  getMemoProvider,
  transferWithMemo,
  types,
} from '@strangemood/memo';

export const MemoExample: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [transactionData, setTransactionData] = useState<
    types.MemoContentType[]
  >([]);
  const [memo, setMemo] = useState<string>('');
  const [recipientAddr, setRecipientAddr] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');

  useEffect(() => {
    setTimeout(() => {
      fetchCurrentUserMemos();
    }, 1000);
  }, []);

  const opts: anchor.web3.ConfirmOptions = {
    preflightCommitment: 'recent',
    commitment: 'recent',
  };

  const sendTransaction = async () => {
    if (!wallet.publicKey) throw new WalletNotConnectedError();

    // @ts-ignore
    const tx = await transferWithMemo(connection, wallet, {
      from: wallet.publicKey,
      to: recipientAddr,
      amount: new anchor.BN(transferAmount),
      memo,
    });

    // refresh list!
    fetchCurrentUserMemos();
  };

  const fetchCurrentUserMemos = async () => {
    if (!wallet.publicKey) return;

    // @ts-ignore
    const provider = await getMemoProvider(connection, wallet, opts);

    const memos = await getLastMemos(
      connection,
      (
        await getMemoAccountForPubkey(connection, provider.wallet.publicKey)
      ).pubkey
    );

    console.log({ memos });
    setTransactionData([...memos]);
  };

  return (
    <div style={{ margin: 20, padding: 20 }}>
      <p>***</p>
      <input
        onChange={(event) => setTransferAmount(event.target.value)}
        value={transferAmount}
        placeholder={'0'}
      >
        {/* lamports (1/1000th of a SOL) */}
      </input>
      <input
        onChange={(event) => setRecipientAddr(event.target.value)}
        value={recipientAddr}
        placeholder={'Recipient SOL Address'}
      ></input>
      <input
        onChange={(event) => setMemo(event.target.value)}
        value={memo}
        placeholder={'What is this for?'}
      ></input>
      <button onClick={() => sendTransaction()} disabled={!wallet}>
        Send Transaction!
      </button>

      <p>***</p>
      <button onClick={() => fetchCurrentUserMemos()} disabled={!wallet}>
        Refresh Memos
      </button>

      <div>
        <h2>Transactions for your account!</h2>
        <div
          style={{
            alignContent: 'center',
            flex: 'auto',
            flexDirection: 'row',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h4>memo</h4>
          <h4>details</h4>
        </div>
        {transactionData.map((txData) => (
          <div
            style={{
              alignContent: 'center',
              flex: 'auto',
              flexDirection: 'row',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {txData.content.map((data: string) => (
              <p>{data}</p>
            ))}
            <button
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${txData.signature}?cluster=devnet`,
                  '_blank'
                )
              }
            >
              See Full Transaction
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
