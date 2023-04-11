import { createEntity } from "../deps.ts";

interface IDex {
  address: String;
  name: String;
  cumulativeVolumeUSD: Number;
  volumeUSD24H: Number;
  volumeUSD1H: Number;
  timestamp: Number;
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
  volumeUSD24H: {
    type: Number,
    index: true,
  },
  volumeUSD1H: {
    type: Number,
    index: true,
  },
  timestamp: {
    type: Number,
    index: true,
  }

});