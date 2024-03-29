export const GenericFactoryAbi = [{
  "inputs": [],
  "stateMutability": "nonpayable",
  "type": "constructor",
}, {
  "anonymous": false,
  "inputs": [{
    "indexed": true,
    "internalType": "address",
    "name": "user",
    "type": "address",
  }, {
    "indexed": true,
    "internalType": "address",
    "name": "newOwner",
    "type": "address",
  }],
  "name": "OwnershipTransferred",
  "type": "event",
}, {
  "anonymous": false,
  "inputs": [{
    "indexed": true,
    "internalType": "contract IERC20",
    "name": "token0",
    "type": "address",
  }, {
    "indexed": true,
    "internalType": "contract IERC20",
    "name": "token1",
    "type": "address",
  }, {
    "indexed": false,
    "internalType": "uint256",
    "name": "curveId",
    "type": "uint256",
  }, {
    "indexed": false,
    "internalType": "address",
    "name": "pair",
    "type": "address",
  }],
  "name": "Pair",
  "type": "event",
}, {
  "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
  "name": "_curves",
  "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [{ "internalType": "bytes", "name": "aInitCode", "type": "bytes" }],
  "name": "addCurve",
  "outputs": [{
    "internalType": "uint256",
    "name": "rCurveId",
    "type": "uint256",
  }, { "internalType": "bytes32", "name": "rCodeKey", "type": "bytes32" }],
  "stateMutability": "nonpayable",
  "type": "function",
}, {
  "inputs": [],
  "name": "allPairs",
  "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [{
    "internalType": "contract IERC20",
    "name": "aTokenA",
    "type": "address",
  }, {
    "internalType": "contract IERC20",
    "name": "aTokenB",
    "type": "address",
  }, { "internalType": "uint256", "name": "aCurveId", "type": "uint256" }],
  "name": "createPair",
  "outputs": [{
    "internalType": "address",
    "name": "rPair",
    "type": "address",
  }],
  "stateMutability": "nonpayable",
  "type": "function",
}, {
  "inputs": [],
  "name": "curves",
  "outputs": [{ "internalType": "bytes32[]", "name": "", "type": "bytes32[]" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
  "name": "get",
  "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [{
    "internalType": "bytes32",
    "name": "aCodeKey",
    "type": "bytes32",
  }, {
    "internalType": "contract IERC20",
    "name": "aToken0",
    "type": "address",
  }, {
    "internalType": "contract IERC20",
    "name": "aToken1",
    "type": "address",
  }],
  "name": "getBytecode",
  "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [
    { "internalType": "contract IERC20", "name": "", "type": "address" },
    { "internalType": "contract IERC20", "name": "", "type": "address" },
    { "internalType": "uint256", "name": "", "type": "uint256" },
  ],
  "name": "getPair",
  "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [],
  "name": "owner",
  "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [
    { "internalType": "address", "name": "aTarget", "type": "address" },
    { "internalType": "bytes", "name": "aCalldata", "type": "bytes" },
    { "internalType": "uint256", "name": "aValue", "type": "uint256" },
  ],
  "name": "rawCall",
  "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
  "stateMutability": "nonpayable",
  "type": "function",
}, {
  "inputs": [{ "internalType": "bytes32", "name": "aKey", "type": "bytes32" }, {
    "internalType": "bytes32",
    "name": "aValue",
    "type": "bytes32",
  }],
  "name": "set",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function",
}, {
  "inputs": [],
  "name": "stableMintBurn",
  "outputs": [{
    "internalType": "contract StableMintBurn",
    "name": "",
    "type": "address",
  }],
  "stateMutability": "view",
  "type": "function",
}, {
  "inputs": [{
    "internalType": "address",
    "name": "newOwner",
    "type": "address",
  }],
  "name": "transferOwnership",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function",
}] as const;
