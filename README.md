## Memo Program!

Send a transfer between two accounts with a memo to remind you about why you made a transaction. The actual program is deployed on the devnet currently. This repo has a js `client` you can use, and a `demo` that you can spin up (basic nexjs app to interface with the client).

## Usage

### Using @strangemood/memo

```js
import {
  getLastMemos,
  getMemoAccountForPubkey,
  getMemoProvider,
  transferWithMemo,
} from "@strangemood/memo";

const currentWalletMemoAccount = getMemoAccountForPubkey(
  `wallet address of a user, likely the current authed user`
);
```

### RPC Directly

```js
import * as anchor from "@project-serum/anchor";
import { memoIDL, DEVNET } from "@strangemood/memo";

// get connection and wallet however you'd like... you can look at inspo in demo/MemoExample.tsx

const provider = new anchor.Provider(connection, wallet);
const program = new anchor.Program(idl, DEVNET.MEMO_PROGRAM_ID, provider);
const tx = await program.rpc.memoTransfer(
  utf8encodedMemo,
  new anchor.BN(transferData.amount),
  {
    accounts,
  }
);
```

### Deploying Memo Program

To use the program it needs to be deployed. This is currently running on the `devnet` but can be deployed on mainnet whenever.

1. Building and Deploying:

`anchor build`
`anchor deploy`

2. Running the build command above, generates an updated `idl` file. This is managed by Anchor and helps in building the JS client. To make sure the JS client is using a compatible interface to the program on chain, copy the target/idl/memo.json file into `client/src/memo.json`.

### Developing

Create a local symlink so you can develop without new npm publishing.

1. `cd client`, `yarn build`, `yarn link`

2. `cd demo`, `yarn link @strangemood/memo`
