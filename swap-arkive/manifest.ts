import { Manifest } from 'https://deno.land/x/robo_arkiver/mod.ts'
import { ReservoirPairAbi } from './abis/reservoirPair.ts'
import { Pair } from './entities/pair.ts'
import { Swap } from './entities/swap.ts'
import { Token } from './entities/token.ts'
import { Snapshot } from './entities/snapshot.ts'
import { SnapshotAave } from './entities/snapshotAave.ts'
import { SnapshotHandler } from './handlers/snapshot.ts'
import { SnapshotAaveHandler } from './handlers/snapshotAave.ts'
import { TokenHandler } from './handlers/tokens.ts'
import { SwapHandler, SyncHandler } from './handlers/events.ts'

const manifest = new Manifest('reservoir')
const startBlockHeight = 22206710n
const avalanche = manifest
	.addEntities([Swap, Pair, Token, Snapshot, SnapshotAave])
	.chain('avalanche', { blockRange: 500n })

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
	.addBlockHandler({ blockInterval: 20, startBlockHeight: startBlockHeight, handler: SnapshotAaveHandler })

export default manifest.build()