import fs from "fs";
import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE, TRADE_ADDED } from "../types/index";
import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, GET_TRADE, MessageFromApi, ON_RAMP } from "../types/fromApi";
import { Fill, FillsWithTimestamp, Order, Orderbook } from "./Orderbook";


export const BASE_CURRENCY = "INR";

interface UserBalance {
    [key: string]: {
        available: number;
        locked: number;
    }
}

// interface TickerData {
//     symbol: string;
//     lastPrice: number;
//     priceChange: number;
//     priceChangePercent: number;
//     volume: number;
//     openPrice: number;
//     highPrice: number;
//     lowPrice: number;
// }

// interface Trade {
//     id: number;
//     isBuyerMaker: boolean;
//     price: string;
//     quantity: string;
//     quoteQuantity: string;
//     timestamp: number;
// }


export class Engine {
    private orderBooks: Orderbook[] = [];
    private balances: Map<string, UserBalance> = new Map();
    // private trades: Map<string, Trade[]> = new Map();

    constructor() {
        let snapshot = null;
        try {
            if (process.env.WITH_SNAPSHOT){
                snapshot = fs.readFileSync("./snapshot.json");
            }
        } catch (e) {
            console.log("No snapshot found");
        }

        if (snapshot) {
            const snapshotSnapshot = JSON.parse(snapshot.toString());
            this.orderBooks = snapshotSnapshot.orderBooks.map((o: any) => new Orderbook(o.baseAssets, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.balances = new Map(snapshotSnapshot.balances);
        } else {
            this.orderBooks = [new Orderbook(`TATA`, [], [], 0, 0)];
            this.setBaseBalances();
        }
        setInterval(() => {
            this.saveSnapshot();
        }, 1000 * 3);
    }

    saveSnapshot() {
        const snapshotSnapshot = {
            orderBooks: this.orderBooks.map(o => o.getSnapshot()),
            balances: Array.from(this.balances.entries())
        }
        fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
    }

    process({ message, clientId }: {message: MessageFromApi, clientId: string}) {
        switch (message.type) {
            case CREATE_ORDER:
                try {
                    const { executedQty, fills, orderId } = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    });
                } catch (e) {
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });
                }
                break;
            case CANCEL_ORDER:
                try {
                    const orderId = message.data.orderId;
                    const cancelMarket = message.data.market;
                    const cancelOrderbook = this.orderBooks.find(o => o.ticker() === cancelMarket);
                    const quoteAsset = cancelMarket.split("_")[1];
                    if (!cancelOrderbook) {
                        throw new Error("No orderbook found");
                    }

                    const order = cancelOrderbook.asks.find(o => o.orderId === orderId) || cancelOrderbook.bids.find(o => o.orderId === orderId);
                    if (!order) {
                        console.log("No order found");
                        throw new Error("No order found");
                    }

                    if (order.side === "buy") {
                        const price = cancelOrderbook.cancelBid(order)
                        const leftQuantity = (order.quantity - order.filled) * order.price;
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    } else {
                        const price = cancelOrderbook.cancelAsk(order)
                        const leftQuantity = order.quantity - order.filled;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].locked -= leftQuantity;
                        if (price) {
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket);
                        }
                    }

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId,
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });
                    
                } catch (e) {
                    console.log("Error while cancelling order", );
                    console.log(e);
                }
                break;
            case GET_OPEN_ORDERS:
                try {
                    const openOrderbook = this.orderBooks.find(o => o.ticker() === message.data.market);
                    if (!openOrderbook) {
                        throw new Error("No orderbook found");
                    }
                    const openOrders = openOrderbook.getOpenOrders(message.data.userId);

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "OPEN_ORDERS",
                        payload: openOrders
                    }); 
                } catch(e) {
                    console.log(e);
                }
                break;
            case ON_RAMP:
                const userId = message.data.userId;
                const amount = Number(message.data.amount);
                this.onRamp(userId, amount);
                break;
            case GET_DEPTH:
                try {
                    const market = message.data.market;
                    const orderbook = this.orderBooks.find(o => o.ticker() === market);
                    if (!orderbook) {
                        throw new Error("No orderbook found");
                    }
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    });
                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: []
                        }
                    });
                }
                break;
            case GET_TRADE:
                try {
                    const market = message.data.market;
                    const orderbook = this.orderBooks.find(o => o.ticker() === market);
                    if (!orderbook) {
                        throw new Error("No orderbook found");
                    }
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "TRADE",
                        payload: orderbook.getDepth()
                    });
                } catch (e) {
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "TRADE",
                        payload: {
                            symbol: "",
                            price: 0,
                            volume: 0,
                            timestamp: 0,
                            side: 0
                        }
                    });
                }
                break;
        }
    }

    // addTrade(market: string, isBuyerMaker: boolean, price: string, quantity: string, quoteQuantity: string) {
    //     const tradeId = Date.now(); // Unique ID based on timestamp (or implement a more robust ID generation)
    //     const trade: Trade = {
    //         id: tradeId,
    //         isBuyerMaker,
    //         price,
    //         quantity,
    //         quoteQuantity,
    //         timestamp: Date.now(),
    //     };
    
    //     // Retrieve or initialize the market trades
    //     if (!this.trades.has(market)) {
    //         this.trades.set(market, []);
    //     }
    //     this.trades.get(market)!.push(trade); // Add the trade to the corresponding market
    // }
    
    // getTradesByMarket(market: string): Trade[] {
    //     return this.trades.get(market) || [];
    // }
    

    addOrderbook(orderbook: Orderbook) {
        this.orderBooks.push(orderbook);
    }

    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        let orderbook = this.orderBooks.find(o => o.ticker() === market)
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];

        if (!orderbook) {
            const newOrderbook = new Orderbook(baseAsset, [], [], 0, 0);
            this.addOrderbook(newOrderbook);  
            orderbook = this.orderBooks.find(o => o.ticker() === market);
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, quoteAsset, price, quantity);

        const order: Order = {
            price: Number(price),
            // price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        }
        
        const { fills, executedQty } = orderbook ? orderbook.addOrder(order) : {fills: [], executedQty: 0};

        console.log(fills, "========fills========");
        // Add timestamp to each fill
        const timestamp = new Date().toISOString();
        const fillsWithTimestamp = fills.map(fill => ({
            ...fill,
            timestamp
        }));

        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);

        this.createDbTrades(fills, market, userId, side);
        this.updateDbOrders(order, executedQty, fills, market, userId);
        this.publishWsDepthUpdates(fills, price, side, market);
        this.publishWsTrades(fillsWithTimestamp, userId, market, baseAsset, side);
        this.publishTickerUpdate(market, price, fills);
        // this.publishWsTicker()
        
        return { executedQty, fills, orderId: order.orderId };
    }

    publishWsTicker(market: string, price: string, quantity: string) {
        
    }
    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string, userId: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side,
                // userId: userId
            }
        });

        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.markerOrderId,
                    executedQty: fill.qty
                }
            });
        });
    }

    createDbTrades(fills: Fill[], market: string, userId: string, side: any) {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    market: market,
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId === userId, // TODO: Is this right?
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    //@ts-ignore
                    side: side,
                    timestamp: Date.now()
                }
            });
        });
    }

    private publishTickerUpdate(market: string, latestPrice: string, fills: Fill[]) {
        const latestTradePrice = Number(latestPrice);

        if (!fills || fills.length === 0) {
            console.error("Error: Fills array is empty or undefined.");
            return;
        }
    
        if (!fills.every(fill => fill && fill.price && fill.qty)) {
            console.error("Error: Fills array contains invalid elements.");
            return;
        }
        
        const totalTradedVolume = fills.reduce((acc, fill) => acc + fill.qty, 0);
        
        const highPrice = Math.max(...fills.map(fill => Number(fill.price)));
        const lowPrice = Math.min(...fills.map(fill => Number(fill.price)));
    
        const tickerData = {
            c: latestTradePrice,
            v: totalTradedVolume,
            h: highPrice,
            l: lowPrice,
            poc: latestTradePrice - Number(fills[0].price),
            pc: ((latestTradePrice - Number(fills[0].price)) / Number(fills[0].price)) * 100, 
        };
    
        RedisManager.getInstance().publishMessage(`ticker@${market}`, {
            stream: `ticker@${market}`,
            data: {
                e: "ticker",
                //@ts-ignore
                s: market.split('_')[0],
                ...tickerData,
            },
        });
    }
    

    publishWsTrades(fills: FillsWithTimestamp[], userId: string, market: string, baseAsset: string, side: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().publishMessage(`trade@${market}`, {
                stream: `trade@${market}`,
                data: {
                    e: "trade",
                    i: fill.tradeId,
                    m: fill.otherUserId === userId, // TODO: Is this right?
                    p: Number(fill.price),
                    q: Number(fill.qty),
                    s: baseAsset,
                    t: fill.timestamp,
                    ts: side.toUpperCase()
                }
            });
        });
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderBooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const updatedBids = depth?.bids.filter(x => x[0] === price);
        const updatedAsks = depth?.asks.filter(x => x[0] === price);
        
        RedisManager.getInstance().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: updatedAsks.length ? updatedAsks : [[price, "0"]],
                b: updatedBids.length ? updatedBids : [[price, "0"]],
                e: "depth"
            }
        });
    }

    publishWsDepthUpdates(fills: Fill[], price: string, side: "buy" | "sell", market: string) {
        const orderbook = this.orderBooks.find(o => o.ticker() === market);
        if (!orderbook) {
            console.log("No orderbook found for market:", market);
            return;
        }
    
        const depth = orderbook.getDepth();

        if (side === "buy") {
            const updatedAsks = depth?.asks.filter(x => 
                fills.some(f => Number(f.price) === Number(x[0]))
            );
            const updatedBid = depth?.bids.find(x => Number(x[0]) === Number(price));
    
            // RedisManager.getInstance().publishMessage(`depth@${market}`, {
            //     stream: `depth@${market}`,
            //     data: {
            //         a: updatedAsks || [],
            //         b: updatedBid ? [updatedBid] : [],
            //         e: "depth"
            //     }
            // });

            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: depth?.asks || [],
                    b: depth?.bids ? depth?.bids : [],
                    e: "depth"
                }
            });
        }
    
        if (side === "sell") {
            const updatedBids = depth?.bids.filter(x =>
                fills.some(f => Number(f.price) === Number(x[0]))
            );
            const updatedAsk = depth?.asks.find(x => Number(x[0]) === Number(price));
    
            // RedisManager.getInstance().publishMessage(`depth@${market}`, {
            //     stream: `depth@${market}`,
            //     data: {
            //         a: updatedAsk ? [updatedAsk] : [],
            //         b: updatedBids || [],
            //         e: "depth"
            //     }
            // });
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: depth?.asks ? depth?.asks : [],
                    b: depth?.bids || [],
                    e: "depth"
                }
            });
        }
    }
    
    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy" | "sell", fills: Fill[], executedQty: number) {
        if (side === "buy") {
            fills.forEach(fill => {
                // Update quote asset balance
                //@ts-ignore
                this.balances.get(fill.otherUserId)[quoteAsset].available = this.balances.get(fill.otherUserId)?.[quoteAsset].available + (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked - (fill.qty * fill.price);

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].locked = this.balances.get(fill.otherUserId)?.[baseAsset].locked - fill.qty;

                //@ts-ignore
                this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available + fill.qty;

            });
            
        } else {
            fills.forEach(fill => {
                // Update quote asset balance
                //@ts-ignore
                this.balances.get(fill.otherUserId)[quoteAsset].locked = this.balances.get(fill.otherUserId)?.[quoteAsset].locked - (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available + (fill.qty * fill.price);

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].available = this.balances.get(fill.otherUserId)?.[baseAsset].available + fill.qty;

                //@ts-ignore
                this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked - (fill.qty);

            });
        }
    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, asset: string, price: string, quantity: string) {
        if (side === "buy") {
            if ((this.balances.get(userId)?.[quoteAsset]?.available || 0) < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available - (Number(quantity) * Number(price));
            
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked + (Number(quantity) * Number(price));
        } else {
            if ((this.balances.get(userId)?.[baseAsset]?.available || 0) < Number(quantity)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available - (Number(quantity));
            
            //@ts-ignore
            this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked + Number(quantity);
        }
    }

    onRamp(userId: string, amount: number) {
        const userBalance = this.balances.get(userId);
        if (!userBalance) {
            this.balances.set(userId, {
                [BASE_CURRENCY]: {
                    available: amount,
                    locked: 0
                }
            });
        } else {
            userBalance[BASE_CURRENCY].available += amount;
        }
    }

    setBaseBalances() {
        this.balances.set("1", {
            [BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });

        this.balances.set("2", {
            [BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });

        this.balances.set("5", {
            [BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
    }
}