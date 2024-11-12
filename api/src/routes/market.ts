import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { get24hMetrics } from '../controller/marketController';

const prisma = new PrismaClient();
export const marketRouter = Router();


marketRouter.get("/", async (req: Request, res: Response) => {
    try {
        // Fetch all unique markets
        const markets = await prisma.stock.findMany({
            select: { market: true },
            distinct: ['market'],
        });

        // Initialize response object
        const response: any[] = [];

        // Fetch stocks and metrics for each market
        for (const { market } of markets) {
            const stocks = await prisma.stock.findMany({
                where: { market },
                select: { symbol: true, name: true },
            });

            const stocksWithMetrics = await Promise.all(
                stocks.map(async (stock) => {
                    const metrics = await get24hMetrics(stock.symbol);
                    return { symbol: stock.symbol, name: stock.name, metrics };
                })
            );

            response.push({ market, stocks: stocksWithMetrics });
        }

        res.json(response);
    } catch (error) {
        console.error("Error fetching markets and metrics:", error);
        res.status(500).json({ error: "An error occurred while fetching market data." });
    }
});
