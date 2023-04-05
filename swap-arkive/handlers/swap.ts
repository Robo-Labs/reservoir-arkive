import { EventHandlerFor, formatUnits } from "../deps.ts";
import uniswapV2Pair from "../abis/uniswapV2Pair.ts";
import { Swap } from "../entities/swap.ts";

export const swapHandler: EventHandlerFor<typeof uniswapV2Pair, "Swap"> =
  async (
    { event, client, store },
  ) => {
    const { amount0In, amount1In, amount0Out, amount1Out, to } = event.args;
    console.log(amount0In, amount1In, amount0Out, amount1Out, to)

    const tradeDirection: boolean = (amount0Out < amount1Out); // False(0) if direction is token0, True(1) if direction is token1
    console.log(tradeDirection)
    // Create a new swap entry with the necessary information
    const newSwap = new Swap({
      pair: event.address,
      amountIn: tradeDirection ? parseFloat(formatUnits(amount1In, 18)) : parseFloat(formatUnits(amount0In, 18)),
      tradeDirection: tradeDirection,
      amountOut: tradeDirection ? parseFloat(formatUnits(amount1Out,18)) : parseFloat(formatUnits(amount0Out, 18)),
      to: to,
      timestamp: parseFloat(formatUnits(event.blockNumber, 0)),
      price0: tradeDirection ? parseFloat(formatUnits(amount1Out / (amount0In), 18)) : parseFloat(formatUnits(BigInt(1)/(amount0Out) / (amount1In), 18)),
      price1: 0,
  });

    // Save the new swap entry to the database
    await newSwap.save();
  };