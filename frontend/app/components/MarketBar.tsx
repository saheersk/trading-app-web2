"use client";
import { useEffect, useState } from "react";
// import { Ticker } from "../utils/types";
import { getTicker } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";
import { AnyARecord } from "dns";

export const MarketBar = ({market}: {market: string}) => {
    const [ticker, setTicker] = useState<any>(null);
    // const [ticker, setTicker] = useState<Ticker | null>(null);/

    useEffect(() => {
        getTicker(market).then(setTicker);
        const signalingManager = SignalingManager.getInstance();

        const tickerCallback = (data: any) => {
            // Update ticker state with WebSocket data
            setTicker((prevTicker: any) => {
                const updatedTicker = {
                    latestPrice: data?.lastPrice ?? prevTicker?.latestPrice,
                    price24hAgo: data?.firstPrice ?? prevTicker?.price24hAgo,
                    pointChange: (data?.lastPrice ?? 0) - (data?.firstPrice ?? 0),
                    percentageChange: data?.priceChangePercent ?? prevTicker?.percentageChange,
                    high: data?.high ?? prevTicker?.high,
                    low: data?.low ?? prevTicker?.low,
                    volume24h: data?.volume ?? prevTicker?.volume24h,
                    trades: data?.trades ?? prevTicker?.trades,
                    symbol: data?.symbol ?? prevTicker?.symbol,
                    lastTradeTime: new Date().toISOString(), // Assuming now as the trade time
                };

                return updatedTicker;
            });
        };

        // Register WebSocket callback for ticker updates
        signalingManager.registerCallback("ticker", tickerCallback, `TICKER-${market}`);
        signalingManager.sendMessage({
            method: "SUBSCRIBE",
            params: [`ticker.${market}`]
        });

        return () => {
            // Cleanup on component unmount
            signalingManager.deRegisterCallback("ticker", `TICKER-${market}`);
            signalingManager.sendMessage({
                method: "UNSUBSCRIBE",
                params: [`ticker.${market}`]
            });
        };

    }, [market])
    // 

    return <div>
        <div className="flex items-center flex-row relative w-full overflow-hidden border-b border-slate-800">
            <div className="flex items-center justify-between flex-row no-scrollbar overflow-auto pr-4">
                    <Ticker market={market} />
                    <div className="flex items-center flex-row space-x-8 pl-4">
                        <div className="flex flex-col h-full justify-center">
                            <p className={`font-medium tabular-nums text-greenText text-md text-green-500 ${Number(ticker?.percentageChange) > 0 ? "text-green-500" : "text-red-500"}`}>{ticker?.latestPrice?.toFixed(2)}</p>
                            <p className="font-medium text-sm text-sm tabular-nums">${ticker?.latestPrice?.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className={`font-medium text-xs text-slate-400 text-sm`}>24H Change</p>
                            <p className={` text-sm font-medium tabular-nums leading-5 text-sm text-greenText ${Number(ticker?.percentageChange) > 0 ? "text-green-500" : "text-red-500"}`}>{Number(ticker?.pointChange) > 0 ? "+" : ""} {ticker?.pointChange?.toFixed(2)}<br /> {Number(ticker?.pointChange) > 0 ? "+" : ""} {Number(ticker?.percentageChange)?.toFixed(2)}%</p></div><div className="flex flex-col">
                                <p className="font-medium text-xs text-slate-400 text-sm">24H High</p>
                                <p className="text-sm font-medium tabular-nums leading-5 text-sm ">{ticker?.high?.toFixed(2)}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-medium text-xs text-slate-400 text-sm">24H Low</p>
                                    <p className="text-sm font-medium tabular-nums leading-5 text-sm ">{ticker?.low?.toFixed(2)}</p>
                                </div>
                            <button type="button" className="font-medium transition-opacity hover:opacity-80 hover:cursor-pointer text-base text-left" data-rac="">
                                <div className="flex flex-col">
                                    <p className="font-medium text-xs text-slate-400 text-sm">24H Volume</p>
                                    <p className="mt-1 text-sm font-medium tabular-nums leading-5 text-sm ">{ticker?.volume24h?.toFixed(2)}</p>
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