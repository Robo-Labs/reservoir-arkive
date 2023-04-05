import { Manifest } from "./deps.ts";
import uniswapV2Pair from "./abis/uniswapV2Pair.ts";
import { Swap } from "./entities/swap.ts";
import { swapHandler } from "./handlers/swap.ts";

const manifest = new Manifest();

manifest
	.addEntity(Swap)
	.addChain("ethereum")
	.addContract(uniswapV2Pair)
	.addSource("0xC0d776E2223c9a2ad13433DAb7eC08cB9C5E76ae", 16933523n)
	.addEventHandler("Swap", swapHandler);

export default manifest.build();