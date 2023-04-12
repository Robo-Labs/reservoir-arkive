import { Manifest } from "./deps.ts";
import uniswapV2Pair from "./abis/uniswapV2Pair.ts";
import { Swap } from "./entities/swap.ts";
import { Dex } from "./entities/dex.ts";
import { swapHandler } from "./handlers/swap.ts";

const manifest = new Manifest("swap-arkive-v1");

manifest
	.addEntity(Swap)
	.addEntity(Dex)
	.addChain("mainnet", { blockRange: 100n })
	.addContract(uniswapV2Pair)
	.addSource("*", 16962025n)
	.addEventHandler("Swap", swapHandler);

export default manifest.build();