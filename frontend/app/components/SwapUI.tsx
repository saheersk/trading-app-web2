"use client";
import axios from "axios";
import { useState } from "react";
import Image from "next/image";

const BASE_URL = "http://localhost:3000/api/v1"

export function SwapUI({ market }: { market: string }) {
    const [amount, setAmount] = useState("");
    const [activeTab, setActiveTab] = useState("buy");
    const [type, setType] = useState("limit");
    const [price, setPrice] = useState(""); // State for price
    const [quantity, setQuantity] = useState(""); // State for quantity
    const userId = "exampleUserId"; // Replace with actual user ID

    const submitOrder = async () => {
        const side = activeTab === "buy" ? "buy" : "sell";

        try {
            const response = await axios.post(`${BASE_URL}/order`, {
                market,
                price,
                quantity,
                side,
                userId,
            });
            console.log("Order created successfully:", response.data);
        } catch (error) {
            console.error("Error creating order:", error);
        }
    };

    return (
        <div>
            <div className="flex flex-col">
                <div className="flex flex-row h-[60px]">
                    <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
                    <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="px-3">
                        <div className="flex flex-row flex-0 gap-5">
                            <LimitButton type={type} setType={setType} />
                            <MarketButton type={type} setType={setType} />
                        </div>
                    </div>
                    <div className="flex flex-col px-3">
                        <div className="flex flex-col flex-1 gap-3 text-baseTextHighEmphasis">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between flex-row">
                                    <p className="text-xs font-normal text-baseTextMedEmphasis">Available Balance</p>
                                    <p className="font-medium text-xs text-baseTextHighEmphasis">36.94 USDC</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-normal text-baseTextMedEmphasis">Price</p>
                                <div className="flex flex-col relative">
                                    <input
                                        step="0.01"
                                        placeholder="0"
                                        className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0"
                                        type="text"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                    <div className="flex flex-row absolute right-1 top-1 p-2">
                                        <div className="relative">
                                            <Image
                                                src="/assets/label.png"
                                                width={24}
                                                height={24}
                                                alt="Picture of the author"
                                                className="w-6 h-6 invert"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-normal text-baseTextMedEmphasis">Quantity</p>
                            <div className="flex flex-col relative">
                                <input
                                    step="0.01"
                                    placeholder="0"
                                    className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0"
                                    type="text"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                                <div className="flex flex-row absolute right-1 top-1 p-2">
                                    <div className="relative">
                                        <Image
                                            src="/assets/boxes.png"
                                            width={24}
                                            height={24}
                                            alt="Picture of the author"
                                            className="w-6 h-6 invert"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="font-semibold focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-greenPrimaryButtonBackground text-greenPrimaryButtonText active:scale-98"
                        onClick={submitOrder}
                    >
                        {activeTab === "buy" ? "Buy" : "Sell"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function LimitButton({ type, setType }: { type: string; setType: any }) {
    return (
        <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType("limit")}>
            <div
                className={`text-sm font-medium py-1 border-b-2 ${
                    type === "limit"
                        ? "border-accentBlue text-baseTextHighEmphasis"
                        : "border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"
                }`}
            >
                Limit
            </div>
        </div>
    );
}

function MarketButton({ type, setType }: { type: string; setType: any }) {
    return (
        <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType("market")}>
            <div
                className={`text-sm font-medium py-1 border-b-2 ${
                    type === "market"
                        ? "border-accentBlue text-baseTextHighEmphasis"
                        : "border-b-2 border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"
                } `}
            >
                Market
            </div>
        </div>
    );
}

function BuyButton({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: any }) {
    return (
        <div
            className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${
                activeTab === "buy"
                    ? "border-b-greenBorder bg-greenBackgroundTransparent"
                    : "border-b-baseBorderMed hover:border-b-baseBorderFocus"
            }`}
            onClick={() => setActiveTab("buy")}
        >
            <p className="text-center text-sm font-semibold text-greenText">Buy</p>
        </div>
    );
}

function SellButton({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: any }) {
    return (
        <div
            className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${
                activeTab === "sell"
                    ? "border-b-redBorder bg-redBackgroundTransparent"
                    : "border-b-baseBorderMed hover:border-b-baseBorderFocus"
            }`}
            onClick={() => setActiveTab("sell")}
        >
            <p className="text-center text-sm font-semibold text-redText">Sell</p>
        </div>
    );
}
