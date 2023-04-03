import { Manifest } from "./deps.ts";
import uniswapV2Pair from "./abis/uniswapV2Pair.ts";
import { Swap } from "./entities/swap.ts";
import { swapHandler } from "./handlers/swap.ts";

const manifest = new Manifest();

manifest
	.addEntity(Swap)
	.addChain("ethereum")
	.addContract(uniswapV2Pair)
	.addSource("0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", 27347402n)
	.addEventHandler("Swap", swapHandler);

export default manifest.build();