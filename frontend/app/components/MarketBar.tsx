"use client";
import { useEffect, useState } from "react";
// import { Ticker } from "../utils/types";
import { getTicker } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";
import { AnyARecord } from "dns";

export const MarketBar = ({market}: {market: string}) => {
    const [ticker, setTicker] = useState<any>(null);

    useEffect(() => {
        getTicker(market).then(setTicker);
        const signalingManager = SignalingManager.getInstance();

        const tickerCallback = (data: any) => {
            setTicker((prevTicker: any) => {
                const latestPrice = Number(data?.lastPrice ?? prevTicker?.latestPrice ?? 0);
                const volume24h = Number(data?.volume ?? prevTicker?.volume24h ?? 0);
                const price24hAgo = Number(prevTicker?.price24hAgo ?? latestPrice);
        
                const pointChange = latestPrice - price24hAgo;
                const percentageChange = price24hAgo !== 0 
                    ? ((pointChange / price24hAgo) * 100).toFixed(2)
                    : "0.00";
        
                return {
                    ...prevTicker,
                    latestPrice,
                    volume24h,
                    price24hAgo,
                    pointChange: pointChange,
                    percentageChange,
                    high: Math.max(Number(prevTicker?.high ?? latestPrice), latestPrice),
                    low: Math.min(Number(prevTicker?.low ?? latestPrice), latestPrice),
                    lastTradeTime: new Date().toISOString(),
                    numberOfTrades: (prevTicker?.numberOfTrades ?? 0) + 1,
                };
            });
        };

        signalingManager.registerCallback("ticker", tickerCallback, `TICKER-${market}`);
  
        SignalingManager.getInstance().sendMessage({
            method: "SUBSCRIBE",
            params: [`ticker@${market}`],
          });
      

        return () => {
            SignalingManager.getInstance().sendMessage({
                method: "UNSUBSCRIBE",
                params: [`ticker@${market}`],
              });
              SignalingManager.getInstance().deRegisterCallback(
                "ticker",
                `TICKER-${market}`
              );
        };

    }, [market])

    return<div>
    <div className="flex items-center flex-row relative w-full overflow-hidden border-b border-slate-800">
        <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4">
            <Ticker market={market} />
            <div className="flex items-center flex-row space-x-8 pl-4">
                <div className="flex flex-col h-full justify-center">
                    <p className={`font-medium tabular-nums ${Number(ticker?.percentageChange) > 0 ? "text-green-500" : "text-red-500"}`}>
                        {ticker?.latestPrice?.toFixed(2)}
                    </p>
                    <p className="font-medium tabular-nums">${ticker?.latestPrice?.toFixed(2)}</p>
                </div>
                <div className="flex flex-col">
                    <p className="font-medium text-xs text-slate-400">24H Change</p>
                    <p className={`font-medium tabular-nums leading-5 ${Number(ticker?.percentageChange) > 0 ? "text-green-500" : "text-red-500"}`}>
                        {Number(ticker?.pointChange) > 0 ? "+" : ""} {Number(ticker?.pointChange).toFixed(2)}<br />
                        {Number(ticker?.percentageChange) > 0 ? "+" : ""} {Number(ticker?.percentageChange)?.toFixed(2)}%
                    </p>
                </div>
                <div className="flex flex-col">
                    <p className="font-medium text-xs text-slate-400">24H High</p>
                    <p className="font-medium tabular-nums leading-5">{ticker?.high?.toFixed(2)}</p>
                </div>
                <div className="flex flex-col">
                    <p className="font-medium text-xs text-slate-400">24H Low</p>
                    <p className="font-medium tabular-nums leading-5">{ticker?.low?.toFixed(2)}</p>
                </div>
                <button type="button" className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left" data-rac="">
                    <div className="flex flex-col">
                        <p className="font-medium text-xs text-slate-400">24H Volume</p>
                        <p className="mt-1 font-medium tabular-nums leading-5">{ticker?.volume24h?.toFixed(2)}</p>
                    </div>
                </button>
            </div>
        </div>
    </div>
</div>


}

function Ticker({market}: {market: string}) {
    return <div className="flex h-[60px] shrink-0 space-x-4">
        <div className="flex flex-row relative ml-2 -mr-4">
            <img alt="SOL Logo" loading="lazy" decoding="async" data-nimg="1" className="z-10 rounded-full h-6 w-6 mt-4 outline-baseBackgroundL1"  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVvBqZC_Q1TSYObZaMvK0DRFeHZDUtVMh08Q&s" />
            <img alt="USDC Logo" loading="lazy"decoding="async" data-nimg="1" className="h-6 w-6 -ml-2 mt-4 rounded-full" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVvBqZC_Q1TSYObZaMvK0DRFeHZDUtVMh08Q&s" />
        </div>
        <button type="button" className="react-aria-Button" data-rac="">
            <div className="flex items-center justify-between flex-row cursor-pointer rounded-lg p-3 hover:opacity-80">
                <div className="flex items-center flex-row gap-2 undefined">
                    <div className="flex flex-row relative">
                        <p className="font-medium text-sm undefined">{market.replace("_", " / ")}</p>
                    </div>
                </div>
            </div>
        </button>
    </div>
}