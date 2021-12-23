// client.js is used to introduce the reader to generating clients from IDLs.
// It is not expected users directly test with this example. For a more
// ergonomic example, see `tests/basic-0.js` in this workspace.

import * as anchor from '@project-serum/anchor';
import { programId } from './src/lib/constants';
import { WalletAdaptorPhantom } from 'wallet-adapter-phantom';

let utf8decoder = new TextDecoder(); // default 'utf-8' or 'utf8'

const opts: anchor.web3.ConfirmOptions = {
  preflightCommitment: 'recent',
  commitment: 'recent',
};

// import { programId } from

// Configure the local cluster.
// anchor.setProvider(anchor.Provider.local());

const HTTP_URI = 'https://api.devnet.solana.com';
const connection = new anchor.web3.Connection(HTTP_URI, 'confirmed');

anchor.setProvider(new anchor.Provider(connection, wallet, opts))



type ClientContstructor = {
  programId: anchor.web3.PublicKey;
  config: any;
  keypair: anchor.web3.Keypair;
};

export default class SolblogAnchorClient {
  provider: anchor.Provider;
  programId: anchor.Address;
  config: any;
  connection: anchor.web3.Connection;
  program: anchor.Program;

  constructor({ programId, config, keypair }: ClientContstructor) {
    this.programId = programId;
    this.config = config;
    this.connection = new anchor.web3.Connection(
      this.config.httpUri,
      'confirmed'
    );

    const wallet =
      window.solana.isConnected && window.solana?.isPhantom
        ? new WalletAdaptorPhantom()
        : keypair
        ? new anchor.Wallet(keypair)
        : new anchor.Wallet(anchor.web3.Keypair.generate());

    const idl = JSON.parse(
      require('fs').readFileSync('./target/idl/solblog.json', 'utf8')
    );
    this.provider = new anchor.Provider(
      this.connection,
      wallet as anchor.Wallet,
      opts
    );
    this.program = new anchor.Program(idl, this.programId, this.provider);
  }

  async initialize(bio: string) {
    // generate an address (PublciKey) for this new account
    let blogAccount = anchor.web3.Keypair.generate(); // blogAccount is type Keypair
    const utf8encoded = Buffer.from(bio);

    console.log(
      'SystemProgram.programId',
      anchor.web3.SystemProgram.programId.toString()
    );
    console.log(
      'blogAccount.publicKey.toString()',
      blogAccount.publicKey.toString()
    );
    console.log('authority', this.provider.wallet.publicKey.toString());
    // Execute the RPC call
    const tx = await this.program.rpc.initialize(utf8encoded, {
      // Pass in all the accounts needed
      accounts: {
        blogAccount: blogAccount.publicKey, // publickey for our new account
        authority: this.provider.wallet.publicKey, // publickey of our anchor wallet provider
        systemProgram: anchor.web3.SystemProgram.programId, // just for Anchor reference
      },
      // current wallet is passed in by default
      signers: [blogAccount], // blogAccount must sign this Tx, to prove we have the private key too
    });
    console.log({ tx });
    console.log(
      `Successfully intialized Blog ID: ${blogAccount.publicKey} for Blogger ${this.provider.wallet.publicKey}`
    );
    return blogAccount;
  }

  // async makePost(post, blogAccountStr) {
  // 	console.log('is the issue making a post? ooooop.');
  // 	// convert our string to PublicKey type
  // 	let blogAccount = new anchor.web3.PublicKey(blogAccountStr);

  // 	const utf8encoded = Buffer.from(post); // anchor library doesn't like UInt8Array, so we use Nodejs buffer here

  // 	// Execute the RPC.
  // 	const tx = await this.program.rpc.makePost(
  // 		// input must be compatible with UTF8 Vector in rust
  // 		utf8encoded,
  // 		// now pass the accounts in
  // 		{
  // 			accounts: {
  // 				blogAccount: blogAccount, // needs to be the same publicKey as init, or it won't work
  // 				authority: this.program.provider.wallet.publicKey // needs to be the same publicKey as init, or it won't work
  // 			},
  // 			// how is this supposed to work??? i dont think payer is a keypair. are we sure this isnt the blog account keypair ??
  // 			signers: [this.program.provider.wallet.payer] // needs to be the same keyPAIR as init, or it won't work
  // 		}
  // 	);
  // 	console.log(
  // 		`Successfully posted ${post} to https://explorer.solana.com/address/${blogAccount}?cluster=devnet`
  // 	);
  // 	return tx;
  // }
}

// async function main() {
// 	// #region main
// 	// Read the generated IDL.
// 	const idl = JSON.parse(require('fs').readFileSync('./target/idl/solblog.json', 'utf8'));

// 	// Generate the program client from IDL.
// 	const program = new anchor.Program(idl, programId);

// 	// Execute the RPC.
// 	await program.rpc.initialize();
// 	// #endregion main
// }

// console.log('Running client.');
// main().then(() => console.log('Success'));
