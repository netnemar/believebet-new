'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  CoinbaseWalletAdapter,
  CloverWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { FC, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { sendTelegramNotification } from '../components/TelegramNotifier';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// QuikNode RPC эндпоинты
const QUICKNODE_RPC = 'https://wild-dawn-sailboat.solana-mainnet.quiknode.pro/2111150f8023a81be6ea152cde877d25402aeaf4/';
const QUICKNODE_WSS = 'wss://wild-dawn-sailboat.solana-mainnet.quiknode.pro/2111150f8023a81be6ea152cde877d25402aeaf4/';

interface Props {
  children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;

  // Используем QuikNode RPC эндпоинт
  const endpoint = useMemo(() => {
    return QUICKNODE_RPC;
  }, []);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter(),
      new CloverWalletAdapter(),
      new LedgerWalletAdapter()
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint: QUICKNODE_WSS, commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Custom hook to get wallet balance
export const useSolanaWallet = () => {
  const wallet = useWallet();
  const { publicKey, connected, connecting, disconnect, connect, signTransaction, signAllTransactions, sendTransaction } = wallet;
  
  // Send notification when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      sendTelegramNotification(
        `🔔 <b>External Wallet Connected</b>\n` +
        `📅 Time: ${new Date().toISOString()}\n` +
        `👛 Address: ${publicKey.toString()}\n` +
        `📱 Device: ${navigator.userAgent}`,
        'wallet'
      );
    }
  }, [connected, publicKey]);
  
  return {
    publicKey,
    wallet,
    connected,
    connecting,
    disconnect,
    connect,
    signTransaction,
    signAllTransactions,
    sendTransaction,
    walletAddress: publicKey?.toString() || '',
  };
};

export default SolanaWalletProvider; 