export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const interval = searchParams.get('interval');
        const startTime = searchParams.get('startTime');
        const endTime = searchParams.get('endTime');
        
        if (!symbol || !interval || !startTime || !endTime) {
            return Response.json({ error: 'symbol, interval, startTime, endTime parameters required' }, { status: 400 });
        }

        const response = await fetch(`https://api.backpack.exchange/api/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`, {
            headers: {
                'Accept': 'application/json',
            },
        });
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return Response.json({ error: 'Failed to fetch klines' }, { status: 500 });
    }
}
