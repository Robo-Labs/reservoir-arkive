import { EventHandlerFor, formatUnits } from "../deps.ts";
import uniswapV2Pair from "../abis/uniswapV2Pair.ts";
import erc20 from "../abis/erc20.ts";
import chainlink from "../abis/chainlink.ts";
import { Swap } from "../entities/swap.ts";
import { Dex, IDex} from "../entities/dex.ts";
import { Address } from "https://deno.land/x/robo_arkiver@v0.3.4/src/deps.ts";
import labels from "./lib/labels.ts";

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
    const token0Symbol: String = await store.retrieve(
      `${address}:token0:symbol`,
      async () =>
        await client.readContract({
          abi: erc20,
          functionName: "symbol",
          address: token0
        }),
    );
    const token1Symbol: String = await store.retrieve(
      `${address}:token1:symbol`,
      async () =>
        await client.readContract({
          abi: erc20,
          functionName: "symbol",
          address: token1
        }),
    );
    const token0Name: String = await store.retrieve(
      `${address}:token0:name`,
      async () =>
        await client.readContract({
          abi: erc20,
          functionName: "name",
          address: token0
        }),
    );
    const token1Name: String = await store.retrieve(
      `${address}:token1:name`,
      async () =>
        await client.readContract({
          abi: erc20,
          functionName: "name",
          address: token1
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
          blockNumber: event.blockNumber
        }),
    );
    const reserves = await store.retrieve(
      `${event.blockNumber}:${address}:reserves`,
      async () =>
        await client.readContract({
          abi: uniswapV2Pair,
          functionName: "getReserves",
          address: address,
          blockNumber: event.blockNumber
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
    VolUSD = parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))

    const newSwap = new Swap({
      pair: event.address,
      hash: event.transactionHash,
      token0Symbol,
      token1Symbol,
      token0Name,
      token1Name,
      amountIn: tradeDirection ? parseFloat(formatUnits(amount0In, 18)) : parseFloat(formatUnits(amount1In, 18)),
      amountOut: tradeDirection ? parseFloat(formatUnits(amount1Out,18)) : parseFloat(formatUnits(amount0Out, 18)),
      amountUSD: VolUSD,
      tradeDirection: tradeDirection,
      dex: labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to,
      timestamp: parseFloat(formatUnits(event.blockNumber, 0)),
      price0: price,
      price1: 1/price,
      priceUSD,
      cumulativeVolume0: parseFloat(formatUnits(BigInt(cumulativeVolume0), decimals0)).toFixed(decimals0),
      cumulativeVolume1: parseFloat(formatUnits(BigInt(cumulativeVolume1), decimals1)).toFixed(decimals1),
      cumulativeVolumeUSD: parseFloat(formatUnits(BigInt(Math.floor(cumulativeVolumeUSD)), 8)),
      cumulativeFeesUSD: parseFloat(formatUnits(BigInt(Math.floor(cumulativeVolumeUSD)), 8))*0.003, // trust the process
      reserves0: parseFloat(formatUnits(reserves[0], decimals0)),
      reserves1: parseFloat(formatUnits(reserves[1], decimals1)),
      USDTVL: wethIsToken0 ? 2 * (parseFloat(formatUnits(reserves[0], (decimals0) )) * parseFloat(formatUnits(ETHUSDPrice, 8))) : 2 * (parseFloat(formatUnits(reserves[1], (decimals1) )) * parseFloat(formatUnits(ETHUSDPrice, 8)))
  });


    // Save the new swap entry to the database
    store.set(`${event.address}:lastSwapCumulativeVol0`, cumulativeVolume0)
    store.set(`${event.address}:lastSwapCumulativeVol1`, cumulativeVolume1)
    store.set(`${event.address}:lastSwapCumulativeVolUSD`, cumulativeVolumeUSD)
    await newSwap.save();

    let dex = await store.retrieve(
      `dex:${to}`,
      () => {
        return new Dex({
          address: to,
          name: labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to,
          cumulativeVolumeUSD: 0,
          lastUpdate: 0
        })
      }
    )
    
    dex.cumulativeVolumeUSD += VolUSD
    dex.lastUpdate = parseFloat(formatUnits(event.blockNumber, 0));

    await dex.save();
    //parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
  };