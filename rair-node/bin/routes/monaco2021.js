const { Router } = require('express');
const _ = require('lodash');
const { ObjectId } = require('mongodb');
const { Contract, Offer, MintedToken } = require('../models');
const AppError = require('../utils/errors/AppError');

const router = Router();

// Get full data about particular product and get list of tokens for it
router.get('/:contractId/:productIndex', async (req, res, next) => {
  try {
    const { contractId, productIndex } = req.params;
    const productInd = productIndex; //  Number(productIndex);
    const [contract] = await Contract.aggregate([
      { $match: { _id: ObjectId(contractId) } },
      {
        $lookup: {
          from: 'Product',
          let: {
            contr: '$_id',
            productInd,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$contract', '$$contr'],
                    },
                    {
                      $eq: ['$collectionIndexInContract', '$$productInd'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'products',
        },
      },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'OfferPool',
          let: {
            contr: '$_id',
            prod: '$products.collectionIndexInContract',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$contract', '$$contr'],
                    },
                    {
                      $eq: ['$product', '$$prod'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'offerPools',
        },
      },
      { $unwind: '$offerPools' },
      {
        $lookup: {
          from: 'Offer',
          let: {
            contr: '$_id',
            productIndex: '$products.collectionIndexInContract',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$contract', '$$contr'],
                    },
                    {
                      $eq: ['$product', '$$productIndex'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'products.offers',
        },
      },
    ]);

    if (_.isEmpty(contract)) {
      return next(new AppError('Product or contract not found.', 404));
    }

    const offers = await Offer.find({
      contract: contract._id,
      product: productInd,
    }).distinct('diamondRangeIndex');

    const options = _.assign(
      {
        contract: contract._id,
      },
      contract.diamond
        ? { offer: { $in: offers } }
        : { offerPool: contract.offerPools.marketplaceCatalogIndex },
    );

    const tokens = await MintedToken.find(options);
    const totalCount = await MintedToken.countDocuments(options);

    if (_.isEmpty(tokens)) {
      return next(new AppError('Tokens not found.', 404));
    }

    res.json({
      success: true,
      result: {
        contract: _.omit(contract, ['offerPools']),
        tokens,
        totalCount,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
