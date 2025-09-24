// Stock service - placeholder for business logic / data fetch
export async function getStockList() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 150.1 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 350.2 }
  ];
}

export async function getStockBySymbol(symbol: string) {
  return { symbol, name: `${symbol} stock`, price: 150 + Math.random() * 20 };
}
