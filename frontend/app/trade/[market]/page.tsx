"use client";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUI";
import { TradeView } from "@/app/components/TradeView";
import Trades from "@/app/components/Trades";
import { Depth } from "@/app/components/depth/Depth";
import { useParams } from "next/navigation";
import { useState } from "react";

// export default function Page() {
//     const { market } = useParams();
//     return <div className="flex flex-row flex-1">
//         <div className="flex flex-col flex-1">
//             <MarketBar market={market as string} />
//             <div className="flex flex-row h-[920px] border-y border-slate-800">
//                 <div className="flex flex-col flex-1">
//                     <TradeView market={market as string} />
//                 </div>
//                 <div className="flex flex-col w-[250px] overflow-hidden">
//                     <Depth market={market as string} />
//                 </div>
//             </div>
//         </div>
//         <div className="w-[10px] flex-col border-slate-800 border-l"></div>
//         <div>
//             <div className="flex flex-col w-[250px]">
//                 <SwapUI market={market as string} />
//             </div>
//         </div>
//     </div>
// }

// import { useState } from "react";
// import { useParams } from "react-router-dom";
// import MarketBar from "./MarketBar"; // Ensure to import your MarketBar component
// import TradeView from "./TradeView"; // Ensure to import your TradeView component
// import Depth from "./Depth"; // Ensure to import your Depth component
// import SwapUI from "./SwapUI"; // Ensure to import your SwapUI component

export default function Page() {
    const { market } = useParams();
    const [activeTab, setActiveTab] = useState<"trades" | "depth">("trades");

    return (
        <div className="flex flex-row flex-1">
            <div className="flex flex-col flex-1">
                <MarketBar market={market as string} />
                <div className="flex flex-row h-[920px] border-y border-slate-800">
                    <div className="flex flex-col flex-1">
                        <TradeView market={market as string} />
                    </div>
                        <div className="flex flex-col w-[250px] overflow-hidden">
                            <div className="flex border-b border-slate-800">
                                <button
                                    className={`flex-1 py-2 ${
                                        activeTab === "trades" ? "bg-slate-800 text-white" : "text-slate-500"
                                    }`}
                                    onClick={() => setActiveTab("trades")}
                                >
                                    Trades
                                </button>
                                <button
                                    className={`flex-1 py-2 ${
                                        activeTab === "depth" ? "bg-slate-800 text-white" : "text-slate-500"
                                    }`}
                                    onClick={() => setActiveTab("depth")}
                                >
                                    Depth
                                </button>
                            </div>
                            {activeTab === "trades" ? (
                                <Trades market={market as string} />
                            ) : (
                                <Depth market={market as string} />
                            )}
                            
                        </div>
                </div>
            </div>
            <div className="w-[10px] flex-col border-slate-800 border-l"></div>
            <div>
                <div className="flex flex-col w-[250px]">
                    <SwapUI market={market as string} />
                </div>
            </div>
        </div>
    );
}
