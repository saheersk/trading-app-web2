import { useEffect, useState } from "react";
import { getTrades } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";

const enum Side {
  SELL = "SELL",
  BUY = "BUY",
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
    SignalingManager.getInstance().registerCallback(
      "trade",
      (data: any) => {
        setTrades((previousTrades) => {
          const updatedTrades = [...(previousTrades || [])];

          updatedTrades.push(data);

          updatedTrades.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          return updatedTrades.slice(0, 20);
        });
      },
      `TRADE-${market}`
    );

    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`trade@${market}`],
    });

    return () => {
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`trade@${market}`],
      });
      SignalingManager.getInstance().deRegisterCallback(
        "trade",
        `TRADE-${market}`
      );
    };
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
        <div key={index} className={`flex justify-between text-xs py-1`}>
          <div
            className={`${
              trade.side === Side.SELL
                ? "text-[rgb(253_75_78/var(--tw-text-opacity,1))]"
                : "text-[rgb(0_194_120/var(--tw-text-opacity,1))]"
            }`}
          >
            {trade.price}
          </div>
          <div className="w-full text-sm font-normal capitalize text-[rgba(244,244,246,0.9)] text-right">
            {Number(trade.volume)}
          </div>
          <div className="w-full text-sm font-normal capitalize text-[rgb(150_159_175/var(--tw-text-opacity,1))] text-right text-baseTextMedEmphasis">
            {new Date(trade.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
