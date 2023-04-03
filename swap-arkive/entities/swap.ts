import { createEntity } from "../deps.ts";

interface ISwap {
  pair: String;
  amount0In: BigInt;
  amount1In: BigInt;
  tradeDirection: Boolean
  to: String;
  timestamp: BigInt;
  price0: BigInt,
  price1: BigInt
}

export const Swap = createEntity<ISwap>("Swap", {
  pair: String,
  amount0In: BigInt,
  amount1In: BigInt,
  tradeDirection: Boolean,
  to: String,
  timestamp: BigInt,
  price0: BigInt,
  price1: BigInt
});