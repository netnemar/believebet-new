import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from 'bs58';
import toast from 'react-hot-toast';

// House wallet address where funds are stored
export const HOUSE_WALLET_ADDRESS = 'ErdeYZZMx12X2zMwV8WidLVUzrGg71Kn1i4cjvowmPWq';

// Адрес сервера для обработки платежей (замените на ваш реальный сервер)
// В режиме разработки используйте локальный сервер
// В продакшене замените на настоящий домен вашего API
const PAYOUT_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.pokets.com/api/payouts' 
  : 'http://localhost:3001/api/payouts';

// Список резервных RPC-эндпоинтов (можно использовать платные ноды для большей надежности)
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

// Функция для получения рабочего RPC-соединения
const getConnection = async (): Promise<Connection> => {
  // По умолчанию используем первый эндпоинт
  try {
    const connection = new Connection(RPC_ENDPOINTS[0], {
      commitment: 'confirmed'
    });
    // Проверка соединения
    await connection.getLatestBlockhash();
    return connection;
  } catch (error) {
    console.warn(`Primary RPC connection failed, trying fallbacks`, error);
    
    // Попробуем резервные эндпоинты
    for (let i = 1; i < RPC_ENDPOINTS.length; i++) {
      try {
        const connection = new Connection(RPC_ENDPOINTS[i]);
        await connection.getLatestBlockhash();
        return connection;
      } catch (error) {
        console.warn(`Connection failed for ${RPC_ENDPOINTS[i]}`, error);
      }
    }
    
    // Если все не сработали, используем последний в списке
    return new Connection(RPC_ENDPOINTS[RPC_ENDPOINTS.length - 1]);
  }
};

/**
 * Функция для автоматической отправки выигрыша пользователю
 * @param amount Сумма выигрыша в SOL
 * @param destinationAddress Адрес кошелька победителя
 * @returns Promise<boolean> Успешно ли отправлены средства
 */
export const sendWinningsFromHouse = async (
  amount: number,
  destinationAddress: string
): Promise<{ success: boolean; signature?: string; error?: string }> => {
  try {
    console.log(`Sending ${amount} SOL to ${destinationAddress} from vault wallet...`);

    // Проверяем адрес получателя на валидность
    try {
      new PublicKey(destinationAddress);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid destination wallet address'
      };
    }

    // Используем vault private key для отправки средств
    const VAULT_PRIVATE_KEY_BASE58 = 'nqXP5QF1oKS8Vpyuq2LS4gGVkSxcNMq5MSbsD23WAKdaHJgrd52Xbg9mMvvDLTrAnj541ZZvzAn74d1QbNJDFJy';
    const VAULT_PUBLIC_KEY = 'ErdeYZZMx12X2zMwV8WidLVUzrGg71Kn1i4cjvowmPWq';
    let vaultKeypair: Keypair;
    try {
      const secretKey = bs58.decode(VAULT_PRIVATE_KEY_BASE58);
      vaultKeypair = Keypair.fromSecretKey(secretKey);
      if (vaultKeypair.publicKey.toString() !== VAULT_PUBLIC_KEY) {
        throw new Error('Vault public key does not match expected address');
      }
    } catch (e) {
      return {
        success: false,
        error: 'Vault private key is invalid or does not match public address'
      };
    }

    const connection = await getConnection();
    const vaultBalanceLamports = await connection.getBalance(vaultKeypair.publicKey);
    const payoutLamports = Math.floor(amount * LAMPORTS_PER_SOL);
    if (vaultBalanceLamports < payoutLamports) {
      return {
        success: false,
        error: 'Vault is empty or does not have enough funds for payout'
      };
    }

    // Формируем и отправляем транзакцию
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: vaultKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports: payoutLamports,
      })
    );
    const signature = await connection.sendTransaction(transaction, [vaultKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');

    return {
      success: true,
      signature
    };
  } catch (error: any) {
    console.error('Error sending automatic payout:', error);
    return {
      success: false,
      error: error.message || 'Failed to send automatic payout'
    };
  }
};

/**
 * Функция для проверки баланса кошелька хранилища
 * @returns Promise<number> Баланс в SOL
 */
export const getHouseBalance = async (): Promise<number> => {
  try {
    const connection = await getConnection();
    const balance = await connection.getBalance(new PublicKey(HOUSE_WALLET_ADDRESS));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting house balance:', error);
    return 0;
  }
}; 