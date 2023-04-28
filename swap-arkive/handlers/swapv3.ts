import { EventHandlerFor, formatUnits, uniUtils } from "../deps.ts";
import uniswapV3Pair from "../abis/uniswapV3Pair.ts";
import erc20 from "../abis/erc20.ts";
import chainlink from "../abis/chainlink.ts";
import { Swap } from "../entities/swapv3.ts";
import { Dex } from "../entities/dex.ts";
import { Address } from "https://deno.land/x/robo_arkiver@v0.3.4/src/deps.ts";
import labels from "./lib/labels.ts";
import Uni from "npm:@thanpolas/univ3prices";

export const swapHandler: EventHandlerFor<typeof uniswapV3Pair, "Swap"> =
  async (
    { event, client, store },
  ) => {
    let { sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick} = event.args;
    let router = sender;
    let params = {
      hash: event.transactionHash
    }
    const tx = await client.getTransaction(params)
    const from = tx.from
    const to = tx.to
    const address = event.address;

    const [token0, token1, fee, spacing] = await Promise.all([
      store.retrieve(
        `${address}:token0`,
        async () =>
          await client.readContract({
            abi: uniswapV3Pair,
            functionName: "token0",
            address,
          }),
      ),
      store.retrieve(
        `${address}:token1`,
        async () =>
          await client.readContract({
            abi: uniswapV3Pair,
            functionName: "token1",
            address,
          }),
      ),
      store.retrieve(
        `${address}:fee`,
        async () =>
          await client.readContract({
            abi: uniswapV3Pair,
            functionName: "fee",
            address,
          }),
      ),
      store.retrieve(
        `${address}:spacing`,
        async () =>
          await client.readContract({
            abi: uniswapV3Pair,
            functionName: "tickSpacing",
            address,
          }),
      )
    ]);
    const chainlinkETHUSDOracle: Address = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    const [token0Symbol, token1Symbol, token0Name, token1Name, decimals0, decimals1, ETHUSDPrice] = await Promise.all([ //reserves
      store.retrieve(
        `${address}:token0:symbol`,
        async () =>
          await client.readContract({
            abi: erc20,
            functionName: "symbol",
            address: token0
          }),
      ),
      store.retrieve(
        `${address}:token1:symbol`,
        async () =>
          await client.readContract({
            abi: erc20,
            functionName: "symbol",
            address: token1
          }),
      ),
      store.retrieve(
        `${address}:token0:name`,
        async () =>
          await client.readContract({
            abi: erc20,
            functionName: "name",
            address: token0
          }),
      ),
      store.retrieve(
        `${address}:token1:name`,
        async () =>
          await client.readContract({
            abi: erc20,
            functionName: "name",
            address: token1
          }),
      ),
      store.retrieve(
        `${token0}:decimals`,
        async () =>
          await client.readContract({
            abi: erc20,
            functionName: "decimals",
            address: token0
          }),
      ),
      store.retrieve(
        `${token1}:decimals`,
        async () =>
          await client.readContract({
            abi: erc20,
            functionName: "decimals",
            address: token1,
          }),
      ),
      store.retrieve(
        `${event.blockNumber}:ethusd`,
        async () =>
          await client.readContract({
            abi: chainlink,
            functionName: "latestAnswer",
            address: chainlinkETHUSDOracle,
            blockNumber: event.blockNumber
          }),
      )
      // store.retrieve(
      //   `${event.blockNumber}:${address}:reserves`,
      //   async () =>
      //     await client.readContract({
      //       abi: uniswapV2Pair,
      //       functionName: "getReserves",
      //       address: address,
      //       blockNumber: event.blockNumber
      //     }),
      // )
    ]);

    const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const stables = ["0xdAC17F958D2ee523a2206206994597C13D831ec7", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x853d955aCEf822Db058eb8505911ED77F175b99e", "0x4Fabb145d64652a948d72533023f6E7A623C7C53", "0x0000000000085d4780B73119b644AE5ecd22b376", "0x8E870D67F660D95d5be530380D0eC0bd388289E1", "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd"]
    const wethIsToken0 = token0 == weth
    const wethIsToken1 = token1 == weth
    const wethIsUsed = wethIsToken0 || wethIsToken1
    if(!stables.includes(token0) && !stables.includes(token1) && token0!=weth && token1!=weth){
      // This isnt a WETH or a Stable pair, we cant handle this for now so we return
      console.log(`Early exit for ${token0Name} && ${token1Name}`)
      return 0;
    }
    //console.log(ETHUSDPrice)

    // Figure out price0 and price1
    //const tradeDirection: boolean = (amount0Out < amount1Out); // False(0) if direction is token0, True(1) if direction is token1
    
    const tradeDirection: boolean = (amount0 < amount1)
    let price = ((Math.abs(Number(amount0))/(10**decimals0))*(10**18)) / ((Math.abs(Number(amount1))/(10**decimals1))*(10**18))

    let cumulativeVolume0: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVol0`,
      async () => {
        const latest = await Swap.find({
          pair: event.address,
        })
          .sort({ timestamp: -1 }) // Sort by descending timestamp
          .limit(1) // Get the top 1 result
          .exec();
        if(latest[0])
          return Math.floor(Number(latest[0].cumulativeVolume0) * (10 ** decimals0))
        return 0
      }
    )
    let cumulativeVolume1: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVol1`,
      async () => {
        const latest = await Swap.find({
          pair: event.address
        })
          .sort({ timestamp: -1 }) // Sort by descending timestamp
          .limit(1) // Get the top 1 result
          .exec();
        if(latest[0])
          return Math.floor(Number(latest[0].cumulativeVolume1) * (10 ** decimals1))
        return 0
      }
    )
    let cumulativeVolumeUSD: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVolUSD`,
      async () => {
        const latest = await Swap.find({
          pair: event.address
        })
          .sort({ timestamp: -1 }) // Sort by descending timestamp
          .limit(1) // Get the top 1 result
          .exec();
        if(latest[0])
          return latest[0].cumulativeVolumeUSD
        return 0
      }
    )
    // console.log(`cumVol0: ${cumulativeVolume0}, cumVol1: ${cumulativeVolume1}, cumVolUSD: ${cumulativeVolumeUSD} DEX: ${labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to}`)

    cumulativeVolume0 = cumulativeVolume0 + Math.abs(Number(amount0))
    cumulativeVolume1 = cumulativeVolume1 + Math.abs(Number(amount1))

    let VolUSD: Number = 0;
    if(stables.includes(token0)){
      VolUSD = Math.abs(Number(amount0)) / (10 ** decimals0)
      VolUSD = VolUSD * Number((10**8))
    } else if(stables.includes(token1)) {
      VolUSD = Math.abs(Number(amount1)) / (10 ** decimals1)
      VolUSD = VolUSD * (10**8)
    } else {
      VolUSD = wethIsToken0 ? (Number(ETHUSDPrice) * Math.abs(Number(amount0)))/(10 ** decimals0) : (Number(ETHUSDPrice) * Math.abs(Number(amount1)))/(10 ** decimals1)
    }
    VolUSD = Math.floor(Number(VolUSD)).toFixed(8)
    //console.log(`VolUSD: ${VolUSD} ${token0Name}/${token1Name}`)
    
    cumulativeVolumeUSD = cumulativeVolumeUSD + Number(VolUSD)
    let numerator = VolUSD * (10 ** (18-8))
    let denominator = Number(0)
    if(stables.includes(token0)){
      denominator = (Math.abs(Number(amount1))/(10**decimals1))*(10**18)
    } else if(stables.includes(token1)) {
      denominator = (Math.abs(Number(amount0))/(10**decimals0))*(10**18)
    } else {
      denominator = wethIsToken0 ? (10**18)*(Math.abs(Number(amount1))/(10**decimals1)) : (10**18)*(Math.abs(Number(amount0))/(10**decimals0))
    }
    //console.log(`numerator  : ${numerator}\ndenominator: ${denominator}`)
    //console.log(`**** stables prices: $${numerator / Number(denominator)} ****`)
    //console.log(`***** ${token0Symbol}/${token1Symbol} ****`)
    let priceUSD  = numerator / denominator
    priceUSD = priceUSD.toFixed(8)
    VolUSD = parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
    // console.log(`priceUSD: ${priceUSD}`)
    // console.log(`VolUSD: ${VolUSD}`)
    // console.log(`Pair: ${token0Symbol}/${token1Symbol}`)
    
    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        return Number((await client.getBlock({ blockHash: event.blockHash })).timestamp);
      });
    store.set(`${event.blockHash}:timestamp`, timestamp);
    //console.log(`volUSD: ${VolUSD} wethisToken0: ${wethIsToken0} token0Symbol: ${token0Symbol} token1Symbol: ${token1Symbol}`)
    //console.log(`Liquidity: ${String(liquidity)}\nSpacing ${String(spacing)}`)
    let reserves = Uni.getAmountsForCurrentLiquidity([String(decimals0), String(decimals1)], String(liquidity), String(sqrtPriceX96), String(spacing), {tickStep: 1000} )
    //console.log(`reserves: ${reserves}`)
    const newSwap = new Swap({
      pair: event.address,
      hash: event.transactionHash,
      to: to,
      toName:labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to,
      from: from,
      fromName: labels[from.toLowerCase()] ? labels[from.toLowerCase()]['name'] : from,
      token0Address: token0,
      token1Address: token1,
      token0Symbol,
      token1Symbol,
      token0Name,
      token1Name,
      amountIn: tradeDirection ? parseFloat(formatUnits(BigInt(Math.abs(Number(amount0))), decimals0)) : parseFloat(formatUnits(BigInt(Math.abs(Number(amount1))), decimals1)),
      amountOut: tradeDirection ? parseFloat(formatUnits(BigInt(Math.abs(Number(amount1))), decimals1)) : parseFloat(formatUnits(BigInt(Math.abs(Number(amount0))), decimals0)),
      amountUSD: VolUSD,
      tradeDirection: tradeDirection,
      router: router,
      routerName: labels[router.toLowerCase()] ? labels[router.toLowerCase()]['name'] : router,
      timestamp: timestamp,
      block: parseFloat(formatUnits(event.blockNumber, 0)),
      price0: price,
      price1: 1/price,
      priceUSD,
      WETHUSD: Number(ETHUSDPrice),
      cumulativeVolume0: parseFloat(formatUnits(BigInt(cumulativeVolume0), decimals0)).toFixed(decimals0),
      cumulativeVolume1: parseFloat(formatUnits(BigInt(cumulativeVolume1), decimals1)).toFixed(decimals1),
      cumulativeVolumeUSD: parseFloat(formatUnits(BigInt(Math.floor(cumulativeVolumeUSD)), 8)),
      cumulativeFeesUSD: parseFloat(formatUnits(BigInt(Math.floor(cumulativeVolumeUSD)), 8))*(fee/1000000), // trust the process
      reserves0: reserves[0],
      reserves1: reserves[1],
      USDTVL: 0, //wethIsToken0 ? 2 * (parseFloat(formatUnits(reserves[0], (decimals0) )) * parseFloat(formatUnits(ETHUSDPrice, 8))) : 2 * (parseFloat(formatUnits(reserves[1], (decimals1) )) * parseFloat(formatUnits(ETHUSDPrice, 8)))
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
      block: { $gte: blockNumber24HoursAgo }
    })
      .sort({ timestamp: 1 }) // Sort by ascending timestamp
      .limit(1) // Get the top 1 result
      .exec();
  
    const dex1HourAgo = await Dex.find({
        address: to,
        block: { $gte: blockNumber1HourAgo }
      })
        .sort({ timestamp: 1 }) // Sort by ascending timestamp
        .limit(1) // Get the top 1 result
        .exec();
      
    // Get most recent dex cumulative volume  or return 0
    const oldDex = await store.retrieve(
      `dex:${to}:vol`,
      async () => {
        const latest = await Dex.find({
          address: to,
        })
          .sort({ timestamp: -1 }) // Sort by decending timestamp
          .limit(1) // Get the top 1 result
          .exec();
        
        if(latest[0]){
          return latest[0]
        } else {
          return undefined // Okay well there must not be any entries in the db for this Dex/Router
        }
      }
    )
    let dexVol = oldDex ? oldDex.cumulativeVolumeUSD : Number(0);
    let dexName = labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to;
    //console.log(`Dex: ${dexName}, vol: ${dexVol}`);
    const cumulativeVolumeDex = Number(dexVol) + Number(VolUSD)
    
    let newDex = new Dex({
      address: to,
      name: dexName,
      cumulativeVolumeUSD: cumulativeVolumeDex,
      volumeUSD24H: dex24HoursAgo.length > 0 ? cumulativeVolumeDex - dex24HoursAgo[0].cumulativeVolumeUSD : VolUSD,
      volumeUSD1H: dex1HourAgo.length > 0 ? cumulativeVolumeDex - dex1HourAgo[0].cumulativeVolumeUSD : VolUSD,
      timestamp: timestamp,
      block: parseFloat(formatUnits(event.blockNumber, 0))
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
    //store.set(`dex:${to}:vol`, cumulativeVolumeDex);
    //await newDex.save();
    store.set(`dex:${to}:vol`, await newDex.save());
    //console.log(answer)
    //console.log(`from: ${tx.from}\nto:   ${tx.to}\n(to): ${to}`)
    
    //parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
  };