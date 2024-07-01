const fs = require('fs');
const _ = require('lodash');
const csv = require('csv-parser');
const AppError = require('../../utils/errors/AppError');
const {
  OfferPool,
  Offer,
  MintedToken,
  Contract,
  Product,
} = require('../../models');
const config = require('../../config');
const { addPin, addFile } =
  require('../../integrations/ipfsService')();
const log = require('../../utils/logger')(module);
const { textPurify, cleanStorage, processPaginationQuery } = require('../../utils/helpers');
const eFactory = require('../../utils/entityFactory');
const { processMetadata } = require('../../utils/metadataClassify');

const { pinata } = config;

const getOffersAndOfferPools = async (contract, product) => {
  let offerPool = [];
  const offers = await Offer.find({
    contract: contract._id,
    product,
  });

  if (_.isEmpty(offers)) {
    throw new AppError('Offers not found.', 404);
  }

  if (!contract.diamond) {
    offerPool = await OfferPool.findOne({
      contract: contract._id,
      product,
    });

    if (_.isEmpty(offerPool)) {
      log.error('Offerpool not found.', 404);
    }
  }

  return [offers, offerPool];
};

const prepareTokens = async (
  tokens,
  metadata,
  contract,
  offers,
  offerPool,
) => {
  const mainFields = { contract: contract._id };

  if (!contract.diamond) {
    mainFields.offerPool = offerPool.marketplaceCatalogIndex;
  }

  const options = _.assign(
    {
      contract: contract._id,
    },
    contract.diamond
      ? { offer: { $in: _.map(offers, (i) => i.diamondRangeIndex) } }
      : { offerPool: offerPool.marketplaceCatalogIndex },
  );
  options.isMinted = false;

  const foundTokens = await MintedToken.find(options);
  foundTokens.forEach((token) => {
    tokens.push({ ...token, isURIStoredToBlockchain: false, metadata });
  });
};

exports.getOfferPoolByContractAndProduct = async (req, res, next) => {
  try {
    const { contract } = req;
    const { product } = req.query;

    if (!contract.diamond) {
      const offerPool = await OfferPool.findOne({
        contract: contract._id,
        product,
      });

      if (_.isEmpty(offerPool)) {
        return next(new AppError('OfferPool not found.', 404));
      }

      req.offerPool = offerPool;
    }

    return next();
  } catch (e) {
    return next(e);
  }
};

exports.getTokenNumbers = async (req, res, next) => {
  try {
    const { contract, offerPool, offers } = req.query;
    const options = {
      contract: contract
    }
    if (offerPool) {
      options.offerPool = offerPool.marketplaceCatalogIndex;
    }
    if (offers) {
      options.offer = { $in: offers }
    }
    const tokens = await MintedToken.find(options)
      .sort([['token', 1]])
      .collation({ locale: 'en_US', numericOrdering: true })
      .distinct('token');
    // handle respond \|/
    if (!tokens || tokens.length === 0) {
      return next(new AppError('No Tokens found', 404));
    }
    return res.json({ success: true, tokens });
  } catch (err) {
    return next(err);
  }
};

exports.getAllTokens = async (req, res, next) => {
  try {
    const { skip, limit, query } = processPaginationQuery(req.query);
    const tokens = await MintedToken.find(query)
      .skip(skip)
      .limit(limit);
    const results = await MintedToken.countDocuments(query);
    return res.json({ results, tokens });
  } catch (err) {
    return next(new AppError(err));
  }
}

exports.updateTokenCommonMetadata = async (req, res, next) => {
  try {
    const { user } = req;
    const newTokens = [];
    let sanitizedMetadataFields = {};
    let metadataFields = _.pick(req.body, [
      'name',
      'description',
      'artist',
      'external_url',
      'image',
      'animation_url',
      'attributes',
    ]);

    const { contract, commonMetadataFor, product } = _.pick(req.body, [
      'contract',
      'commonMetadataFor',
      'product',
    ]);

    if (_.isEmpty(metadataFields)) {
      await cleanStorage(req.files);
      return next(new AppError('Nothing to store.', 400));
    }

    const foundContract = await Contract.findById(contract);

    if (_.isEmpty(foundContract)) {
      await cleanStorage(req.files);
      return next(new AppError('Contract not found.', 404));
    }

    if (!user.superAdmin && user.publicAddress !== foundContract.user) {
      await cleanStorage(req.files);
      return next(new AppError('This contract not belong to you.', 403));
    }

    // upload files to IPFS cloud storage
    const uploadFilesToIpfs = async () => {
      if (_.get(req, 'files.length', false)) {
        const files = await Promise.all(
          _.map(req.files, async (file) => {
            try {
              const cid = await addFile(file.destination, file.filename);
              await addPin(cid, file.filename);

              log.info(`File ${file.filename} has added to ipfs.`);

              // eslint-disable-next-line no-param-reassign
              file.link = `${pinata.gateway}/${cid}/${file.filename}`;

              return file;
            } catch (err) {
              log.error(err);

              return err;
            }
          }),
        );

        try {
          _.chain(metadataFields)
            .pick(['image', 'animation_url'])
            .forEach((value, key) => {
              const v = _.chain(files)
                .find((f) => f.originalname === value)
                .get('link')
                .value();

              if (v) metadataFields[key] = v;
              else delete metadataFields[key];
            })
            .value();
        } catch (err) {
          log.error(err);
        }
      } else {
        metadataFields = _.omit(metadataFields, ['image', 'animation_url']);
      }

      // sanitize fields
      _.forEach(metadataFields, (v, k) => {
        sanitizedMetadataFields[k] = _.includes(
          ['image', 'animation_url', 'external_url', 'attributes'],
          k,
        )
          ? v
          : textPurify.sanitize(v);
      });
    };

    if (commonMetadataFor === 'contract') {
      await uploadFilesToIpfs();

      // set singleMetadata to true for found contract
      await foundContract.updateOne({ singleMetadata: true });

      const foundProducts = await Product.find({ contract: foundContract._id });

      if (!foundProducts) {
        await cleanStorage(req.files);
        return next(
          new AppError(
            `Products for contract ${foundContract._id} not found.`,
            404,
          ),
        );
      }

      await Promise.all(
        _.map(foundProducts, async (foundProduct) => {
          try {
            const [offers, offerPool] = await getOffersAndOfferPools(
              foundContract,
              foundProduct.collectionIndexInContract,
            );

            return prepareTokens(
              newTokens,
              sanitizedMetadataFields,
              foundContract,
              offers,
              offerPool,
            );
          } catch (err) {
            log.error(`for product ${foundProduct.collectionIndexInContract} ${err.message}`);
            return undefined;
          }
        }),
      );
    } else {
      try {
        const foundProduct = await Product.findOne({
          contract: foundContract._id,
          collectionIndexInContract: product,
        });

        if (!foundProduct) {
          await cleanStorage(req.files);
          return next(
            new AppError(
              `Product for contract ${foundContract._id} not found.`,
              404,
            ),
          );
        }

        const [offers, offerPool] = await getOffersAndOfferPools(
          foundContract,
          product,
        );

        await uploadFilesToIpfs();

        // set singleMetadata to true for found product
        await foundProduct.updateOne({ singleMetadata: true });

        await prepareTokens(
          newTokens,
          sanitizedMetadataFields,
          foundContract,
          offers,
          offerPool,
        );
      } catch (err) {
        return next(new AppError(`${err.message}`, 404));
      }
    }

    const [offers, offerPool] = await getOffersAndOfferPools(
      foundContract,
      product,
    );

    const filterOptions = _.assign(
      {
        contract: foundContract._id,
      },
      contract.diamond
        ? { offer: { $in: _.map(offers, (i) => i.diamondRangeIndex) } }
        : { offerPool: offerPool.marketplaceCatalogIndex },
    );

    if (!_.isEmpty(newTokens)) {
      try {
        sanitizedMetadataFields = _.mapKeys(
          sanitizedMetadataFields,
          (v, k) => `metadata.${k}`,
        );

        await MintedToken.updateMany(filterOptions, {
          ...sanitizedMetadataFields,
          isMetadataPinned: false,
          isURIStoredToBlockchain: false,
        }, { new: true });

        log.info('All tokens is updated.');
      } catch (err) {
        log.error(err);
      }
    } else {
      await cleanStorage(req.files);
      return next(new AppError("Don't have tokens for updating.", 400));
    }

    await cleanStorage(req.files);

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

exports.getSingleToken = eFactory.getOne(MintedToken, {
  filter: {
    contract: 'contract._id',
    token: 'params.token',
    specificFilterOptions: 'specificFilterOptions',
  },
});

exports.updateSingleTokenMetadata = async (req, res, next) => {
  try {
    const { contract, offers, offerPool } = req;
    const { token } = req.params;
    const { user } = req;
    const fieldsForUpdate = _.pick(req.body, [
      'name',
      'description',
      'artist',
      'external_url',
      'image',
      'animation_url',
      'attributes',
    ]);

    const options = _.assign(
      {
        contract: contract._id,
        token,
      },
      contract.diamond
        ? { offer: { $in: offers } }
        : { offerPool: offerPool.marketplaceCatalogIndex },
    );

    if (!user.superAdmin && user.publicAddress !== contract.user) {
      if (_.get(req, 'files.length', false)) {
        await Promise.all(
          _.map(req.files, async (file) => {
            await fs.promises.rm(`${file.destination}/${file.filename}`);
            log.info(`File ${file.filename} has removed.`);
          }),
        );
      }

      return next(
        new AppError(
          `You have no permissions for updating token ${token}.`,
          403,
        ),
      );
    }

    if (_.isEmpty(fieldsForUpdate)) {
      if (_.get(req, 'files.length', false)) {
        await Promise.all(
          _.map(req.files, async (file) => {
            await fs.rm(`${file.destination}/${file.filename}`);
            log.info(`File ${file.filename} has removed.`);
          }),
        );
      }

      return next(new AppError('Nothing to update.', 400));
    }

    const countDocuments = await MintedToken.countDocuments(options);

    if (countDocuments === 0) {
      if (_.get(req, 'files.length', false)) {
        await Promise.all(
          _.map(req.files, async (file) => {
            await fs.promises.rm(`${file.destination}/${file.filename}`);
            log.info(`File ${file.filename} has removed.`);
          }),
        );
      }

      return next(new AppError('Token not found.', 400));
    }

    if (_.get(req, 'files.length', false)) {
      const files = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const file of req.files) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const cid = await addFile(file.destination, file.filename);
          // eslint-disable-next-line no-await-in-loop
          await addPin(cid, file.filename);

          log.info(`File ${file.filename} has added to ipfs.`);

          file.link = `${pinata.gateway}/${cid}/${file.filename}`;

          files.push(file);
        } catch (err) {
          log.error(err);

          return err;
        }
      }

      _.chain(fieldsForUpdate)
        .pick(['image', 'animation_url'])
        .forEach((value, key) => {
          const v = _.chain(files)
            .find((f) => f.originalname === value)
            .get('link')
            .value();

          if (v) fieldsForUpdate[key] = v;
          else delete fieldsForUpdate[key];
        })
        .value();
    }

    // sanitize fields
    let sanitizedFieldsForUpdate = {};
    _.forEach(fieldsForUpdate, (v, k) => {
      sanitizedFieldsForUpdate[k] = _.includes(
        ['image', 'animation_url', 'external_url', 'attributes'],
        k,
      )
        ? v
        : textPurify.sanitize(v);
    });

    sanitizedFieldsForUpdate = _.mapKeys(
      sanitizedFieldsForUpdate,
      (v, k) => `metadata.${k}`,
    );

    const updatedToken = await MintedToken.findOneAndUpdate(
      options,
      {
        ...sanitizedFieldsForUpdate,
        isMetadataPinned: false,
        isURIStoredToBlockchain: false,
      },
      { new: true },
    );

    if (_.get(req, 'files.length', false)) {
      await Promise.all(
        _.map(req.files, async (file) => {
          await fs.promises.rm(`${file.destination}/${file.filename}`);
          log.info(`File ${file.filename} has removed.`);
        }),
      );
    }

    return res.json({ success: true, token: updatedToken });
  } catch (err) {
    if (_.get(req, 'files.length', false)) {
      await Promise.all(
        _.map(req.files, async (file) => {
          await fs.promises.rm(`${file.destination}/${file.filename}`);
          log.info(`File ${file.filename} has removed.`);
        }),
      );
    }

    return next(err);
  }
};

exports.getFullTokenInfo = async (req, res, next) => {
  const { id } = req.params;
  const tokenData = await MintedToken.findById(id).lean();
  if (!tokenData) {
    return next(new AppError('No token information found'));
  }
  const contractData = await Contract.findById(tokenData.contract);
  if (!contractData) {
    return next(new AppError('No contract information found'));
  }
  tokenData.contract = contractData;
  const rangeQuery = {
    contract: tokenData.contract._id,
  };
  if (tokenData.contract.diamond) {
    rangeQuery.diamondRangeIndex = tokenData.offer;
  } else {
    rangeQuery.offerIndex = tokenData.offer;
  }
  const rangeData = await Offer.findOne(rangeQuery);
  if (rangeData) {
    tokenData.range = rangeData;
    const productData = await Product.findOne({
      contract: tokenData.contract._id,
      collectionIndexInContract: rangeData.product,
    });
    if (productData) {
      tokenData.product = productData;
    }
  }
  return res.json({ success: true, tokenData });
};

exports.createTokensViaCSV = async (req, res, next) => {
  try {
    const { contract, product, forceOverwrite = 'false' } = req.body;
    const { user } = req;
    const prod = product;
    const defaultFields = ['nftid', 'name', 'description', 'artist'];
    const optionalFields = ['image', 'animation_url', 'publicaddress', 'base_external_url'];
    const reg =
      /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/gm;
    const records = [];
    const forUpdate = [];
    const tokens = [];
    let foundTokens = [];

    const foundContract = await Contract.findById(contract);

    if (foundContract === null) {
      return next(new AppError('Contract not found.', 404));
    }

    if (!user.superAdmin && user.publicAddress !== foundContract.user) {
      return next(new AppError('User is not owner of contract', 403));
    }

    const offerPool = await OfferPool.findOne({
      contract: foundContract._id,
      product: prod,
    });
    const offers = await Offer.find({
      contract: foundContract._id,
      product: prod,
    });

    if (offers.length === 0) {
      await cleanStorage(req.file);
      return next(new AppError('Offers not found.', 404));
    }

    const offerIndexes = offers.map((v) =>
      (foundContract.diamond ? v.diamondRangeIndex : v.offerIndex));
    const foundProduct = await Product.findOne({
      contract,
      collectionIndexInContract: product,
    });

    if (foundProduct === null) {
      await cleanStorage(req.file);
      return next(new AppError('Product not found.', 404));
    }

    if (foundContract.diamond) {
      foundTokens = await MintedToken.find({
        contract,
        offer: { $in: offerIndexes },
      });
    } else {
      if (offerPool === null) {
        await cleanStorage(req.file);
        return next(new AppError('Offer Pool not found.', 404));
      }

      foundTokens = await MintedToken.find({
        contract,
        offerPool: offerPool.marketplaceCatalogIndex,
      });
    }

    // Processing file input
    await new Promise((resolve, reject) =>
      // eslint-disable-next-line no-promise-executor-return
      fs
        .createReadStream(`${req.file.destination}${req.file.filename}`)
        .pipe(
          csv({
            mapHeaders: ({ header }) => {
              let h = header.toLowerCase();
              h = h.replace(/\s/g, '');

              if (
                defaultFields.includes(h) ||
                optionalFields.includes(h)
              ) {
                return h;
              }

              return header;
            },
          }),
        )
        .on('data', (data) => {
          const foundFields = _.keys(data);
          let isValid = true;
          let isCoverPresent = false;

          defaultFields.forEach((field) => {
            if (!foundFields.includes(field)) {
              isValid = false;
            }
          });

          optionalFields.forEach((field) => {
            if (foundFields.includes(field)) {
              isCoverPresent = true;
            }
          });

          if (isValid && isCoverPresent) records.push(data);
        })
        .on('end', () => {
          offers.forEach((offer) => {
            records.forEach((record) => {
              const token = record.nftid;

              if (
                BigInt(token) >= BigInt(offer.range[0]) &&
                BigInt(token) <= BigInt(offer.range[1])
              ) {
                const attributes = _.chain(record)
                  .assign({})
                  .omit(_.concat(defaultFields, optionalFields))
                  .reduce((re, v, k) => {
                    re.push({ trait_type: k, value: v });
                    return re;
                  }, [])
                  .value();
                const foundToken = _.find(
                  foundTokens,
                  (t) =>
                    t.offer ===
                      (foundContract.diamond
                        ? offer.diamondRangeIndex
                        : offer.offerIndex) && t.token === token,
                );
                if (!foundToken) {
                  log.error(`Cannot find token ${token} in offer ${offer.offerName} in contract ${contract}`);
                  return;
                }
                const mainFields = {
                  _id: foundToken._id,
                };

                if (!foundContract.diamond) {
                  mainFields.offerPool = offerPool.marketplaceCatalogIndex;
                }

                const offerIndex = foundContract.diamond
                  ? offer.diamondRangeIndex
                  : offer.offerIndex;

                const externalURL = encodeURI(
                  `https://${process.env.SERVICE_HOST}/${foundContract._id}/${foundProduct.collectionIndexInContract}/${offerIndex}/${token}`,
                );

                const validReasonsToUpdateAToken =
                  foundToken &&
                  !foundToken.isMinted;

                if (forceOverwrite === 'true' || validReasonsToUpdateAToken) {
                  forUpdate.push({
                    updateOne: {
                      filter: mainFields,
                      update: {
                        isURIStoredToBlockchain: false,
                        metadata: {
                          name: textPurify.sanitize(record.name),
                          description: textPurify.sanitize(record.description),
                          artist: textPurify.sanitize(record.artist),
                          external_url: externalURL,
                          image: record.image || '',
                          animation_url: record.animation_url || '',
                          isMetadataPinned: reg.test(token.metadataURI || ''),
                          attributes,
                        },
                      },
                    },
                  });

                  tokens.push(token);
                }
              }
            });

            return resolve(records);
          });

          if (_.isEmpty(offers)) resolve();
        })
        .on('error', reject));

    await cleanStorage(req.file);
    let updatedDocuments = 0;
    if (forUpdate.length > 0) {
      try {
        const bulkWriteResult = await MintedToken.bulkWrite(forUpdate, { ordered: false });
        if (bulkWriteResult.ok) {
          updatedDocuments = bulkWriteResult.modifiedCount;
        }
      } catch (err) {
        log.error(err);
      }
    }
    await processMetadata(foundContract._id, foundProduct.collectionIndexInContract);
    return res.json({ success: true, updatedDocuments });
  } catch (err) {
    return next(err);
  }
};
