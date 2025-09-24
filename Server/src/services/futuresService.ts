export async function getFuturesList() {
  // Placeholder: replace with real data access (DB or external API)
  return [
    { symbol: 'ES', name: 'S&P 500 E-mini', price: 4200.5 },
    { symbol: 'NQ', name: 'Nasdaq 100 E-mini', price: 13000.2 }
  ];
}

export async function getFutureBySymbol(symbol: string) {
  // Placeholder example; in real code query an API or DB
  return { symbol, name: `${symbol} futures`, price: 4200 + Math.random() * 100 };
}
