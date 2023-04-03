import { EventHandlerFor, formatUnits } from "../deps.ts";
import uniswapV2Pair from "../abis/uniswapV2Pair.ts";
import { Swap } from "../entities/swap.ts";

export const swapHandler: EventHandlerFor<typeof uniswapV2Pair, "Swap"> =
  async (
    { event, client, store },
  ) => {
    const { amount0In, amount1In, amount0Out, amount1Out, to } = event.args;

    const tradeDirection = amount0Out < amount1Out; // False(0) if direction is token0, True(1) if direction is token1
    // Create a new swap entry with the necessary information
    const newSwap = new Swap({
      pair: event.address,
      amountIn: tradeDirection ? amount1In : amount0In,
      direction: tradeDirection,
      amountOut: tradeDirection ? amount1Out : amount0Out,
      to: to,
      timestamp: event.blockNumber,
      price0: tradeDirection ? amount0In/amount1Out : BigInt(1)/(amount1In/amount0Out),
      price1: tradeDirection ? BigInt(1)/(amount0In/amount1Out) : amount1In/amount0Out
    });

    // Save the new swap entry to the database
    await newSwap.save();
  };