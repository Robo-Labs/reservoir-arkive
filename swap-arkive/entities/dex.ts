import { createEntity } from "../deps.ts";

interface IDex {
  address: String;
  name: String;
  cumulativeVolumeUSD: Number;
  lastUpdate: Number;
}

export const Dex = createEntity<IDex>("Dex", {
  address: {
    type: String,
    index: true,
  },
  name: {
    type: String,
    index: true,
  },
  cumulativeVolumeUSD: {
    type: Number,
    index: true,
  },
  lastUpdate: {
    type: Number,
    index: true,
  }
});