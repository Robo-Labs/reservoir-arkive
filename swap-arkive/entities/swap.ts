import { createEntity } from "../deps.ts";

interface ISwap {
  pair: String;
  amountIn: Number;
  tradeDirection: Boolean;
  to: String;
  timestamp: Number;
  price0: Number,
  price1: Number
}

export const Swap = createEntity<ISwap>("Swap", {
  pair: String,
  amountIn: Number,
  tradeDirection: Boolean,
  to: String,
  timestamp: Number,
  price0: Number,
  price1: Number
});