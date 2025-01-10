import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//@ts-ignore
export const generateKlines = async (market, startTime, endTime, interval) => {
    const trades: any = await prisma.trade.findMany({
        where: {
            stock: {
                symbol: market, 
            },
        },
        orderBy: {
            timestamp: 'asc',
        },
    });

    const klineBuckets: any = new Map();

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

    const klines: any = Array.from(klineBuckets.values())
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

    return klines;
};
