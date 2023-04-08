import { createEntity } from "../deps.ts";

interface ISwap {
  pair: String;
  hash: String;
  token0Symbol: String;
  token1Symbol: String;
  token0Name: String;
  token1Name: String;
  amountIn: Number;
  amountOut: Number;
  amountUSD: Number;
  tradeDirection: Boolean;
  dex: String;
  timestamp: Number;
  price0: Number,
  price1: Number,
  priceUSD: Number,
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
  dex: {
    type: String,
    index: true,
  },
  timestamp: {
    type: Number,
    index: true,
  },
  price0: Number,
  price1: Number,
  priceUSD: {
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