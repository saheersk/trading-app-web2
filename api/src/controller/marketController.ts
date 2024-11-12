import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to calculate 24-hour metrics for a specific stock symbol
export async function get24hMetrics(symbol: string) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const totalTrades = await prisma.trade.count({
        where: { stock: { symbol: symbol } },
    });

    const latestTrade = await prisma.trade.findFirst({
        where: { stock: { symbol: symbol } },
        orderBy: { timestamp: "desc" },
    });

    const tradesIn24h = await prisma.trade.findMany({
        where: {
            stock: { symbol: symbol },
            timestamp: { gte: startTime, lte: now },
        },
        orderBy: { timestamp: "asc" },
    });

    let trade24hAgo = null;
    if (tradesIn24h.length > 0) {
        trade24hAgo = await prisma.trade.findFirst({
            where: { stock: { symbol: symbol }, timestamp: { lt: startTime } },
            orderBy: { timestamp: "desc" },
        });
    }

    let metrics = {
        latestPrice: latestTrade?.price || null,
        price24hAgo: trade24hAgo?.price || null,
        pointChange: 0,
        percentageChange: 0,
        high: null,
        low: null,
        numberOfTrades: tradesIn24h.length,
        lastTradeTime: latestTrade?.timestamp || null,
        volume24h: 0,
    };

    if (metrics.latestPrice && metrics.price24hAgo) {
        metrics.pointChange = metrics.latestPrice - metrics.price24hAgo;
        //@ts-ignore
        metrics.percentageChange = ((metrics.pointChange / metrics.price24hAgo) * 100).toFixed(2);
    }

    if (tradesIn24h.length > 0) {
        //@ts-ignore

        metrics.high = Math.max(...tradesIn24h.map((t) => t.price));
        //@ts-ignore

        metrics.low = Math.min(...tradesIn24h.map((t) => t.price));
        metrics.volume24h = tradesIn24h.reduce((acc, trade) => acc + trade.volume, 0);
    }

    return metrics;
}
