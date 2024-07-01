const { exec } = require('child_process');
const _ = require('lodash');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { promises: fs } = require('fs');
const { checkBalanceProduct, checkAdminTokenOwns, checkBalanceAny } = require('../integrations/ethers/tokenValidation');
const log = require('./logger')(module);
const { Contract, Offer, Unlock } = require('../models');

const execPromise = (command, options = {}) => new Promise((resolve, reject) => {
  exec(command, options, (error/* , stdout, stderr */) => {
    if (error) {
      return reject(error);
    }
    return resolve();
  });
});

const checkFileAccess = async (files, user) => {
  const result = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const file of files) {
    delete file.key;
    if (!user?.publicAddress) {
      file.isUnlocked = false;
      result.push(file);
      // eslint-disable-next-line no-continue
      continue;
    }
    if (file.demo) {
      file.isUnlocked = true;
      result.push(file);
      // eslint-disable-next-line no-continue
      continue;
    }
    const unlocks = await Unlock.aggregate([
      {
        $match: {
          file: file._id,
        },
      }, {
        $lookup: {
          from: 'Offer',
          localField: 'offers',
          foreignField: '_id',
          as: 'offers',
        },
      }, {
        $lookup: {
          from: 'Contract',
          localField: 'offers.contract',
          foreignField: '_id',
          as: 'contractData',
        },
      },
    ]);

    if (!unlocks[0]) {
      file.isUnlocked = false;
      result.push(file);
      // eslint-disable-next-line no-continue
      continue;
    }

    const offerData = unlocks[0].offers.map((item) => item);
    const contractData = unlocks[0].contractData.map((item) => item);

    let ownsMediaNFT = false;

    try {
      if (file.uploader === user.publicAddress) {
        ownsMediaNFT = true;
      } else if (offerData) {
        const contractMapping = {};
        contractData.forEach((contract) => {
          contractMapping[contract._id] = contract;
        });
        if (await checkAdminTokenOwns(user.publicAddress)) {
          ownsMediaNFT = true;
          log.info(`User address ${
            user.publicAddress
          } unlocked media ${file._id} with admin privileges`);
        }
        if (!ownsMediaNFT) {
          // eslint-disable-next-line no-restricted-syntax
          for await (const offer of offerData) {
            const contract = contractMapping[offer.contract];
            if (contract.external) {
              ownsMediaNFT = await checkBalanceAny(
                user.publicAddress,
                contract.blockchain,
                contract.contractAddress,
              );
            } else {
              ownsMediaNFT = await checkBalanceProduct(
                user.publicAddress,
                contract.blockchain,
                contract.contractAddress,
                offer.product,
                offer.range[0],
                offer.range[1],
              );
            }
            if (ownsMediaNFT) {
              log.info(`User ${user.publicAddress} unlocked ${file._id} with offer ${offer._id}: ${offer.offerName} in ${contract.blockchain}`);
              break;
            }
          }
        }
      } else {
        ownsMediaNFT = true;
        log.info(`Media ${file._id} is flagged as demo, will not validate NFT ownership`);
      }
    } catch (e) {
      log.error(e);
      // eslint-disable-next-line no-continue
      continue;
    }
    file.isUnlocked = !!ownsMediaNFT;
    result.push(file);
  }
  return result;
};

const verifyAccessRightsToFile = (files, user) => Promise.all(_.map(files, async (file) => {
  const clonedFile = _.assign({ isUnlocked: false }, file.toObject ? file.toObject() : file);
  const ownsTheAccessTokens = [];

  if (clonedFile.demo) {
    clonedFile.isUnlocked = true;
    return clonedFile;
  }

  // if (!clonedFile.isUnlocked && !!user) {
  // TODO: use that functionality instead of calling blockchain when
  //      resale of tokens functionality will be working and new
  //      owner of token will be changing properly
  //
  //   const foundContract = await Contract.findById(file.contract);
  //
  //   let options = {
  //     ownerAddress: user.publicAddress,
  //     contract: foundContract._id,
  //     offer: { $in: file.offer },
  //   };
  //
  //   if (!foundContract.diamond) {
  //     const offerPool = await OfferPool.findOne({
  //       contract: foundContract._id,
  //       product: file.product,
  //     });
  //
  //     if (_.isEmpty(offerPool)) return res.status(404).send({
  //        success: false,
  //        message: 'OfferPools not found.'
  //      });
  //
  //     options = _.assign(options, { offerPool: offerPool.marketplaceCatalogIndex });
  //   }
  //
  //   const countOfTokens = await MintedToken.countDocuments(options);
  //
  //   if (countOfTokens > 0) clonedFile.isUnlocked = true;
  // }

  if (user) {
    // verify the account holds the required NFT
    if (user.publicAddress === clonedFile.uploader) {
      // Verifying account has token
      try {
        clonedFile.isUnlocked = await checkAdminTokenOwns(user.publicAddress);
      } catch (e) {
        log.error(`Could not verify account: ${e}`);
        clonedFile.isUnlocked = false;
      }
    }

    if (!clonedFile.isUnlocked) {
      const contract = await Contract.findOne(file.contract);
      if (!contract) {
        log.error(`Could not find contract ${file.contract}`);
      } else {
        const offers = await Offer.find(_.assign(
            { contract: file.contract },
            contract.diamond
                ? { diamondRangeIndex: { $in: file.offer } }
                : { offerIndex: { $in: file.offer } },
        ));

        // verify the user have needed tokens
        // eslint-disable-next-line no-restricted-syntax
        for await (const offer of offers) {
          ownsTheAccessTokens.push(await checkBalanceProduct(
              user.publicAddress,
              contract.blockchain,
              contract.contractAddress,
              offer.product,
              offer.range[0],
              offer.range[1],
          ));
          if (ownsTheAccessTokens.includes(true)) {
            clonedFile.isUnlocked = true;
            break;
          }
        }
      }
    }
  }

  return clonedFile;
}));

// XSS sanitizer
const textPurify = () => {
  const { window } = new JSDOM('');
  return createDOMPurify(window);
};

// Remove files from temporary server storage
const cleanStorage = async (files) => {
  if (files) {
    const preparedFiles = [].concat(files);
    await Promise.all(
        _.map(preparedFiles, async (file) => {
          await fs.rm(`${file.destination}/${file.filename}`);
          log.info(`File ${file.filename} has removed.`);
        }),
    );
  }
};

const attributesCounter = (tokens = []) => {
  const totalNumber = tokens.length;
  const allAttributesVariants = new Set();
  tokens.forEach((token) => {
    const { metadata } = token;
    const { attributes = [] } = metadata;
    attributes.forEach((attribute) => {
      allAttributesVariants.add(JSON.stringify(attribute));
    });
  });

  const allAttributesVariantsArray = Array.from(allAttributesVariants);

  const attributesCounts = allAttributesVariantsArray.reduce((prev, item) => {
    const tokensWithCurrentAttribute = tokens.filter(({ metadata }) => metadata.attributes
    .map((attribute) => JSON.stringify(attribute))
    .includes(item));
    return [...prev, tokensWithCurrentAttribute.length];
  }, []);

  return tokens.map((token) => {
    const { metadata } = token;
    metadata.attributes = metadata.attributes.map((attribute) => {
      const attributeCountIndex = allAttributesVariantsArray.indexOf(JSON.stringify(attribute));
      const count = attributesCounts[attributeCountIndex];
      const percentage = `${((count / totalNumber) * 100).toFixed()}%`;
      return { ...attribute, percentage };
    });
    return { ...token, metadata };
  });
};

const processPaginationQuery = (queryFields) => {
  let { itemsPerPage, pageNum, ...query } = queryFields;
  if (!pageNum || pageNum === '') {
      pageNum = 1;
  }
  if (!itemsPerPage || itemsPerPage === '') {
      itemsPerPage = 10;
  }

  const limit = parseInt(itemsPerPage, 10);
  const skip = (parseInt(pageNum, 10) - 1) * limit;

  return { skip, limit, query };
}

module.exports = {
  attributesCounter,
  execPromise,
  verifyAccessRightsToFile,
  textPurify: textPurify(),
  cleanStorage,
  checkFileAccess,
  processPaginationQuery,
};
