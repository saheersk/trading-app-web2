import { Ticker } from "./types";

// export const BASE_URL = "wss://ws.backpack.exchange/"
export const BASE_URL = "ws://localhost:3001"

export class SignalingManager {
    private ws: WebSocket;
    private static instance: SignalingManager;
    private bufferedMessages: any[] = [];
    private callbacks: any = {};
    private id: number;
    private initialized: boolean = false;

    private constructor() {
        this.ws = new WebSocket(BASE_URL);
        this.bufferedMessages = [];
        this.id = 1;
        this.init();
    }

    public static getInstance() {
        if (!this.instance)  {
            this.instance = new SignalingManager();
        }
        return this.instance;
    }

    init() {
        this.ws.onopen = () => {
            this.initialized = true;
            this.bufferedMessages.forEach(message => {
                console.log(message, "=========================event for loop onmessage==========")
                this.ws.send(JSON.stringify(message));
            });
            this.bufferedMessages = [];
        }
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message, "=========================event onmessage==========")

            const type = message.data.e;
            if (this.callbacks[type]) {
                //@ts-ignore
                this.callbacks[type].forEach(({ callback }) => {
                    console.log(message, "===============newTicker================");
                    if (type === "ticker") {
                        const newTicker: Partial<Ticker> = {
                            lastPrice: message.data.c,
                            high: message.data.h,
                            low: message.data.l,
                            volume: message.data.v,
                            priceChange: message.data.poc,
                            priceChangePercent: message.data.pc,
                            symbol: message.data.s,
                        }
                        callback(newTicker);
                   }
                   if (type === "depth") {
                        console.log(message, "======================depth message from ws==============================")
                        const updatedBids = message.data.b;
                        const updatedAsks = message.data.a;
                        callback({ bids: updatedBids, asks: updatedAsks });
                    }
                    if(type === "trade") {
                        const newTrade: any = {
                            symbol: message.data.s,
                            timestamp: message.data.t,
                            price: message.data.p,
                            volume: message.data.q,
                            side: message.data.ts,
                        }
                        console.log(newTrade, "======================trade message from ws==============================");
                        callback(newTrade);
                    }
                });
            }
        }
    }

    sendMessage(message: any) {
        const messageToSend = {
            ...message,
            id: this.id++
        }
        if (!this.initialized) {
            this.bufferedMessages.push(messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend));
    }

    async registerCallback(type: string, callback: any, id: string) {
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({ callback, id });
        // "ticker" => callback
    }

    async deRegisterCallback(type: string, id: string) {
        if (this.callbacks[type]) {
            const index = this.callbacks[type].findIndex((callback: any) => callback.id === id);
            if (index !== -1) {
                this.callbacks[type].splice(index, 1);
            }
        }
    }
}