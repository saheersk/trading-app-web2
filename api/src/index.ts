import express from 'express';
import cors from 'cors';
import { orderRouter } from './routes/order';
import { depthRouter } from './routes/depth';
import { tradesRouter } from './routes/trades';
import { klineRouter } from './routes/kline';
import { tickersRouter } from './routes/ticker';
import { marketRouter } from './routes/market';


const app = express();
app.options("*", cors());
app.use(cors());
app.use(express.json());


app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/trades", tradesRouter);
app.use("/api/v1/k-lines", klineRouter);
app.use("/api/v1/tickers", tickersRouter);
app.use("/api/v1/markets", marketRouter);


// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();

// enum Side {
//     BUY = "BUY",
//     SELL = "SELL",
// }

// // Function to generate realistic trade data over one year (1-hour intervals)
// //@ts-ignore
// async function generateHourlyTrades(stockId, startDate, endDate) {
//     const trades: any = [];
//     const minPrice = 100;
//     const maxPrice = 1000;
//     const minVolume = 10;
//     const maxVolume = 1000;
//     const tradeCount = 50 * 24 * 365;  // 1 trade every hour for 1 year (365 days)
//     const basePrice = 500; // Starting base price for the stock
//     let currentPrice = basePrice;
//     const tradeInterval = (endDate - startDate) / tradeCount;

//     for (let i = 0; i < tradeCount; i++) {
//         const tradeTime = new Date(startDate.getTime() + i * tradeInterval);

//         // Simulate price fluctuation (random fluctuation up to ±20 per hour)
//         const randomFluctuation = (Math.random() - 0.5) * 20; // Fluctuation up to ±10
//         currentPrice += randomFluctuation;

//         // Ensure the price stays within the specified range
//         currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice));

//         // Randomize volume within the specified range
//         const volume = Math.floor(Math.random() * (maxVolume - minVolume) + minVolume);

//         // Randomize buy/sell side
//         const side = Math.random() < 0.5 ? Side.BUY : Side.SELL;

//         // Create trade data
//         trades.push({
//             stockId: stockId,
//             price: parseFloat(currentPrice.toFixed(2)),
//             volume: volume,
//             timestamp: tradeTime,
//             side: side,
//         });
//     }

//     // Insert trades into the database
//     await prisma.trade.createMany({
//         data: trades,
//     });

//     console.log(`Generated ${tradeCount} trades for stock ID ${stockId}`);
// }

// // Main function to create the stock if it doesn't exist and generate trades
// async function main() {
//     let tataStock = await prisma.stock.findUnique({
//         where: { symbol: "HDFC" },
//     });

//     if (!tataStock) {
//         tataStock = await prisma.stock.create({
//             data: {
//                 symbol: "HDFC",
//                 name: "HDFC Bank",
//                 market: "NSE",
//                 industry: "Banking",
//                 outstandingShares: 6000000,
//             },
//         });
//         console.log('Created Stock:', tataStock);
//     }

//     const startDate = new Date();
//     startDate.setFullYear(startDate.getFullYear() - 1); // Start date set to one year ago
//     const endDate = new Date(); // End date as today

//     await generateHourlyTrades(tataStock.id, startDate, endDate);
// }

// main()
//     .catch((error) => {
//         console.error("Error:", error);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});