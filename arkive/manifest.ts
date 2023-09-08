import { Manifest } from "./deps.ts";
import { ReservoirPairAbi } from "./abis/reservoirPair.ts";
import { Pair } from "./entities/pair.ts";
import { Swap } from "./entities/swap.ts";
import { Token } from "./entities/token.ts";
import { TokenHandler } from "./handlers/tokens.ts";
import { SwapHandler, SyncHandler } from "./handlers/events.ts";
import { AaveSnapshotHandler } from "./handlers/aaveSnapshot.ts";
import { AaveSnapshot } from "./entities/aaveSnapshot.ts";
import { SnapshotHandler } from "./handlers/pairSnapshot.ts";
import { PairSnapshot } from "./entities/pairSnapshot.ts";
import { GenericFactoryAbi } from "./abis/genericFactory.ts";

export default new Manifest("reservoir-mainnet-v2")
  .addEntities([Swap, Pair, Token, PairSnapshot, AaveSnapshot])
  .addChain("avalanche", (chain) =>
    chain
      .addContract({
        name: "ReservoirRouter",
        abi: GenericFactoryAbi,
        sources: {
          "0xDd723D9273642D82c5761a4467fD5265d94a22da": 31568259n,
        },
      })
      .addContract({
        name: "ReservoirPair",
        abi: ReservoirPairAbi,
        factorySources: {
          ReservoirRouter: {
            Pair: "pair",
          },
        },
        eventHandlers: { "Swap": SwapHandler, "Sync": SyncHandler },
      })
      .addBlockHandler({
        blockInterval: 20,
        startBlockHeight: "live",
        handler: SnapshotHandler,
      })
      .addBlockHandler({
        blockInterval: 20,
        startBlockHeight: "live",
        handler: TokenHandler,
      })
      .addBlockHandler({
        blockInterval: 20,
        startBlockHeight: "live",
        handler: AaveSnapshotHandler,
      }))
  .build();
