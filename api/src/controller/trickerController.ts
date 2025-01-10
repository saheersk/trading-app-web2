import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function get24hMetricsDetails(symbol: string) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalTrades = await prisma.trade.count({
        where: {
            stock: {
                symbol: symbol,
            },
        },
    });

    const latestTrade = await prisma.trade.findFirst({
        where: {
            stock: {
                symbol: symbol,
            },
        },
        orderBy: { timestamp: "desc" },
    });

    const tradesIn24h = await prisma.trade.findMany({
        where: {
            stock: {
                symbol: symbol,
            },
            timestamp: {
                gte: startTime,
                lte: now,
            },
        },
        orderBy: { timestamp: "asc" },
    });

    let trade24hAgo: any = null;
    if (tradesIn24h.length > 0) {
        trade24hAgo = await prisma.trade.findFirst({
            where: {
                stock: {
                    symbol: symbol,
                },
                timestamp: { lt: startTime },
            },
            orderBy: { timestamp: "desc" },
        });
    }

    let metrics: any = {
        latestPrice: null,
        price24hAgo: null,
        pointChange: 0,
        percentageChange: 0,
        high: null,
        low: null,
        numberOfTrades: tradesIn24h.length,
        lastTradeTime: latestTrade?.timestamp || null,
        volume24h: 0
    };

    if (latestTrade) {
        metrics.latestPrice = Number(latestTrade.price);
    }

    if (trade24hAgo) {
        metrics.price24hAgo = Number(trade24hAgo.price);
    }

    if (tradesIn24h.length > 0) {
        // Calculate high, low, and total volume from trades in last 24h
        metrics.high = Number(Math.max(...tradesIn24h.map((t) => Number(t.price))));
        metrics.low = Number(Math.min(...tradesIn24h.map((t) => Number(t.price))));
        metrics.volume24h = tradesIn24h.reduce((acc, trade) => acc + Number(trade.volume), 0); // Total volume in last 24 hours

        // Calculate changes if both current and 24h ago prices exist
        if (metrics.latestPrice && metrics.price24hAgo) {
            metrics.pointChange = Number(metrics.latestPrice - metrics.price24hAgo);
            metrics.percentageChange = Number(((metrics.pointChange / metrics.price24hAgo) * 100).toFixed(2));
        }
    }
    
    return metrics;
}
