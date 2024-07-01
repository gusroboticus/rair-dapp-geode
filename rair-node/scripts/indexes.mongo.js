require('dotenv').config();
const { MongoClient } = require('mongodb');
const {
  appSecretManager,
  vaultAppRoleTokenManager,
} = require('../bin/vault');
const {
  getMongoConnectionStringURI,
} = require('../bin/shared_backend_code_generated/mongo/mongoUtils');
const mongoConfig = require('../bin/shared_backend_code_generated/config/mongoConfig');

(async function () {
  // Login with vault app role creds first
  await vaultAppRoleTokenManager.initialLogin();

  // Get app secrets from Vault
  await appSecretManager.getAppSecrets({
    vaultToken: vaultAppRoleTokenManager.getToken(),
    listOfSecretsToFetch: [
      mongoConfig.VAULT_MONGO_x509_SECRET_KEY,
    ],
  });

  console.log('Running Database Indexes');

  const mongoConnectionString = await getMongoConnectionStringURI({ appSecretManager });

  const client = await MongoClient.connect(mongoConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db(client.s.options.dbName);

  try {
    await db.collection('User').dropIndexes();
  } catch (e) {
    db.createCollection('User');
  }
  await db.collection('User').createIndex({ publicAddress: 'text', nickName: 'text' }, { weights: { publicAddress: 1, nickName: 3 }, name: 'UserSearchIdx' });

  try {
    await db.collection('Contract').dropIndexes();
  } catch (e) {
    db.createCollection('Contract');
  }
  await db.collection('Contract').createIndex({ user: 1 }, { background: true });
  await db.collection('Contract').createIndex({ contractAddress: 1, blockchain: 1 }, { background: true, unique: true });

  try {
    await db.collection('Product').dropIndexes();
  } catch (e) {
    db.createCollection('Product');
  }
  await db.collection('Product').createIndex({ name: 1 }, { background: true });
  await db.collection('Product').createIndex({ contract: 1 }, { background: true });
  await db.collection('Product').createIndex({ contract: 1, collectionIndexInContract: 1 }, { background: true, unique: true });
  await db.collection('Product').createIndex({ name: 'text' }, { weights: { name: 1 }, name: 'ProductSearchIdx' });

  try {
    await db.collection('OfferPool').dropIndexes();
  } catch (e) {
    db.createCollection('OfferPool');
  }
  await db.collection('OfferPool').createIndex({ contract: 1, product: 1 }, { background: true, unique: true });
  await db.collection('OfferPool').createIndex({ contract: 1, marketplaceCatalogIndex: 1 }, { background: true, unique: true });

  try {
    await db.collection('Offer').dropIndexes();
  } catch (e) {
    db.createCollection('Offer');
  }
  await db.collection('Offer').createIndex({ offerPool: 1 }, { background: true });
  await db.collection('Offer').createIndex({ contract: 1, product: 1 }, { background: true });
  await db.collection('Offer').createIndex({ contract: 1, diamondRangeIndex: 1 }, { background: true });

  try {
    await db.collection('LockedTokens').dropIndexes();
  } catch (e) {
    db.createCollection('LockedTokens');
  }
  await db.collection('LockedTokens').createIndex({ contract: 1, product: 1 }, { background: true });

  try {
    await db.collection('File').dropIndexes();
  } catch (e) {
    db.createCollection('File');
  }
  await db.collection('File').createIndex({ author: 1 }, { background: true });
  await db.collection('File').createIndex({ title: 1 }, { background: true });
  await db.collection('File').createIndex({ creationDate: 1 }, { background: true });
  await db.collection('File').createIndex({ contract: 1, product: 1, offer: 1 }, { background: true });
  await db.collection('File').createIndex({ title: 'text', description: 'text' }, { weights: { title: 1, description: 3 }, name: 'FileSearchIdx' });

  try {
    await db.collection('MintedToken').dropIndexes();
  } catch (e) {
    db.createCollection('MintedToken');
  }
  await db.collection('MintedToken').createIndex({ contract: 1, uniqueIndexInContract: 1 }, { background: true, unique: true, name: 'MintedTokenUniqueIndex' });
  await db.collection('MintedToken').createIndex({ contract: 1, offerPool: 1 }, { background: true });
  await db.collection('MintedToken').createIndex({ contract: 1, offer: 1 }, { background: true });
  await db.collection('MintedToken').createIndex({ 'metadata.name': 'text', 'metadata.description': 'text' }, { weights: { 'metadata.name': 2, 'metadata.description': 1 }, name: 'TokenTextSearchIndex' });

  try {
    await db.collection('Versioning').dropIndexes();
  } catch (e) {
    db.createCollection('Versioning');
  }
  await db.collection('Versioning').createIndex({ name: 1, network: 1 }, { background: true, unique: true });

  try {
    await db.collection('SyncRestriction').dropIndexes();
  } catch (e) {
    db.createCollection('SyncRestriction');
  }
  await db.collection('SyncRestriction').createIndex({ blockchain: 1, contractAddress: 1 }, { background: true, unique: true });

  try {
    await db.collection('Transaction').dropIndexes();
  } catch (e) {
    db.createCollection('Transaction');
  }
  await db.collection('Transaction').createIndex({ _id: 1, blockchainId: 1 }, { background: true, unique: true });

  try {
    await db.collection('FavoriteTokens').dropIndexes();
  } catch (e) {
    db.createCollection('FavoriteTokens');
  }
  await db.collection('FavoriteTokens').createIndex({ userAddress: 1, token: 1 }, { background: true, unique: true });

  console.log('Completed Database Indexes');

  process.exit(0);
}()).catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
