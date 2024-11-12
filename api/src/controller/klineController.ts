import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//@ts-ignore
export const generateKlines = async (market, startTime, endTime, interval) => {
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
