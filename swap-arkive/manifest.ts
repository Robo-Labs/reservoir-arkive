import { Manifest } from "./deps.ts";
import uniswapV2Pair from "./abis/uniswapV2Pair.ts";
import { Swap } from "./entities/swap.ts";
import { Dex } from "./entities/dex.ts";
import { swapHandler } from "./handlers/swap.ts";

const manifest = new Manifest();

manifest
	.addEntity(Swap)
	.addEntity(Dex)
	.addChain("ethereum")
	.addContract(uniswapV2Pair)
	.addSource("0x34b6f33a5d88fca1b8f78a510bc81673611a68f0", 16962025n)
	.addEventHandler("Swap", swapHandler);

export default manifest.build();