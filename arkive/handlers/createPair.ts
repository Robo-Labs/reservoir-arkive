import { EventHandlerFor } from "../deps.ts";
import { GenericFactoryAbi } from "../abis/genericFactory.ts";
import { createPair } from "./pairs.ts";



export const CreatePair: EventHandlerFor<typeof GenericFactoryAbi, "Pair"> = async (
	{ event, client, store },
) => {
  const { curveId, pair } = event.args
  await createPair(client, pair, Number(curveId)) 
}