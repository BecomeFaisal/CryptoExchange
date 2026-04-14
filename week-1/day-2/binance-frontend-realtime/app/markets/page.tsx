
"use client";
import { MarketsList } from "@/app/components/markets/MarketsList";

export default function Page() {
    return <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1 bg-base-950">
            <MarketsList />
        </div>
    </div>
}