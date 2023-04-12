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

    const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const stables = ["0xdAC17F958D2ee523a2206206994597C13D831ec7", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x853d955aCEf822Db058eb8505911ED77F175b99e", "0x4Fabb145d64652a948d72533023f6E7A623C7C53", "0x0000000000085d4780B73119b644AE5ecd22b376", "0x8E870D67F660D95d5be530380D0eC0bd388289E1", "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd"]
    const wethIsToken0 = token0 == weth
    if(!stables.includes(token0) && !stables.includes(token1) && token0!=weth && token1!=weth){
      // This isnt a WETH or a Stable pair, we cant handle this for now so we return
      console.log(`Early exit for ${token0Name} && ${token1Name}`)
      return 0;
    }

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

    let VolUSD: Number = 0;
    if(stables.includes(token0) || stables.includes(token1)){
      if(stables.includes(token0)){
        VolUSD = tradeDirection ? Number(amount0In)/ (10 ** decimals0) : Number(amount0Out) / (10 ** decimals0)
        VolUSD = VolUSD * (10**8)
      } else if(stables.includes(token1)) {
        VolUSD = tradeDirection ? Number(amount1Out)/ (10 ** decimals1) : Number(amount1In)/ (10 ** decimals1)
        VolUSD = VolUSD * (10**8)
      } else {
        console.log("ERR: HOW DID WE GET HERE?")
      }
    } else {
      VolUSD = wethIsToken0 ? (Number(ETHUSDPrice) * Number(tradeDirection ? amount0In : amount0Out))/(10 ** decimals0) : (Number(ETHUSDPrice) * Number(tradeDirection ? amount1Out : amount1In))/(10 ** decimals1)
    }
    
    cumulativeVolumeUSD = cumulativeVolumeUSD + Math.floor(VolUSD)
    let numerator = VolUSD * (10 ** (18-8))
    let denominator = wethIsToken0 ? tradeDirection ? (amount1Out * BigInt(10 ** (18-decimals1))) : (amount1In * BigInt(10 ** (18-decimals1))) : tradeDirection ? (amount0In * BigInt(10 ** (18-decimals0))) : (amount0Out * BigInt(10 ** (18-decimals0)))
    let priceUSD  = numerator / Number(denominator)
    VolUSD = parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
    //console.log(`volUSD: ${VolUSD} wethisToken0: ${wethIsToken0} token0Symbol: ${token0Symbol} token1Symbol: ${token1Symbol}`)

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

    const currentBlockNumber = event.blockNumber; // Assuming you have access to the current block number

    // Calculate the number of blocks in the past 24 hours
    const blockTime = 15; // Approximate block time in seconds
    const secondsInADay = 24 * 60 * 60;
    const secondsInAHour = 60 * 60;
    const blocksInADay = Math.floor(secondsInADay / blockTime);
    const blocksInAHour = Math.floor(secondsInAHour / blockTime);
    // Calculate the block number 24 hours ago
    const blockNumber24HoursAgo = Number(currentBlockNumber) - blocksInADay;
    const blockNumber1HourAgo = Number(currentBlockNumber) - blocksInAHour;
    // Find the swap that happened closest to 24 hours ago but no more
    const dex24HoursAgo = await Dex.find({
      address: to,
      timestamp: { $gte: blockNumber24HoursAgo }
    })
      .sort({ timestamp: 1 }) // Sort by ascending timestamp
      .limit(1) // Get the top 1 result
      .exec();
  
    const dex1HourAgo = await Dex.find({
        address: to,
        timestamp: { $gte: blockNumber1HourAgo }
      })
        .sort({ timestamp: 1 }) // Sort by ascending timestamp
        .limit(1) // Get the top 1 result
        .exec();
    const dexVol = await store.retrieve(
      `dex:${to}:vol`,
      () => {
        return 0
      }
    )
    const cumulativeVolumeDex = Number(dexVol) + Number(VolUSD)
    store.set(`dex:${to}:vol`, cumulativeVolumeDex);
    let newDex = new Dex({
      address: to,
      name: labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to,
      cumulativeVolumeUSD: cumulativeVolumeDex,
      volumeUSD24H: dex24HoursAgo.length > 0 ? cumulativeVolumeDex - dex24HoursAgo[0].cumulativeVolumeUSD : VolUSD,
      volumeUSD1H: dex1HourAgo.length > 0 ? cumulativeVolumeDex - dex1HourAgo[0].cumulativeVolumeUSD : VolUSD,
      timestamp: parseFloat(formatUnits(event.blockNumber, 0))
    });
    if(Number(dex24HoursAgo.length > 0 ? cumulativeVolumeDex - dex24HoursAgo[0].cumulativeVolumeUSD : VolUSD) < Number(0)){
      console.log(`cumulativeVolumeDex: ${cumulativeVolumeDex}`)
      console.log(`dexVol: ${dexVol}`)
      console.log(`VolUSD: ${VolUSD}`)
      console.log("newDex")
      console.log(newDex.toJSON())
      console.log("oldDex")
      console.log(dex24HoursAgo[0].toJSON())
    }
    //dex.cumulativeVolumeUSD += VolUSD
    //dex.lastUpdate = parseFloat(formatUnits(event.blockNumber, 0));
    
    await newDex.save();
    //parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
  };