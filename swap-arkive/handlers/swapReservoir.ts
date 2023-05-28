import { EventHandlerFor, formatUnits } from "../deps.ts";
//import uniswapV2Pair from "../abis/uniswapV2Pair.ts";
import reservoirPair from "../abis/reservoirPair.ts";
import erc20 from "../abis/erc20.ts";
import chainlink from "../abis/chainlink.ts";
import aavePool from "../abis/aavePool.ts"
//import { Swap } from "../entities/swap.ts";
import { Dex, Swap } from "../entities/entities.ts";
import { Address } from "https://deno.land/x/robo_arkiver@v0.3.4/src/deps.ts";
import labels from "./lib/labels.ts";

//Swap(address indexed sender, bool zeroForOne, uint256 amountIn, uint256 amountOut, address indexed to)

export const reservoirSwapHandler: EventHandlerFor<typeof reservoirPair, "Swap"> =
  async (
    { event, client, store },
  ) => {
    console.log("handle")
    let { sender, zeroForOne, amountIn, amountOut, to } = event.args;
    const AAVE_POOL = '0xf319Bb55994dD1211bC34A7A26A336C6DD0B1b00'
    console.log(sender)
    console.log(zeroForOne)
    console.log(amountIn)
    console.log(amountOut)
    console.log(to)
    let amount0In = 0
    let amount0Out = 0
    let amount1In = 0
    let amount1Out = 0
    if(zeroForOne){
      amount0In = amountIn
      amount1Out = amountOut
    } else {
      amount1In = amountIn
      amount0Out = amountOut
    }
    
    let router = to;
    let params = {
      hash: event.transactionHash
    }
    let tx = await client.getTransaction(params)
    let from = tx.from
    to = tx.to
    const address = event.address;

    const [token0, token1] = await Promise.all([
      store.retrieve(
        `${address}:token0`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "token0",
            address,
          }),
      ),
      store.retrieve(
        `${address}:token1`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "token1",
            address,
          }),
      )
    ]);
    const chainlinkETHUSDOracle: Address = "0x86d67c3D38D2bCeE722E601025C25a575021c6EA"
    const [token0Symbol, token1Symbol, token0Name, token1Name, decimals0, decimals1, ETHUSDPrice, reserves, swapFee, platformFee, token0Managed, token1Managed] = await Promise.all([
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
      ),
      store.retrieve(
        `${event.blockNumber}:${address}:reserves`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "getReserves",
            address: address,
            blockNumber: event.blockNumber
          }),
      ),
      store.retrieve(
        `${event.blockNumber}:${address}:swapFee`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "swapFee",
            address: address,
            blockNumber: event.blockNumber
          }),
      ),
      store.retrieve(
        `${event.blockNumber}:${address}:platformFee`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "platformFee",
            address: address,
            blockNumber: event.blockNumber
          }),
      ),
      store.retrieve(
        `${event.blockNumber}:${address}:token0Managed`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "token0Managed",
            address: address,
            blockNumber: event.blockNumber
          }),
      ),
      store.retrieve(
        `${event.blockNumber}:${address}:token1Managed`,
        async () =>
          await client.readContract({
            abi: reservoirPair,
            functionName: "token1Managed",
            address: address,
            blockNumber: event.blockNumber
          }),
      )
    ]);

    let tempTokenMap = {'0x5D60473C5Cb323032d6fdFf42380B50E2AE4d245': '0x6a17716Ce178e84835cfA73AbdB71cb455032456', '0x6e9FDaE1Fe20b0A5a605C879Ae14030a0aE99cF9':'0x0343A9099f42868C1E8Ae9e501Abc043FD5fD816' }
    let mapped0 = tempTokenMap[token0]
    let mapped1 = tempTokenMap[token1]

    let reserveData0 = await store.retrieve(
      `${event.blockNumber}:aave:reserveData0`,
      async () =>
        await client.readContract({
          args: [mapped0],
          abi: aavePool,
          functionName: "getReserveData",
          address: AAVE_POOL,
          blockNumber: event.blockNumber
        })
    )
    let reserveData1 = await store.retrieve(
      `${event.blockNumber}:aave:reserveData1`,
      async () =>
        await client.readContract({
          args: [mapped1],
          abi: aavePool,
          functionName: "getReserveData",
          address: AAVE_POOL,
          blockNumber: event.blockNumber
        })
    )

    const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //const stables = ["0xdAC17F958D2ee523a2206206994597C13D831ec7", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0x6B175474E89094C44Da98b954EedeAC495271d0F", "0x853d955aCEf822Db058eb8505911ED77F175b99e", "0x4Fabb145d64652a948d72533023f6E7A623C7C53", "0x0000000000085d4780B73119b644AE5ecd22b376", "0x8E870D67F660D95d5be530380D0eC0bd388289E1", "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd"]
    const stables = ["0x5D60473C5Cb323032d6fdFf42380B50E2AE4d245", "0x6e9FDaE1Fe20b0A5a605C879Ae14030a0aE99cF9"]
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
    const tradeDirection: boolean = (amount0Out < amount1Out); // False(0) if direction is token0, True(1) if direction is token1
    let price = 0
    if(tradeDirection){
      price = Number((amount0In*BigInt(1e18 * (10 ** (18 - decimals0))))/(amount1Out * BigInt(10 ** (18 - decimals0))))/(1e18 * (10 ** (18 - decimals0)))
    } else {
      price = 1/((Number((amount1In*BigInt(1e18 * (10 ** (18 - decimals1))))/amount0Out * BigInt(10 ** (18 - decimals0))))/(1e18 * (10 ** (18 - decimals1))))
    }

    let cumulativeVolume0: number  = await store.retrieve(
      `${event.address}:lastSwapCumulativeVol0`,
      async () => {
        const latest = await Swap.find({
          pair: event.address,
        })
          .sort({ timestamp: -1 }) // Sort by decending timestamp
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
          .sort({ timestamp: -1 }) // Sort by decending timestamp
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
          .sort({ timestamp: -1 }) // Sort by decending timestamp
          .limit(1) // Get the top 1 result
          .exec();
        if(latest[0])
          return latest[0].cumulativeVolumeUSD
        return 0
      }
    )
    // console.log(`cumVol0: ${cumulativeVolume0}, cumVol1: ${cumulativeVolume1}, cumVolUSD: ${cumulativeVolumeUSD} DEX: ${labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to}`)
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
    let denominator = BigInt(0);
    if(wethIsUsed){
      denominator = wethIsToken0 ? tradeDirection ? (amount1Out * BigInt(10 ** (18-decimals1))) : (amount1In * BigInt(10 ** (18-decimals1))) : tradeDirection ? (amount0In * BigInt(10 ** (18-decimals0))) : (amount0Out * BigInt(10 ** (18-decimals0)))
    } else {
      // console.log(`${amount0In}, ${amount1In}, ${amount0Out}, ${amount1Out}`)
      // console.log(`decimals0: ${decimals0}, decimals1: ${decimals1}`)
      if(stables.includes(token0)){
        denominator = tradeDirection ? (amount1Out * BigInt(10 ** (18-decimals1))) : (amount1In * BigInt(10 ** (18-decimals1)))
      } else if(stables.includes(token1)) {
        denominator = tradeDirection ? (amount0In * BigInt(10 ** (18-decimals0))) : (amount0Out * BigInt(10 ** (18-decimals0)))
      } else {
        // console.log("ERR: HOW DID WE GET HERE?")
      }
      // console.log(`numerator  : ${numerator}\ndenominator: ${denominator}`)
      // console.log(`**** stables prices: $${numerator / Number(denominator)} ****`)
      // console.log(`***** ${token0Symbol}/${token1Symbol} ****`)
    }
    let priceUSD  = numerator / Number(denominator)
    VolUSD = parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        return Number((await client.getBlock({ blockHash: event.blockHash })).timestamp);
      });
    store.set(`${event.blockHash}:timestamp`, timestamp);
    //console.log(`volUSD: ${VolUSD} wethisToken0: ${wethIsToken0} token0Symbol: ${token0Symbol} token1Symbol: ${token1Symbol}`)
    const USDTVL = wethIsUsed ? (wethIsToken0 ? 2 * (parseFloat(formatUnits(reserves[0], (decimals0) )) * parseFloat(formatUnits(ETHUSDPrice, 8))) : 2 * (parseFloat(formatUnits(reserves[1], (decimals1) )) * parseFloat(formatUnits(ETHUSDPrice, 8)))) : parseFloat(formatUnits(reserves[0], decimals0)) + parseFloat(formatUnits(reserves[1], decimals1))
    const SWAP_FEE = (Number(swapFee)/100000000)
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
      amountIn: tradeDirection ? parseFloat(formatUnits(amount0In, decimals0)) : parseFloat(formatUnits(amount1In, decimals1)),
      amountOut: tradeDirection ? parseFloat(formatUnits(amount1Out,decimals1)) : parseFloat(formatUnits(amount0Out, decimals0)),
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
      cumulativeFeesUSD: parseFloat(formatUnits(BigInt(Math.floor(cumulativeVolumeUSD)), 8))*SWAP_FEE, // trust the process
      reserves0: parseFloat(formatUnits(reserves[0], decimals0)),
      reserves1: parseFloat(formatUnits(reserves[1], decimals1)),
      USDTVL
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

    // TODO: use timestamp instead
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
      `dex:${event.address}:vol`,
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
    let dexVol024H = oldDex ? oldDex.volume024H : Number(0);
    let dexVol01H = oldDex ? oldDex.volume01H : Number(0);
    //let zeroVol = oldDex ? oldDex.cumulativeVolume0 : Number(0);
    let dexName = labels[to.toLowerCase()] ? labels[to.toLowerCase()]['name'] : to;
    //console.log(`Dex: ${dexName}, vol: ${dexVol}`);
    const cumulativeVolumeDex = Number(dexVol) + Number(VolUSD)
    dexVol024H = parseFloat(formatUnits(Number(dexVol024H) + Number(zeroForOne ? amountIn : amountOut), decimals0)).toFixed(decimals0)
    dexVol01H = parseFloat(formatUnits(Number(dexVol01H) + Number(zeroForOne ? amountIn : amountOut), decimals0)).toFixed(decimals0)
    //const cumulativeVolume0 = Number(zeroVol) + Number(zeroForOne ? amountIn : amountOut)
    const priceIn0 = zeroForOne ? parseFloat(formatUnits(amountIn, decimals0)) / parseFloat(formatUnits(amountOut, decimals1)) : 1/(parseFloat(formatUnits(amountOut, decimals1))/parseFloat(formatUnits(amountIn, decimals0)))
    const token0TVL = parseFloat(formatUnits(reserves[0], (decimals0) )) + (parseFloat(formatUnits(reserves[1], (decimals1) )) * Number(priceIn0))
    let estimatedAPR24H = (1 + ((dexVol024H*SWAP_FEE)/token0TVL)) ** 365
    let estimatedAPR1H = (1 + ((dexVol01H*SWAP_FEE)/token0TVL)) ** 365
    let aaveSupplyToken0 = Number(reserveData0['currentLiquidityRate'])
    let aaveSupplyToken1 = Number(reserveData1['currentLiquidityRate'])
    const RAY = 10**27
    const lenderAPR0 = aaveSupplyToken0/RAY
    const lenderAPR1 = aaveSupplyToken1/RAY
    
    let newDex = new Dex({
      address: event.address,
      name: labels[event.address.toLowerCase()] ? labels[event.address.toLowerCase()]['name'] : to,
      cumulativeVolumeUSD: cumulativeVolumeDex,
      cumulativeVolume0: parseFloat(formatUnits(BigInt(cumulativeVolume0), decimals0)).toFixed(decimals0),
      volumeUSD24H: dex24HoursAgo.length > 0 ? cumulativeVolumeDex - dex24HoursAgo[0].cumulativeVolumeUSD : VolUSD,
      volumeUSD1H: dex1HourAgo.length > 0 ? cumulativeVolumeDex - dex1HourAgo[0].cumulativeVolumeUSD : VolUSD,
      volume024H: dexVol024H,
      volume01H: dexVol01H,
      fees024H: SWAP_FEE*dexVol024H,
      fees01H: SWAP_FEE*dexVol01H,
      APR24H: estimatedAPR24H,
      APR1H: estimatedAPR1H,
      USDTVL,
      token0TVL,
      lenderAPR0,
      lenderAPR1,
      token0Managed: parseFloat(formatUnits(token0Managed, decimals0)),
      token1Managed: parseFloat(formatUnits(token1Managed, decimals1)),
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
    store.set(`dex:${event.address}`, await newDex.save());
    console.log(`swapFee: ${swapFee}`)
    console.log(`platformFee: ${platformFee}`)
    console.log(`token0Managed: ${token0Managed}`)
    console.log(`token1Managed: ${token1Managed}`)
    console.log(`token0TVL: ${token0TVL}`)
    console.log(`priceIn0: ${priceIn0}`)
    
    console.log((dexVol024H*SWAP_FEE))
    console.log((dexVol024H*SWAP_FEE)/token0TVL)
    console.log(`estimatedAPR24H: ${estimatedAPR24H}`)
    //console.log(reserveData)
    console.log(token0)
    console.log(token1)
    console.log(reserveData0)
    console.log(reserveData1)
    console.log(`aaveSupplyToken0: ${aaveSupplyToken0}`)
    console.log(`supplyApr0: ${aaveSupplyToken0/RAY}`)
    console.log(`aaveSupplyToken1: ${aaveSupplyToken1}`)
    console.log(`supplyApr1: ${aaveSupplyToken1/RAY}`)
    //console.log(answer)
    //console.log(`from: ${tx.from}\nto:   ${tx.to}\n(to): ${to}`)
    
    //parseFloat(formatUnits(BigInt(Math.floor(VolUSD)), 8))
  };