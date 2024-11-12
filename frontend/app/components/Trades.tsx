import { useEffect, useState } from "react";
import { getTrades } from "../utils/httpClient";

const enum Side {
    SELL = "SELL",
    BUY = "BUY"
}
interface Trade {
    price: string;
    volume: string;
    timestamp: string;
    side: "BUY" | "SELL";
}

export default function Trades({ market }: { market: string }) {
    const [trades, setTrades] = useState<Trade[]>([]);
    useEffect(() => {
        getTrades(market).then((data: any) => {
            setTrades(data);
        });
    }, [market]);

    return (
        <div>
            <TradesHeader />
            <TradesTable trades={trades} />
        </div>
    );
}

function TradesHeader() {
    return (
        <div className="flex justify-between text-xs">
            <div className="text-white">Price</div>
            <div className="text-slate-500">Qty</div>
            <div className="text-slate-500">Time</div>
        </div>
    );
}

function TradesTable({ trades }: { trades: Trade[] }) {
    return (
        <div>
            {trades.map((trade, index) => (
                <div
                    key={index}
                    className={`flex justify-between text-xs py-1 ${
                        trade.side === "BUY" ? "bg-green-100" : "bg-red-100"
                    }`}
                >
                    <div className="text-white">{trade.price}</div>
                    <div className="text-slate-500">{Number(trade.volume)}</div>
                    <div className="text-slate-500">{new Date(trade.timestamp).toLocaleTimeString()}</div>
                </div>
            ))}
        </div>
    );
}
