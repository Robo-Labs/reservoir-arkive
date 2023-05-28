import { createEntity } from 'https://deno.land/x/robo_arkiver/mod.ts'

// @note: "Index: true" enhances graphql queries 


interface ISwap {
  pair: String;
  hash: String;
  to: String;
  toName: String;
  from: String;
  fromName: String;
  token0Address: String;
  token1Address: String;
  token0Symbol: String;
  token1Symbol: String;
  token0Name: String;
  token1Name: String;
  amountIn: Number;
  amountOut: Number;
  amountUSD: Number;
  tradeDirection: Boolean;
  router: String;
  routerName: String;
  timestamp: Number;
  block: Number;
  price0: Number,
  price1: Number,
  priceUSD: Number,
  WETHUSD: Number,
  cumulativeVolume0: Number,
  cumulativeVolume1: Number,
  cumulativeVolumeUSD: Number,
  cumulativeFeesUSD: Number,
  reserves0: Number,
  reserves1: Number,
  USDTVL: Number
}

export const Swap = createEntity<ISwap>("Swap", {
  pair: String,
  hash: String,
  to: {
    type: String,
    index: true,
  },
  toName: {
    type: String,
    index: true,
  },
  from: {
    type: String,
    index: true,
  },
  fromName: {
    type: String,
    index: true,
  },
  token0Address: {
    type: String,
    index: true,
  },
  token1Address: {
    type: String,
    index: true,
  },
  token0Symbol: {
    type: String,
    index: true,
  },
  token1Symbol: {
    type: String,
    index: true,
  },
  token0Name: {
    type: String,
    index: true,
  },
  token1Name: {
    type: String,
    index: true,
  },
  amountIn: Number,
  amountOut: Number,
  amountUSD: {
    type: Number,
    index: true,
  },
  tradeDirection: {
    type: Boolean,
    index: true,
  },
  router: {
    type: String,
    index: true,
  },
  routerName: {
    type: String,
    index: true,
  },
  timestamp: {
    type: Number,
    index: true,
  },
  block: {
    type: Number,
    index: true,
  },
  price0: Number,
  price1: Number,
  priceUSD: {
    type: Number,
    index: true,
  },
  WETHUSD: {
    type: Number,
    index: true,
  },
  cumulativeVolume0: Number,
  cumulativeVolume1: Number,
  cumulativeVolumeUSD: {
    type: Number,
    index: true,
  },
  cumulativeFeesUSD: {
    type: Number,
    index: true,
  },
  reserves0: Number,
  reserves1: Number,
  USDTVL: Number
});

interface IDex {
  address: String;
  name: String;
  cumulativeVolumeUSD: Number;
  cumulativeVolume0: Number;
  volumeUSD24H: Number;
  volumeUSD1H: Number;
  volume024H: Number;
  volume01H: Number;
  fees024H: Number;
  fees01H: Number;
  APR24H: Number;
  APR1H: Number;
  lenderAPR0: Number;
  lenderAPR1: Number;
  token0Managed: Number;
  token1Managed: Number;
  USDTVL: Number;
  token0TVL: Number;
  timestamp: Number;
  block: Number;
}

//export const Swap = createEntity<ISwap>("Swap", {
export const Dex = createEntity<IDex>("Dex", {
  address: {
    type: String,
    index: true,
  },
  name: {
    type: String,
    index: true,
  },
  cumulativeVolumeUSD: {
    type: Number,
    index: true,
  },
  cumulativeVolume0: {
    type: Number,
    index: true,
  },
  volumeUSD24H: {
    type: Number,
    index: true,
  },
  volumeUSD1H: {
    type: Number,
    index: true,
  },
  volume024H: {
    type: Number,
    index: true,
  },
  volume01H: {
    type: Number,
    index: true,
  },
  fees024H: {
    type: Number,
    index: true,
  },
  fees01H: {
    type: Number,
    index: true,
  },
  APR24H: {
    type: Number,
    index: true,
  },
  APR1H: {
    type: Number,
    index: true,
  },
  lenderAPR0: {
    type: Number,
    index: true,
  },
  lenderAPR1: {
    type: Number,
    index: true,
  },
  token0Managed: {
    type: Number,
    index: true,
  },
  token1Managed: {
    type: Number,
    index: true,
  },
  USDTVL: {
    type: Number,
    index: true,
  },
  token0TVL: {
    type: Number,
    index: true,
  },
  timestamp: {
    type: Number,
    index: true,
  },
  block: {
    type: Number,
    index: true,
  }
});

export const Entities = [Swap, Dex]