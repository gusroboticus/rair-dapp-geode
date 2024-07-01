const {
  PORT,
  PRODUCTION,
  GCP_PROJECT_ID,
  GCP_IMAGE_BUCKET_NAME,
  GCP_VIDEO_BUCKET_NAME,
  GCP_CREDENTIALS,
  GCP_GATEWAY,
  PINATA_GATEWAY,
  IPFS_GATEWAY,
  IPFS_SERVICE,
  REDIS_HOST,
  REDIS_PORT,
  SESSION_SECRET,
  SESSION_TTL,
  SENTRY_DSN,
  LOG_LEVEL,
  ADMIN_NETWORK,
  ADMIN_CONTRACT,
  SUPER_ADMIN_VAULT_STORE,
  ZOOMSECRET,
  ZOOMCLIENTID,
  ALCHEMY_API_KEY,
} = process.env;
const { Network } = require('alchemy-sdk');

const binanceTestnetData = {
  name: 'Binance Testnet',
  blockchainId: '0x61',
  testnet: true,
  rpc: process.env.BINANCE_TESTNET_RPC,
};
const binanceMainnetData = {
  name: 'Binance Mainnet',
  blockchainId: '0x38',
  testnet: false,
  rpc: process.env.BINANCE_MAINNET_RPC,
};
const ethereumMainnetData = {
  name: 'Ethereum Mainnet',
  blockchainId: '0x1',
  testnet: false,
  rpc: process.env.ETHEREUM_MAINNET_RPC,
};
const ethereumSepoliaData = {
  name: 'Ethereum Sepolia',
  blockchainId: '0xaa36a7',
  testnet: true,
  rpc: process.env.ETHEREUM_TESTNET_SEPOLIA_RPC,
};
const polygonMainnetData = {
  name: 'Polygon Mainnet',
  blockchainId: '0x89',
  testnet: false,
  rpc: process.env.MATIC_MAINNET_RPC,
};
const polygonTestnetData = {
  name: 'Polygon Testnet',
  blockchainId: '0x13881',
  testnet: true,
  rpc: process.env.MATIC_TESTNET_RPC,
};
const astarMainnetData = {
  name: 'Astar Mainnet',
  blockchainId: '0x250',
  testnet: true,
  rpc: process.env.ASTAR_MAINNET_RPC,
};
const baseMainnetData = {
  name: 'Base Mainnet',
  blockchainId: '0x2105',
  testnet: false,
  rpc: process.env.BASE_MAINNET_RPC,
};

module.exports = {
  production: !!(PRODUCTION && PRODUCTION === 'true'),
  port: PORT || 5000,
  logLevel: LOG_LEVEL || 'info',
  admin: {
    network: ADMIN_NETWORK,
    contract: ADMIN_CONTRACT,
  },
  zoom: {
    zoomSecret: ZOOMSECRET,
    zoomClientID: ZOOMCLIENTID,
  },
  superAdmin: {
    storageKey: SUPER_ADMIN_VAULT_STORE || null,
  },
  blockchain: {
    networks: {
      '0x250': astarMainnetData,
      astar: astarMainnetData,

      '0x13881': polygonTestnetData,
      mumbai: polygonTestnetData,

      '0x89': polygonMainnetData,
      matic: polygonMainnetData,

      '0x38': binanceMainnetData,
      'binance-mainnet': binanceMainnetData,

      '0x61': binanceTestnetData,
      'binance-testnet': binanceTestnetData,

      '0x1': ethereumMainnetData,
      ethereum: ethereumMainnetData,

      sepolia: ethereumSepoliaData,
      '0xaa36a7': ethereumSepoliaData,

      base: baseMainnetData,
      '0x2105': baseMainnetData,
    },
  },
  gcp: {
    projectId: GCP_PROJECT_ID,
    imageBucketName: GCP_IMAGE_BUCKET_NAME,
    videoBucketName: GCP_VIDEO_BUCKET_NAME,
    credentials: GCP_CREDENTIALS,
    gateway: GCP_GATEWAY,
  },
  pinata: {
    gateway: PINATA_GATEWAY,
  },
  ipfs: {
    gateway: IPFS_GATEWAY,
  },
  ipfsService: IPFS_SERVICE || 'pinata',
  redis: {
    connection: { host: REDIS_HOST, port: REDIS_PORT },
  },
  session: {
    secret: SESSION_SECRET,
    ttl: SESSION_TTL || 10,
  },
  sentry: {
    dsn: SENTRY_DSN || '',
    serverName: 'rairnode',
    logLevels: ['error'],
  },
  alchemy: {
    apiKey: ALCHEMY_API_KEY,
    networkMapping: {
      '0x1': Network.ETH_MAINNET,
      '0xaa36a7': Network.ETH_SEPOLIA,
      '0x89': Network.MATIC_MAINNET,
      '0x13881': Network.MATIC_MUMBAI,
      '0x250': Network.ASTAR_MAINNET,
      '0x2105': Network.BASE_MAINNET,
    },
  },
  ipfsGateways: {
    filebase: 'https://rair.myfilebase.com/ipfs/',
    pinata: 'https://ipfs.io/ipfs/',
    ipfs: 'https://ipfs.io/ipfs/',
  },
};
