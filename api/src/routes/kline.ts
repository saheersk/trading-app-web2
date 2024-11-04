import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
export const klineRouter = Router();

// klineRouter.get("/", async (req: any, res: any) => {
//     const { market, interval, startTime, endTime } = req.query;

//     const bucketMap: Record<string, string> = {
//         "1m": "1 minute",
//         "1h": "1 hour",
//         "1w": "1 week",
//     };

//     const bucketInterval = bucketMap[interval as string];
//     if (!bucketInterval || !market) {
//         return res.status(400).send('Invalid interval or missing market');
//     }

//     const startDate = new Date(parseInt(startTime as string, 10) * 1000);
//     const endDate = new Date(parseInt(endTime as string, 10) * 1000);

//     try {
//         const result = await prisma.klines.findMany({
//             where: {
//                 market: market as string,
//                 bucket: {
//                     gte: startDate,
//                     lte: endDate,
//                 },
//             },
//             orderBy: {
//                 bucket: 'asc',
//             },
//         });

//         const formattedResult = result.map((x: any) => ({
//             close: x.close,
//             end: x.bucket,
//             high: x.high,
//             low: x.low,
//             open: x.open,
//             quoteVolume: x.quoteVolume,
//             start: x.start,
//             trades: x.trades,
//             volume: x.volume,
//         }));

//         res.status(200).json(formattedResult);
//     } catch (err) {
//         console.error("Error fetching klines data:", err);
//         res.status(500).send({ error: "Internal server error" });
//     }
// });

async function generateKlines(market: any, startTime: any, endTime: any, interval: any) {
    // Convert to Date objects
    const startDate = new Date(parseInt(startTime) * 1000);
    const endDate = new Date(parseInt(endTime) * 1000);

    // Fetch raw trade data within the time range
    // @ts-ignore
    const trades = await prisma.trade.findMany({
        where: {
            market: market,
            timestamp: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: {
            timestamp: 'asc',
        },
    });

    // Aggregate trades into Klines
    const klines = [];
    let currentBucket: any = null;
    let open: any = null;
    let high = -Infinity;
    let low = Infinity;
    let close: any = null;
    let volume = 0;
    let startBucketTime = null;

    trades.forEach((trade: any) => {
        const tradeTime = trade.timestamp;

        // Determine the bucket time
        const bucketTime = new Date(Math.floor(tradeTime.getTime() / interval) * interval);
        
        if (!currentBucket || bucketTime > currentBucket) {
            // If we are moving to a new bucket, save the previous one
            if (currentBucket) {
                klines.push({
                    bucket: currentBucket,
                    open,
                    high,
                    low,
                    close,
                    volume,
                });
            }

            // Reset for the new bucket
            currentBucket = bucketTime;
            open = trade.price;
            high = trade.price;
            low = trade.price;
            close = trade.price;
            volume = trade.volume;
            startBucketTime = trade.timestamp;
        } else {
            // Update current bucket values
            high = Math.max(high, trade.price);
            low = Math.min(low, trade.price);
            close = trade.price;
            volume += trade.volume;
        }
    });

    // Push the last bucket if it exists
    if (currentBucket) {
        klines.push({
            bucket: currentBucket,
            open,
            high,
            low,
            close,
            volume,
        });
    }

    return klines;
}


klineRouter.get("/", async (req: any, res: any) => {
    const { market, interval, startTime, endTime } = req.query;

    const bucketMap: Record<string, number> = {
        "1m": 60 * 1000, // 1 minute in milliseconds
        "1h": 60 * 60 * 1000, // 1 hour in milliseconds
        "1w": 60 * 60 * 1000 * 24 * 7, // 1 week in milliseconds
    };

    const intervalMs = bucketMap[interval as string];
    if (!intervalMs || !market) {
        return res.status(400).send('Invalid interval or missing market');
    }

    try {
        const klines = await generateKlines(market as string, startTime, endTime, intervalMs);
        res.status(200).json(klines);
    } catch (err) {
        console.error("Error generating klines data:", err);
        res.status(500).send({ error: "Internal server error" });
    }
});
