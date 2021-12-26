import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

import type { NextPage } from 'next';
import { MemoExample } from '../components/MemoExample';

const Home: NextPage = () => {
  return (
    <div className="text-xl">
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />

        <MemoExample />
      </div>
    </div>
  );
};

export default Home;
