import { createEntity } from "../deps.ts";

interface ISwap {
  pair: String;
  amountIn: Number;
  amountOut: Number;
  amountUSD: Number;
  tradeDirection: Boolean;
  to: String;
  timestamp: Number;
  price0: Number,
  price1: Number,
  priceUSD: Number,
  cumulativeVolume0: Number,
  cumulativeVolume1: Number,
  cumulativeVolumeUSD: Number
}

export const Swap = createEntity<ISwap>("Swap", {
  pair: String,
  amountIn: Number,
  amountOut: Number,
  amountUSD: Number,
  tradeDirection: Boolean,
  to: String,
  timestamp: Number,
  price0: Number,
  price1: Number,
  priceUSD: Number,
  cumulativeVolume0: Number,
  cumulativeVolume1: Number,
  cumulativeVolumeUSD: Number
});