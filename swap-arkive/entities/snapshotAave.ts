
import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshotAave {
	res: '1h' | '1d' | '10m'
	from: number,
	to: number,
	token: string,
	apy: number,
}

export const SnapshotAave = createEntity<ISnapshotAave>("SnapshotAave", {
	res: String,
	from: Number,
	to: Number,
	token: String,
	apy: Number,
})