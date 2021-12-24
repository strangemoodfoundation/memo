import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

import type { NextPage } from 'next';
import { useFlag } from '../lib/useFlag';
import { MemoExample } from '../components/MemoExample';
import { MemoExamplePDA } from '../components/MemoExamplePDA';

const Home: NextPage = () => {
  const network = useFlag('network', 'mainnet-beta');

  return (
    <div className="text-xl">
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />

        <MemoExample />
        <MemoExamplePDA />
      </div>
    </div>
  );
};

export default Home;
