import { EventHandlerFor, formatUnits } from "../deps.ts";
import uniswapV2Pair from "../abis/uniswapV2Pair.ts";
import erc20 from "../abis/erc20.ts";
import chainlink from "../abis/chainlink.ts";
import { Swap } from "../entities/swap.ts";
import { Address } from "https://deno.land/x/robo_arkiver@v0.3.4/src/deps.ts";

export const swapHandler: EventHandlerFor<typeof uniswapV2Pair, "Swap"> =
  async (
    { event, client, store },
  ) => {
    const { amount0In, amount1In, amount0Out, amount1Out, to } = event.args;
    const address = event.address;

    const token0: Address = await store.retrieve(
      `${address}:token0`,
      async () =>
        await client.readContract({
          abi: uniswapV2Pair,
          functionName: "token0",
          address,
        }),
    );
    const token1: Address = await store.retrieve(
      `${address}:token1`,
      async () =>
        await client.readContract({
          abi: uniswapV2Pair,
          functionName: "token1",
          address,
        }),
    );
    const decimals0: number = await store.retrieve(
      `${token0}:decimals`,
      async () =>
        await client.readContract({
          abi: erc20,
          functionName: "decimals",
          address: token0
        }),
    );
    const decimals1: number = await store.retrieve(
      `${token1}:decimals`,
      async () =>
        await client.readContract({
          abi: erc20,
          functionName: "decimals",
          address: token1,
        }),
    );
    const chainlinkETHUSDOracle: Address = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    const ETHUSDPrice = await store.retrieve(
      `${event.blockNumber}:ethusd`,
      async () =>
        await client.readContract({
          abi: chainlink,
          functionName: "latestAnswer",
          address: chainlinkETHUSDOracle,
        }),
    );
    //console.log(ETHUSDPrice)

    // Figure out price0 and price1
    const tradeDirection: boolean = (amount0Out < amount1Out); // False(0) if direction is token0, True(1) if direction is token1
    let price = 0
    if(tradeDirection){
      price = Number((amount0In*BigInt(1e18 * (10 ** (18 - decimals0))))/(amount1Out * BigInt(10 ** (18 - decimals0))))/(1e18 * (10 ** (18 - decimals0)))
    } else {
      price = 1/((Number((amount1In*BigInt(1e18 * (10 ** (18 - decimals1))))/amount0Out * BigInt(10 ** (18 - decimals0))))/(1e18 * (10 ** (18 - decimals1))))
    }

    let cumulativeVolume0: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVol0`,
      () => {
        return 0  
      }
    )
    let cumulativeVolume1: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVol1`,
      () => {
        return 0  
      }
    )
    let cumulativeVolumeUSD: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVolUSD`,
      () => {
        return 0  
      }
    )
    //
    cumulativeVolume0 = cumulativeVolume0 + (tradeDirection ? Number(amount0In) : Number(amount0Out))
    cumulativeVolume1 = cumulativeVolume1 + (tradeDirection ? Number(amount1Out) : Number(amount1In))
    const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    const wethIsToken0 = token0 == weth
    let VolUSD = wethIsToken0 ? (Number(ETHUSDPrice) * Number(tradeDirection ? amount0In : amount0Out))/(10 ** decimals0) : (Number(ETHUSDPrice) * Number(tradeDirection ? amount1Out : amount1In))/(10 ** decimals1)
    cumulativeVolumeUSD = cumulativeVolumeUSD + Math.floor(VolUSD)
    let numerator = VolUSD * (10 ** (18-8))
    let denominator = wethIsToken0 ? tradeDirection ? (amount1Out * BigInt(10 ** (18-decimals1))) : (amount1In * BigInt(10 ** (18-decimals1))) : tradeDirection ? (amount0In * BigInt(10 ** (18-decimals0))) : (amount0Out * BigInt(10 ** (18-decimals0)))
    let priceUSD  = numerator / Number(denominator)
    console.log(`priceUSD: ${priceUSD}`)
    console.log(`numerator: ${numerator}`)
    console.log(`denominator: ${denominator}`)
    //console.log(`cumVol usd: ${cumulativeVolumeUSD}`)
    VolUSD = parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
    //console.log(`price usd fmt: ${priceUSD}`)
    //console.log(`token0 == weth: ${wethIsToken0}`)
    // Create a new swap entry with the necessary information
    const newSwap = new Swap({
      pair: event.address,
      amountIn: tradeDirection ? parseFloat(formatUnits(amount0In, 18)) : parseFloat(formatUnits(amount1In, 18)),
      amountOut: tradeDirection ? parseFloat(formatUnits(amount1Out,18)) : parseFloat(formatUnits(amount0Out, 18)),
      amountUSD: VolUSD,
      tradeDirection: tradeDirection,
      to: to,
      timestamp: parseFloat(formatUnits(event.blockNumber, 0)),
      price0: price,
      price1: 1/price,
      priceUSD,
      cumulativeVolume0: parseFloat(formatUnits(BigInt(cumulativeVolume0), decimals0)).toFixed(decimals0),
      cumulativeVolume1: parseFloat(formatUnits(BigInt(cumulativeVolume1), decimals1)).toFixed(decimals1),
      cumulativeVolumeUSD: parseFloat(formatUnits(BigInt(Math.floor(cumulativeVolumeUSD)), 8)),
  });


    // Save the new swap entry to the database
    store.set(`${event.address}:lastSwapCumulativeVol0`, cumulativeVolume0)
    store.set(`${event.address}:lastSwapCumulativeVol1`, cumulativeVolume1)
    store.set(`${event.address}:lastSwapCumulativeVolUSD`, cumulativeVolumeUSD)
    await newSwap.save();
    
  };