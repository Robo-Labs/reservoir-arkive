import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.11/mod.ts"
import { ReservoirPairAbi } from './abis/reservoirPair.ts'
import { Pair } from './entities/pair.ts'
import { Swap } from './entities/swap.ts'
import { Token } from './entities/token.ts'
import { TokenHandler } from './handlers/tokens.ts'
import { SwapHandler, SyncHandler } from './handlers/events.ts'
import { AaveSnapshotHandler } from './handlers/aaveSnapshot.ts'
import { AaveSnapshot } from './entities/aaveSnapshot.ts'
import { SnapshotHandler } from './handlers/pairSnapshot.ts'
import { PairSnapshot } from './entities/pairSnapshot.ts'

const manifest = new Manifest('reservoir')
const startBlockHeight = 22206710n
const avalanche = manifest
	.addEntities([Swap, Pair, Token, PairSnapshot, AaveSnapshot])
	.chain('avalancheFuji', { blockRange: 500n })

avalanche
	.contract(ReservoirPairAbi)
	.addSources({'0xe9cEFa5eeB3d6e8C8AB9e65F164Ac6bac1eeFC9D': startBlockHeight})
	.addEventHandlers({ 'Swap': SwapHandler })
	.addEventHandlers({ 'Sync': SyncHandler })

// Snapshots
avalanche
	.addBlockHandler({ blockInterval: 100, startBlockHeight: startBlockHeight, handler: SnapshotHandler })

// Price Updates
avalanche
	.addBlockHandler({ blockInterval: 20, startBlockHeight: startBlockHeight, handler: TokenHandler })

// Aave Updates
avalanche
	.addBlockHandler({ blockInterval: 20, startBlockHeight: startBlockHeight, handler: AaveSnapshotHandler })

export default manifest.build()