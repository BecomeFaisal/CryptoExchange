"use client";

import { useEffect, useState } from "react";
import { getDepth, getTicker, getTrades } from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { SignalingManager } from "@/app/utils/SignalingManager";

export function Depth({ market }: {market: string}) {
    const [bids, setBids] = useState<[string, string][]>();
    const [asks, setAsks] = useState<[string, string][]>();
    const [price, setPrice] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const depthData = await getDepth(market);
                setBids(depthData.bids.reverse());
                setAsks(depthData.asks);
                
                const tickerData = await getTicker(market);
                setPrice(tickerData.lastPrice);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching depth:", err);
                setError("Unable to load depth data");
                setLoading(false);
            }
        };

        init();

        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            setBids((originalBids) => {
                const bidsAfterUpdate = [...(originalBids || [])];

                for (let i = 0; i < bidsAfterUpdate.length; i++) {
                    for (let j = 0; j < data.bids.length; j++)  {
                        if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
                            bidsAfterUpdate[i][1] = data.bids[j][1];
                            break;
                        }
                    }
                }
                return bidsAfterUpdate; 
            });

            setAsks((originalAsks) => {
                const asksAfterUpdate = [...(originalAsks || [])];

                for (let i = 0; i < asksAfterUpdate.length; i++) {
                    for (let j = 0; j < data.asks.length; j++)  {
                        if (asksAfterUpdate[i][0] === data.asks[j][0]) {
                            asksAfterUpdate[i][1] = data.asks[j][1];
                            break;
                        }
                    }
                }
                return asksAfterUpdate; 
            });
        }, `DEPTH-${market}`);
        
        SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`depth.${market}`]});

        return () => {
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth.${market}`]});
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
        }
    }, [market])
    
    return <div className="flex flex-col h-full">
        <TableHeader />
        {error ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                {error}
            </div>
        ) : (
            <>
                {asks && <div className="flex-1 overflow-y-auto"><AskTable asks={asks} /></div>}
                {price && <div className="py-2 text-center border-y border-slate-700 font-semibold text-green-500">{price}</div>}
                {bids && <div className="flex-1 overflow-y-auto"><BidTable bids={bids} /></div>}
            </>
        )}
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs px-3 py-2 border-b border-slate-800 bg-base-900">
    <div className="text-white">Price</div>
    <div className="text-slate-500">Size</div>
    <div className="text-slate-500">Total</div>
</div>
}