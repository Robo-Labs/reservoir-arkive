import { EventHandlerFor, formatUnits } from "../deps.ts";
import uniswapV2Pair from "../abis/uniswapV2Pair.ts";
import { Swap } from "../entities/swap.ts";

export const swapHandler: EventHandlerFor<typeof uniswapV2Pair, "Swap"> =
  async (
    { event, client, store },
  ) => {
    const { amount0In, amount1In, amount0Out, amount1Out, to } = event.args;

    // Figure out price0 and price1
    const tradeDirection: boolean = (amount0Out < amount1Out); // False(0) if direction is token0, True(1) if direction is token1
    let price: number = 0
    if(tradeDirection){
      price = Number((amount0In*BigInt(1e18))/amount1Out)/1e18
    } else {
      price = 1/((Number((amount1In*BigInt(1e18))/amount0Out))/1e18)
    }
    let cumulativeVolume: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVol`,
      async () => {
        return 0  
      }
    )
    //
    cumulativeVolume = cumulativeVolume + (tradeDirection ? Number(amount0In) : Number(amount0Out))
    console.log(cumulativeVolume)
    
    //console.log(cumulativeVolume)
    // Create a new swap entry with the necessary information
    const newSwap = new Swap({
      pair: event.address,
      amountIn: tradeDirection ? parseFloat(formatUnits(amount0In, 18)) : parseFloat(formatUnits(amount1In, 18)),
      amountOut: tradeDirection ? parseFloat(formatUnits(amount0Out,18)) : parseFloat(formatUnits(amount1Out, 18)),
      tradeDirection: tradeDirection,
      to: to,
      timestamp: parseFloat(formatUnits(event.blockNumber, 0)),
      price0: price,
      price1: 1/price,
      //cumulativeVolume: formatUnits(BigInt(cumulativeVolume), 18)
  });


    // Save the new swap entry to the database
    //store.set(`${event.address}:lastSwapCumulativeVol`, formatUnits(BigInt(cumulativeVolume), 18))
    console.log(formatUnits(BigInt(cumulativeVolume), 18))
    //console.log(formatUnits(BigInt(cumulativeVolume), 18))
    await newSwap.save();
    
  };