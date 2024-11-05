import express, { application } from 'express';
import cors from 'cors';
import { orderRouter } from './routes/order';
import { depthRouter } from './routes/depth';
import { tradesRouter } from './routes/trades';
import { klineRouter } from './routes/kline';
import { tickersRouter } from './routes/ticker';


const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/trades", tradesRouter);
app.use("/api/v1/klines", klineRouter);
app.use("/api/v1/tickers", tickersRouter);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateRandomTrades(stockId: number, startDate: Date, endDate: Date) {
    // Define the number of trades per day
    const minTradesPerDay = 50; // Minimum number of trades per day
    const maxTradesPerDay = 200; // Maximum number of trades per day

    // Define price range and volume range for trades
    const minPrice = 1400; // Minimum price of the stock
    const maxPrice = 1600; // Maximum price of the stock
    const minVolume = 100; // Minimum volume per trade
    const maxVolume = 500; // Maximum volume per trade

    const trades = [];

    // Generate data for each day within the date range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        // Randomize the number of trades for the current day
        const tradesForDay = Math.floor(Math.random() * (maxTradesPerDay - minTradesPerDay + 1)) + minTradesPerDay;

        // Generate each trade for the current day
        for (let i = 0; i < tradesForDay; i++) {
            // Randomize the time within the day
            const tradeTime = new Date(
                currentDate.getTime() +
                Math.floor(Math.random() * (24 * 60 * 60 * 1000)) // Random time within the day in milliseconds
            );

            // Generate random price and volume
            const price = parseFloat((Math.random() * (maxPrice - minPrice) + minPrice).toFixed(2));
            const volume = parseFloat((Math.random() * (maxVolume - minVolume) + minVolume).toFixed(2));

            // Add the trade to the list
            trades.push({
                stockId: stockId,
                price: price,
                volume: volume,
                timestamp: tradeTime,
            });
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert all trades into the database
    await prisma.trade.createMany({
        data: trades,
    });

    console.log(`Inserted ${trades.length} trades for stock ID ${stockId}`);
}

const stockId = 1; // ID of the stock in the database
const startDate = new Date("2024-10-01"); // Start date of the data
const endDate = new Date("2024-10-31"); // End date of the data

// Run the data generation
generateRandomTrades(stockId, startDate, endDate)
    .then(() => {
        console.log("Random trade data generation completed");
        prisma.$disconnect();
    })
    .catch((error) => {
        console.error("Error generating trade data:", error);
        prisma.$disconnect();
    });

// async function createStock() {
//     const tataStock = await prisma.stock.create({
//         data: {
//             symbol: "TATA",
//             name: "Tata Group",
//             market: "NSE",
//             industry: "Diversified",
//             outstandingShares: 5000000, // Example value
//         },
//     });
//     console.log('Created Stock:', tataStock);
// }

// createStock()
//     .catch(e => console.error(e))
//     .finally(async () => await prisma.$disconnect());

    // @ts-ignore
    // async function generateRandomTrades(stockId) {
    //     const startDate = new Date();
    //     const endDate = new Date();
    //     endDate.setMonth(endDate.getMonth() + 3); // 3 months from now
    
    //     const basePrice = 1500; // Example base price for TATA stock
    //     const tradeCount = 500; // Number of trades to generate
    // //@ts-ignore

    //     const tradeInterval = (endDate - startDate) / tradeCount; // Time interval between trades
    
    //     for (let i = 0; i < tradeCount; i++) {
    //         const tradeTime = new Date(startDate.getTime() + i * tradeInterval);
    //         const priceFluctuation = (Math.random() - 0.5) * 20; // Random fluctuation up to 20
    //         const price = Math.max(0, basePrice + priceFluctuation); // Ensure price doesn't go below 0
    //         const volume = Math.random() * 1000 + 1; // Random volume between 1 and 1000
    
    //         await prisma.trade.create({
    //             data: {
    //                 stockId,
    //                 price,
    //                 volume,
    //                 timestamp: tradeTime,
    //             },
    //         });
    //     }
    
    //     console.log(`Generated ${tradeCount} trades for stock ID ${stockId}`);
    // }
    
    // async function main() {
    //     // Create TATA stock first
    //     const tataStock = await prisma.stock.findUnique({
    //         where: { symbol: "TATA" },
    //     });
    
    //     if (tataStock) {
    //         await generateRandomTrades(tataStock.id);
    //     } else {
    //         console.log('Stock TATA not found.');
    //     }
    // }
    
    // main()
    //     .catch(e => console.error(e))
    //     .finally(async () => await prisma.$disconnect());

    // async function generateRandomTrades(stockId) {
    //     // Generate trades from 3 months ago to now (instead of now to 3 months future)
    //     const endDate = new Date();
    //     const startDate = new Date();
    //     startDate.setMonth(startDate.getMonth() - 3); // 3 months ago
    
    //     console.log("Generating trades between:", {
    //         startDate: startDate.toISOString(),
    //         endDate: endDate.toISOString()
    //     });
    
    //     const tradeCount = 500;
    //     const tradeInterval = (endDate.getTime() - startDate.getTime()) / tradeCount;
    //     const basePrice = 1500;
    
    //     const trades = [];
    //     for (let i = 0; i < tradeCount; i++) {
    //         const tradeTime = new Date(startDate.getTime() + i * tradeInterval);
    //         const priceFluctuation = (Math.random() - 0.5) * 20;
    //         const price = Math.max(0, basePrice + priceFluctuation);
    //         const volume = Math.random() * 1000 + 1;
    
    //         trades.push({
    //             stockId,
    //             price,
    //             volume,
    //             timestamp: tradeTime,
    //         });
    //     }
    
    //     // Batch insert trades for better performance
    //     await prisma.trade.createMany({
    //         data: trades
    //     });
    
    //     console.log(`Generated ${tradeCount} trades for stock ID ${stockId} between:`, {
    //         firstTradeTime: trades[0].timestamp,
    //         lastTradeTime: trades[trades.length - 1].timestamp
    //     });
    // }
    
    // async function main() {
    //     try {
    //         // First, clear existing trades for clean data
    //         await prisma.trade.deleteMany({
    //             where: { stockId: 1 } // Assuming TATA stock has ID 1
    //         });
    
    //         // Create TATA stock first
    //         const tataStock = await prisma.stock.findUnique({
    //             where: { symbol: "TATA" },
    //         });
    
    //         if (tataStock) {
    //             await generateRandomTrades(tataStock.id);
                
    //             // Verify the data after generation
    //             const trades = await prisma.trade.findMany({
    //                 where: { stockId: tataStock.id },
    //                 orderBy: { timestamp: 'asc' },
    //                 take: 5
    //             });
    
    //             console.log("Sample of generated trades:", trades);
    //         } else {
    //             console.log('Stock TATA not found.');
    //         }
    //     } catch (error) {
    //         console.error("Error generating trades:", error);
    //     }
    // }
    
    // main()
    //     .catch(e => console.error(e))
    //     .finally(async () => await prisma.$disconnect());

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});