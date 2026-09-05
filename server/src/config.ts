import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  sellauthApiKey: process.env.SELLAUTH_API_KEY || 'CYVp68I9ju7hkJMVkulX7cmMYUa944wK51M052mZ5fbfd639',
  sellauthShopId: process.env.SELLAUTH_SHOP_ID || '147681',
  sellauthBaseUrl: process.env.SELLAUTH_BASE_URL || 'https://api.sellauth.com/v1',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '8679520572:AAHbqTwQ_cmmiFVkbC03FkEt1LhdA0Llgho',
  port: parseInt(process.env.PORT || '3000', 10),
  miniAppUrl: process.env.MINI_APP_URL || 'https://shop.tekaz.xyz',
  shopDomain: process.env.SHOP_DOMAIN || 'tekaz.xyz',
};
