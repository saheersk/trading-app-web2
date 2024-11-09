import { useEffect, useRef } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { KLine } from "../utils/types";

export function TradeView({
  market,
}: {
  market: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);

  useEffect(() => {
    const init = async () => {
      let klineData: KLine[] = [];
      try {
        klineData = await getKlines(market, "1d", Math.floor((new Date().getTime() - 1000 * 60 * 60 * 24 * 7) / 1000), Math.floor(new Date().getTime() / 1000)); 
      } catch (e) { }

      if (chartRef) {
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
        }
        console.log(klineData, 'kline in fe==============')
  
        const chartManager = new ChartManager(
          chartRef.current,
          [
            ...klineData?.map((x: any) => {
              const timestamp = new Date(x.timestamp).getTime(); // Convert to milliseconds
              // console.log(timestamp, "===================timestamp");
              // console.log(x.close, "===================close");
              return {
                  close: parseFloat(x.close),
                  high: parseFloat(x.high),
                  low: parseFloat(x.low),
                  open: parseFloat(x.open),
                  volume: parseFloat(x.volume),
                  trades: x.trades,
                  timestamp, // Timestamp in milliseconds
              };
          })
        ].sort((a, b) => a.timestamp - b.timestamp) || [] ,
          {
            background: "#0e0f14",
            color: "white",
          }
        );
        //@ts-ignore
        chartManagerRef.current = chartManager;
      }
    };
    init();
  }, [market, chartRef]);

  return (
    <>
      <div ref={chartRef} style={{ height: "520px", width: "100%", marginTop: 4 }}></div>
    </>
  );
}
