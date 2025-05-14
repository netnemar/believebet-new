// API сервер для обработки выплат выигрышей
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Защитный middleware для проверки авторизации
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  // В реальном сервере здесь должна быть проверка JWT токена
  // Для примера мы используем простую проверку
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
  }
  
  // В реальном проекте здесь должна быть проверка токена через JWT
  // Для демо просто проверяем, что токен существует
  next();
};

// Переменные окружения с чувствительными данными должны храниться в .env файле
// и никогда не включаться в репозиторий
const HOUSE_WALLET_SECRET_KEY = process.env.HOUSE_WALLET_SECRET_KEY;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

// Инициализация keypair из приватного ключа
let houseKeypair;
try {
  // Пытаемся загрузить ключ из переменных окружения
  if (HOUSE_WALLET_SECRET_KEY) {
    const secretKey = bs58.decode(HOUSE_WALLET_SECRET_KEY);
    houseKeypair = Keypair.fromSecretKey(secretKey);
    console.log('House wallet initialized from environment variable');
  } else {
    // Пытаемся загрузить ключ из файла
    try {
      const keyFile = path.join(__dirname, '.house-wallet.json');
      if (fs.existsSync(keyFile)) {
        const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
        houseKeypair = Keypair.fromSecretKey(new Uint8Array(keyData));
        console.log('House wallet initialized from key file');
      } else {
        // Создаем временный ключ для демо
        houseKeypair = Keypair.generate();
        console.warn('WARNING: Using temporary house wallet for demo');
        
        // Сохраняем ключ для последующего использования
        fs.writeFileSync(keyFile, JSON.stringify(Array.from(houseKeypair.secretKey)));
      }
    } catch (error) {
      console.error('Error loading house wallet from file:', error);
      houseKeypair = Keypair.generate();
      console.warn('WARNING: Using temporary house wallet');
    }
  }
  
  console.log('House wallet public key:', houseKeypair.publicKey.toString());
} catch (error) {
  console.error('Failed to initialize house wallet:', error);
  process.exit(1);
}

// Создание соединения с Solana
const getConnection = () => {
  return new Connection(RPC_ENDPOINT, 'confirmed');
};

// Функция для проверки баланса хаус-кошелька
const getHouseBalance = async () => {
  try {
    const connection = getConnection();
    const balance = await connection.getBalance(houseKeypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting house balance:', error);
    throw error;
  }
};

// Функция для отправки SOL с хаус-кошелька
const sendFromHouse = async (amount, destinationAddress) => {
  try {
    // Проверка валидности адреса
    const destination = new PublicKey(destinationAddress);
    
    // Проверка баланса
    const connection = getConnection();
    const balance = await connection.getBalance(houseKeypair.publicKey);
    const balanceInSOL = balance / LAMPORTS_PER_SOL;
    
    if (balanceInSOL < amount) {
      throw new Error(`Insufficient funds: ${balanceInSOL} SOL available, need ${amount} SOL`);
    }
    
    // Создание транзакции
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: houseKeypair.publicKey,
        toPubkey: destination,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );
    
    // Получение blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = houseKeypair.publicKey;
    
    // Подписание и отправка транзакции
    transaction.sign(houseKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    // Ожидание подтверждения
    await connection.confirmTransaction(signature, 'confirmed');
    
    return { signature, amount };
  } catch (error) {
    console.error('Error sending SOL from house wallet:', error);
    throw error;
  }
};

// Endpoint для получения баланса хаус-кошелька
app.get('/api/balance', authMiddleware, async (req, res) => {
  try {
    const balance = await getHouseBalance();
    res.json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint для обработки выплат
app.post('/api/payouts', authMiddleware, async (req, res) => {
  try {
    const { amount, destination, gameId } = req.body;
    
    if (!amount || !destination) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: amount and destination'
      });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount: must be a positive number'
      });
    }
    
    // Логирование запроса
    console.log(`Processing payout: ${amount} SOL to ${destination}`);
    
    // Отправка выплаты
    const result = await sendFromHouse(amount, destination);
    
    // Запись в лог
    const logEntry = {
      timestamp: Date.now(),
      gameId,
      amount,
      destination,
      signature: result.signature,
      success: true
    };
    
    // В реальном проекте здесь должно быть сохранение в БД
    console.log('Payout processed:', logEntry);
    
    res.json({
      success: true,
      signature: result.signature,
      amount,
      destination,
      timestamp: Date.now()
    });
  } catch (error) {
    // Запись ошибки в лог
    console.error('Payout failed:', error);
    
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: Date.now()
    });
  }
});

// Стартуем сервер
app.listen(port, () => {
  console.log(`Payout server running on port ${port}`);
  
  // Проверка баланса при запуске
  getHouseBalance()
    .then(balance => {
      console.log(`House wallet balance: ${balance} SOL`);
    })
    .catch(error => {
      console.error('Failed to check house wallet balance:', error);
    });
});

module.exports = app; 