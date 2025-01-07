"use client";

import { use, useEffect, useState } from "react";
import {
  getDepth,
  getKlines,
  getTicker,
  getTrades,
} from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { SignalingManager } from "../../utils/SignalingManager";

export function Depth({
  market,
  latestPrice,
}: {
  market: string;
  latestPrice: number;
}) {
  const [bids, setBids] = useState<[string, string][]>();
  const [asks, setAsks] = useState<[string, string][]>();
  const [price, setPrice] = useState<string>();

  useEffect(() => {
    SignalingManager.getInstance().registerCallback(
      "depth",
      (depth: any) => {
        console.log(depth, "==================data depth");
        setBids((originalBids) => {
          if (!depth.bids || depth.bids.length === 0) {
            return [];
          }

          const bidsAfterUpdate = [...(originalBids || [])];

          // Update existing bids
          for (let i = 0; i < bidsAfterUpdate.length; i++) {
            for (let j = 0; j < depth.bids.length; j++) {
              if (bidsAfterUpdate[i][0] === depth.bids[j][0]) {
                bidsAfterUpdate[i][1] = depth.bids[j][1];
                if (Number(bidsAfterUpdate[i][1]) === 0) {
                  bidsAfterUpdate.splice(i, 1);
                  i--; // Adjust index after splice
                }
                break;
              }
            }
          }

          // Add new bids
          for (let j = 0; j < depth.bids.length; j++) {
            if (
              Number(depth.bids[j][1]) !== 0 &&
              !bidsAfterUpdate.some((x) => x[0] === depth.bids[j][0])
            ) {
              bidsAfterUpdate.push(depth.bids[j]);
            }
          }

          // Sort bids in descending order of price
          bidsAfterUpdate.sort((x, y) => Number(y[0]) - Number(x[0]));

          return depth.bids;
        });

        setAsks((originalAsks) => {
          if (!depth.asks || depth.asks.length === 0) {
            return [];
          }

          const asksAfterUpdate = [...(originalAsks || [])];

          // Update existing asks
          for (let i = 0; i < asksAfterUpdate.length; i++) {
            for (let j = 0; j < depth.asks.length; j++) {
              if (asksAfterUpdate[i][0] === depth.asks[j][0]) {
                asksAfterUpdate[i][1] = depth.asks[j][1];
                if (Number(asksAfterUpdate[i][1]) === 0) {
                  asksAfterUpdate.splice(i, 1);
                  i--;
                }
                break;
              }
            }
          }

          // Add new asks
          for (let j = 0; j < depth.asks.length; j++) {
            if (
              Number(depth.asks[j][1]) !== 0 &&
              !asksAfterUpdate.some((x) => x[0] === depth.asks[j][0])
            ) {
              asksAfterUpdate.push(depth.asks[j]);
            }
          }

          // Sort asks in ascending order of price
          asksAfterUpdate.sort((x, y) => Number(x[0]) - Number(y[0]));

          return depth.asks;
        });
      },
      `DEPTH-${market}`
    );

    SignalingManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth@${market}`],
    });

    getDepth(market).then((d) => {
      setBids(d.bids.reverse());
      setAsks(d.asks);
    });

    // getTicker(market).then(t => setPrice(t.lastPrice));
    getTrades(market).then((t) => setPrice(t[0].price));

    return () => {
      SignalingManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth@${market}`],
      });
      SignalingManager.getInstance().deRegisterCallback(
        "depth",
        `DEPTH-${market}`
      );
    };
  }, []);

  useEffect(() => {
    console.log("latestPrice", latestPrice);
    if(latestPrice) setPrice(latestPrice.toString());
  }, [latestPrice]);

  return (
    <div>
      <TableHeader />
      {asks && <AskTable asks={asks} />}
      {price && <div>{price}</div>}
      {bids && <BidTable bids={bids} />}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="flex justify-between text-xs">
      <div className="text-white">Price</div>
      <div className="text-slate-500">Size</div>
      <div className="text-slate-500">Total</div>
    </div>
  );
}
