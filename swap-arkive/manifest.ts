import { Manifest } from "./deps.ts";
import uniswapV3Pair from "./abis/uniswapV3Pair.ts";
import { Swap } from "./entities/swap.ts";
import { Dex } from "./entities/dex.ts";
import { swapHandler } from "./handlers/swapv3.ts";

const manifest = new Manifest("swap-arkive-v2");

manifest
	.addEntity(Swap)
	.addEntity(Dex)
	.addChain("mainnet", { blockRange: 5n })
	.addContract(uniswapV3Pair)
	.addSource("*", 16962025n)
	.addEventHandler("Swap", swapHandler);

export default manifest.build();