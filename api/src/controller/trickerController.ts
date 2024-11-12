import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function get24hMetricsDetails(symbol: string) {
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Add debug logging
    console.log("Time range for metrics:", {
        now: now.toISOString(),
        startTime: startTime.toISOString(),
        symbol,
    });

    // First, let's check if we have any trades at all for this stock
    const totalTrades = await prisma.trade.count({
        where: {
            stock: {
                symbol: symbol, // Nested filter within the related `stock` model
            },
        },
    });

    console.log(`Total trades found for stockId ${symbol}: ${totalTrades}`);

    // 1. Get the latest price with debug logging
    const latestTrade = await prisma.trade.findFirst({
        where: {
            stock: {
                symbol: symbol, // Nested filter within the related `stock` model
            },
        },
        orderBy: { timestamp: "desc" },
    });

    console.log("Latest trade found:", latestTrade);

    // 2. Get all trades in the last 24 hours
    const tradesIn24h = await prisma.trade.findMany({
        where: {
            stock: {
                symbol: symbol, // Nested filter within the related `stock` model
            },
            timestamp: {
                gte: startTime,
                lte: now,
            },
        },
        orderBy: { timestamp: "asc" },
    });

    console.log(`Found ${tradesIn24h.length} trades in last 24 hours`);

    // If we have no trades in the last 24 hours, let's fetch the most recent trade before that
    let trade24hAgo = null;
    if (tradesIn24h.length > 0) {
        trade24hAgo = await prisma.trade.findFirst({
            where: {
                stock: {
                    symbol: symbol, // Nested filter within the related `stock` model
                },
                timestamp: { lt: startTime },
            },
            orderBy: { timestamp: "desc" },
        });
    }

    console.log("24h ago trade found:", trade24hAgo);

    // Calculate metrics only if we have trades
    let metrics: any = {
        latestPrice: null,
        price24hAgo: null,
        pointChange: 0,
        percentageChange: 0,
        high: null,
        low: null,
        numberOfTrades: tradesIn24h.length,
        lastTradeTime: latestTrade?.timestamp || null,
        volume24h: 0, // Add 24-hour volume metric
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
