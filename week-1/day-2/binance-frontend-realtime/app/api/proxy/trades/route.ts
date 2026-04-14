export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        
        if (!symbol) {
            return Response.json({ error: 'symbol parameter required' }, { status: 400 });
        }

        const response = await fetch(`https://api.backpack.exchange/api/v1/trades?symbol=${symbol}`, {
            headers: {
                'Accept': 'application/json',
            },
        });
        const data = await response.json();
        return Response.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return Response.json({ error: 'Failed to fetch trades' }, { status: 500 });
    }
}
