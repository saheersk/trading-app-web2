import { Router } from "express";

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
    const { market } = req.query;

    res.status(200).json({});
});