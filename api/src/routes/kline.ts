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

//@ts-ignore
const generateKlines = async (market, startTime, endTime, interval) => {
    // Parse the timestamps
    const startDate = new Date(Number(startTime));
    const endDate = new Date(Number(endTime));

    // Add debug logging for time range
    console.log("Querying time range:", {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        interval: `${interval/1000} seconds`
    });

    // Now fetch the trades within time range
    const trades = await prisma.trade.findMany({
        where: {
            stock: {
                symbol: market, // Nested filter within the related `stock` model
            },
        },
        orderBy: {
            timestamp: 'asc',
        },
    });

    console.log(`Retrieved ${trades.length} trades`);

    // Log the time range of retrieved data
    if (trades.length > 0) {
        console.log("Data time range:", {
            firstTrade: trades[0].timestamp,
            lastTrade: trades[trades.length - 1].timestamp,
        });
    }

    // Group trades into buckets
    const klineBuckets = new Map();

    trades.forEach((trade) => {
        const tradeTime = new Date(trade.timestamp);
        const bucketStartTime = Math.floor(tradeTime.getTime() / interval) * interval;
        
        if (!klineBuckets.has(bucketStartTime)) {
            klineBuckets.set(bucketStartTime, {
                timestamp: bucketStartTime,
                open: Number(trade.price),
                high: Number(trade.price),
                low: Number(trade.price),
                close: Number(trade.price),
                volume: Number(trade.volume),
                trades: 1
            });
        } else {
            const bucket = klineBuckets.get(bucketStartTime);
            bucket.high = Math.max(bucket.high, Number(trade.price));
            bucket.low = Math.min(bucket.low, Number(trade.price));
            bucket.close = Number(trade.price);
            bucket.volume += Number(trade.volume);
            bucket.trades += 1;
        }
    });

    // Convert Map to array and sort by timestamp
    const klines = Array.from(klineBuckets.values())
        .sort((a, b) => a.timestamp - b.timestamp);

    console.log(`Generated ${klines.length} klines`);
    
    // Log sample of first few klines for verification
    // if (klines.length > 0) {
    //     console.log("Sample klines:", {
    //         first: klines[0],
    //         last: klines[klines.length - 1],
    //         totalBuckets: klines.length
    //     });
    // }

    return klines;
};

// Router implementation with improved error handling
klineRouter.get("/", async (req, res) => {
    const { market, interval, startTime, endTime }: any = req.query;

    const symbol = market.split("_")[0];

    const bucketMap: any = {
        "1m": 60 * 1000,
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "30m": 30 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "4h": 4 * 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
    };

    try {
        // Input validation
        if (!symbol) {
            throw new Error("Market is required");
        }
        //@ts-ignore
        if (!interval || !bucketMap[interval]) {
            throw new Error(`Invalid interval. Valid intervals are: ${Object.keys(bucketMap).join(', ')}`);
        }

        if (!startTime || !endTime) {
            throw new Error("startTime and endTime are required");
        }
        //@ts-ignore
        const intervalMs = bucketMap[interval];
        const klines = await generateKlines(symbol.toString(), startTime, endTime, intervalMs);

        // Send response with metadata
        res.status(200).json({
            success: true,
            data: {
                klines,
                metadata: {
                    symbol,
                    interval,
                    startTime: new Date(Number(startTime)).toISOString(),
                    endTime: new Date(Number(endTime)).toISOString(),
                    totalKlines: klines.length
                }
            }
        });
    } catch (err: any) {
        console.error("Error generating klines:", err);
        res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});