import { Manifest } from 'https://deno.land/x/robo_arkiver/mod.ts'
import reservoirPair from './abis/reservoirPair.ts'
import { Entities } from './entities/entities.ts'
import { reservoirSwapHandler } from './handlers/swapReservoir.ts'

const manifest = new Manifest('reservoir')

manifest
	.addEntities(Entities)
	.chain('avalanche', { blockRange: 500n })
	.contract(reservoirPair)
	.addSources({ '0xe9cEFa5eeB3d6e8C8AB9e65F164Ac6bac1eeFC9D': 22206754n })
	.addEventHandlers({ 'Swap': reservoirSwapHandler })

export default manifest.build()