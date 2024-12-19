import { BASE_CURRENCY } from "./Engine";


export interface Order {
    price: number;
    // price: string;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
    // quoteQuantity: string; // Add this line to include quoteQuantity
}

export interface FillsWithTimestamp {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
    timestamp: any;
    // quoteQuantity: string; // Add this line to include quoteQuantity
}

export class Orderbook {
    bids: Order[];
    asks: Order[];
    baseAssets: string;
    quoteAssets: string = BASE_CURRENCY;
    lastTradeId: number;
    currentPrice: number;

    constructor(baseAssets: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number) {
        this.bids = bids;
        this.asks = asks;
        this.baseAssets = baseAssets;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice || 0;
    }

    ticker() {
        return `${this.baseAssets}_${this.quoteAssets}`;
    }

    getSnapshot() {
        return {
            baseAssets: this.baseAssets,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }

    addOrder(order: Order): {
        executedQty: number,
        fills: Fill[]
    } {
        if(order.side === "buy") {
            const { executedQty, fills } = this.matchBid(order);
            order.filled = executedQty;

            if(executedQty === order.quantity){
                return {
                    executedQty,
                    fills
                }
            }
            this.bids.push(order);
            return {
                executedQty,
                fills
            }
        } else {
            const { executedQty, fills } = this.matchAsk(order);
            order.filled = executedQty;
            
            if(executedQty === order.quantity){
                return {
                    executedQty,
                    fills
                }
            }
            this.asks.push(order);
            return {
                executedQty,
                fills
            }
        }
    }

    // addOrder(order: Order): {
    //     executedQty: number,
    //     fills: Fill[]
    // } {
    //     if (order.side === "buy") {
    //         const { executedQty, fills } = this.matchBid(order);
    //         order.filled = executedQty;
    
    //         // Calculate the quoteQuantity for each fill
    //         fills.forEach(fill => {
    //             fill.quoteQuantity = (parseFloat(fill.price) * fill.qty).toString(); // Calculate quoteQuantity
    //         });
    
    //         if (executedQty === order.quantity) {
    //             return {
    //                 executedQty,
    //                 fills
    //             }
    //         }
    //         this.bids.push(order);
    //         return {
    //             executedQty,
    //             fills
    //         }
    //     } else {
    //         const { executedQty, fills } = this.matchAsk(order);
    //         order.filled = executedQty;
            
    //         // Calculate the quoteQuantity for each fill
    //         fills.forEach(fill => {
    //             fill.quoteQuantity = (parseFloat(fill.price) * fill.qty).toString(); // Calculate quoteQuantity
    //         });
    
    //         if (executedQty === order.quantity) {
    //             return {
    //                 executedQty,
    //                 fills
    //             }
    //         }
    //         this.asks.push(order);
    //         return {
    //             executedQty,
    //             fills
    //         }
    //     }
    // }
    
    // matchBid(order: Order): { fills: Fill[], executedQty: number } {
    //     const fills: Fill[] = [];
    //     let executedQty = 0;
    
    //     for (let i = 0; i < this.asks.length; i++) {
    //         if (this.asks[i].price <= order.price && executedQty < order.quantity) {
    //             const filledQty = Math.min((order.quantity - executedQty), this.asks[i].quantity);
    //             executedQty += filledQty;
    //             this.asks[i].filled += filledQty;
    
    //             // Calculate quoteQuantity
    //             const quoteQuantity = (this.asks[i].price * filledQty).toString();
    //             // const quoteQuantity = (parseFloat(this.asks[i].price) * filledQty).toString();
    
    //             fills.push({
    //                 price: this.asks[i].price.toString(),
    //                 qty: filledQty,
    //                 tradeId: this.lastTradeId++,
    //                 otherUserId: this.asks[i].userId,
    //                 markerOrderId: this.asks[i].orderId,
    //                 quoteQuantity // Add the quoteQuantity to the fill
    //             });
    //         }
    //     }
        
    //     // Remove fully filled asks
    //     for (let i = 0; i < this.asks.length; i++) {
    //         if (this.asks[i].filled === this.asks[i].quantity) {
    //             this.asks.splice(i, 1);
    //             i--;
    //         }
    //     }
        
    //     return {
    //         fills,
    //         executedQty
    //     };
    // }
    
    // matchAsk(order: Order): { fills: Fill[], executedQty: number } {
    //     const fills: Fill[] = [];
    //     let executedQty = 0;
    
    //     for (let i = 0; i < this.bids.length; i++) {
    //         if (this.bids[i].price >= order.price && executedQty < order.quantity) {
    //             const filledQty = Math.min(order.quantity - executedQty, this.bids[i].quantity);
    //             executedQty += filledQty;
    //             this.bids[i].filled += filledQty;
    
    //             // Calculate quoteQuantity
    //             const quoteQuantity = (parseFloat(this.bids[i].price) * filledQty).toString();
    //             const quoteQuantity = (parseFloat(this.bids[i].price) * filledQty).toString();
    
    //             fills.push({
    //                 price: this.bids[i].price.toString(),
    //                 qty: filledQty,
    //                 tradeId: this.lastTradeId++,
    //                 otherUserId: this.bids[i].userId,
    //                 markerOrderId: this.bids[i].orderId,
    //                 quoteQuantity // Add the quoteQuantity to the fill
    //             });
    //         }
    //     }
    
    //     // Remove fully filled bids
    //     for (let i = 0; i < this.bids.length; i++) {
    //         if (this.bids[i].filled === this.bids[i].quantity) {
    //             this.bids.splice(i, 1);
    //             i--;
    //         }
    //     }
        
    //     return {
    //         fills,
    //         executedQty
    //     };
    // }
    
    matchBid(order: Order): { fills:  Fill[], executedQty: number } {
        const fills: Fill[] = [];
        let executedQty = 0;

        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].price <= order.price && executedQty < order.quantity) {
                const filledQty = Math.min((order.quantity - executedQty), this.asks[i].quantity);
                executedQty += filledQty;
                this.asks[i].filled += filledQty;
                fills.push({
                    price: this.asks[i].price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.asks[i].userId,
                    markerOrderId: this.asks[i].orderId
                });
            }
        }
        for (let i = 0; i < this.asks.length; i++) {
            if (this.asks[i].filled === this.asks[i].quantity) {
                this.asks.splice(i, 1);
                i--;
            }
        }
        return {
            fills,
            executedQty
        };
    }

    matchAsk(order: Order): {fills: Fill[], executedQty: number} {
        const fills: Fill[] = [];
        let executedQty = 0;
        
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].price >= order.price && executedQty < order.quantity) {
                const amountRemaining = Math.min(order.quantity - executedQty, this.bids[i].quantity);
                executedQty += amountRemaining;
                this.bids[i].filled += amountRemaining;
                fills.push({
                    price: this.bids[i].price.toString(),
                    qty: amountRemaining,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.bids[i].userId,
                    markerOrderId: this.bids[i].orderId
                });
            }
        }
        for (let i = 0; i < this.bids.length; i++) {
            if (this.bids[i].filled === this.bids[i].quantity) {
                this.bids.splice(i, 1);
                i--;
            }
        }
        return {
            fills,
            executedQty
        };
    }

    getDepth() {
        const bids: [string, string][] = [];
        const asks: [string, string][] = [];

        const bidsObj: {[key: string]: number} = {};
        const asksObj: {[key: string]: number} = {};

        for (let i = 0; i < this.bids.length; i++) {
            const order = this.bids[i];
            if (!bidsObj[order.price]) {
                bidsObj[order.price] = 0;
            }
            bidsObj[order.price] += order.quantity;
        }

        for (let i = 0; i < this.asks.length; i++) {
            const order = this.asks[i];
            if (!asksObj[order.price]) {
                asksObj[order.price] = 0;
            }
            asksObj[order.price] += order.quantity;
        }

        for (const price in bidsObj) {
            bids.push([price, bidsObj[price].toString()]);
        }

        for (const price in asksObj) {
            asks.push([price, asksObj[price].toString()]);
        }

        return {
            bids,
            asks
        };
    }

    getOpenOrders(userId: string): Order[] {
        const asks = this.asks.filter(x => x.userId === userId);
        const bids = this.bids.filter(x => x.userId === userId);
        return [...asks, ...bids];
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.bids[index].price;
            this.bids.splice(index, 1);
            return price
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index, 1);
            return price
        }
    }

}