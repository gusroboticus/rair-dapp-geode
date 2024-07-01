import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber, utils } from 'ethers';

import { RootState } from '../../../ducks';
import { ColorStoreType } from '../../../ducks/colors/colorStore.types';
import { ContractsInitialType } from '../../../ducks/contracts/contracts.types';
import useSwal from '../../../hooks/useSwal';
import useWeb3Tx from '../../../hooks/useWeb3Tx';
import chainData from '../../../utils/blockchainData';
import CustomFeeRow from '../common/customFeeRow';
import {
  IMarketplaceOfferConfig,
  TCustomPayments
} from '../creatorStudio.types';

const MarketplaceOfferConfig: React.FC<IMarketplaceOfferConfig> = ({
  array,
  index,
  nodeFee,
  minterDecimals,
  treasuryFee,
  treasuryAddress,
  simpleMode,
  rerender,
  enabled
}) => {
  const item = array[index];
  const { currentUserAddress, diamondMarketplaceInstance, currentChain } =
    useSelector<RootState, ContractsInitialType>(
      (store) => store.contractStore
    );
  const { textColor, primaryButtonColor } = useSelector<
    RootState,
    ColorStoreType
  >((store) => store.colorStore);
  const [marketValuesChanged, setMarketValuesChanged] =
    useState<boolean>(false);
  const reactSwal = useSwal();
  const { web3TxHandler } = useWeb3Tx();

  const [customPayments, setCustomPayments] = useState<TCustomPayments[]>([
    {
      message: 'Node address',
      recipient: import.meta.env.VITE_NODE_ADDRESS,
      percentage: nodeFee,
      canBeContract: false,
      editable: false
    },
    {
      message: 'Treasury address',
      recipient: treasuryAddress,
      percentage: treasuryFee,
      canBeContract: false,
      editable: false
    },
    {
      message: 'Creator address (You)',
      recipient: currentUserAddress,
      percentage: BigNumber.from(10)
        .pow(minterDecimals | 3)
        .mul(95),
      canBeContract: false,
      editable: true
    }
  ]);
  useEffect(() => {
    if (!array[index].marketData || !!array[index]._id === false) {
      return;
    }
    setCustomPayments(
      [
        {
          message: 'Node address',
          recipient: import.meta.env.VITE_NODE_ADDRESS,
          percentage: nodeFee,
          canBeContract: false,
          editable: false
        },
        {
          message: 'Treasury address',
          recipient: treasuryAddress,
          percentage: treasuryFee,
          canBeContract: false,
          editable: false
        }
      ].concat(
        array[index].marketData.fees.map((fee: TCustomPayments) => ({
          recipient: fee.recipient,
          percentage: BigNumber.from(fee.percentage),
          editable: true,
          canBeContract: false,
          message: 'Data from the marketplace'
        }))
      )
    );
  }, [array, index, nodeFee, treasuryAddress, treasuryFee]);

  const removePayment = (index: number) => {
    const aux = [...customPayments];
    aux.splice(index, 1);
    setCustomPayments(aux);
  };

  const addPayment = () => {
    const aux = [...customPayments];
    aux.push({
      recipient: '',
      percentage: BigNumber.from(0),
      canBeContract: false,
      editable: true
    });
    setCustomPayments(aux);
  };

  useEffect(() => {
    array[index].customSplits = customPayments;
  }, [customPayments, rerender, array, index]);

  const total = customPayments.reduce((prev, current) => {
    return Number(prev) + Number(current.percentage);
  }, 0);
  const updateAvailable = simpleMode || !marketValuesChanged;

  return (
    <div
      className={`rounded-rair col-12 col-md-12 ${
        !item.selected && !item._id && 'text-secondary'
      }`}>
      <div className="row w-100 p-3">
        <div className="col-10 rounded-rair text-start">
          <h3>{item.offerName}</h3>
          <h5 style={{ display: 'inline' }}>{item.copies}</h5> tokens available
          for{' '}
          <h5 style={{ display: 'inline' }}>
            {utils.formatEther(item.price)}{' '}
            {currentChain && chainData[currentChain]?.symbol}
          </h5>
        </div>
        <div className="col-2 rounded-rair text-end">
          {item._id && item.diamondRangeIndex && item.offerIndex && (
            <button
              disabled={updateAvailable || enabled}
              style={{
                color: textColor,
                background: updateAvailable ? 'green' : primaryButtonColor,
                border: `solid 1px ${textColor}`
              }}
              className="btn col-12 rair-button"
              onClick={async () => {
                if (!diamondMarketplaceInstance) {
                  return;
                }
                reactSwal.fire({
                  title: 'Updating offer',
                  html: 'Please wait...',
                  icon: 'info',
                  showConfirmButton: false
                });
                if (
                  await web3TxHandler(
                    diamondMarketplaceInstance,
                    'updateMintingOffer',
                    [
                      item.offerIndex,
                      customPayments.filter((item) => item.editable),
                      array[index].marketData.visible
                    ]
                  )
                ) {
                  reactSwal.fire({
                    title: 'Success',
                    html: 'The offer has been updated',
                    icon: 'success',
                    showConfirmButton: true
                  });
                }
              }}>
              <small>
                {updateAvailable ? 'On the marketplace!' : 'Update offer'}
              </small>
            </button>
          )}
          {item._id && item.diamondRangeIndex && !item.offerIndex && (
            <button
              onClick={() => {
                array[index].selected = !array[index].selected;
                rerender();
              }}
              className={`btn col-12 btn-${
                array[index].selected ? 'royal-ice' : 'danger'
              } rounded-rair`}>
              {!array[index]?.selected && 'Not'} Selected{' '}
              <i
                className={`fas fa-${
                  array[index].selected ? 'check' : 'times'
                }`}
              />
            </button>
          )}
          {!simpleMode && (
            <button
              disabled={!array[index].selected && !item._id}
              onClick={() => {
                array[index].marketData.visible =
                  !array[index].marketData.visible;
                rerender();
                if (!marketValuesChanged) {
                  setMarketValuesChanged(true);
                }
              }}
              className={`btn col-12 btn-${
                array[index]?.marketData?.visible ? 'royal-ice' : 'danger'
              } rounded-rair`}>
              <abbr
                title={
                  array[index]?.marketData?.visible
                    ? 'Tokens can be sold'
                    : "Tokens won't be sold"
                }>
                {!array[index]?.marketData?.visible && 'Not'} Visible{' '}
                <i
                  className={`fas fa-${
                    array[index]?.marketData?.visible ? 'eye' : 'eye-slash'
                  }`}
                />
              </abbr>
            </button>
          )}
        </div>
        {!simpleMode && (
          <details
            className="text-start col-12"
            style={{ position: 'relative' }}>
            <summary className="mb-1">
              <small>Royalty splits</small>
            </summary>
            {customPayments?.length !== 0 && (
              <table className="col-12 text-start">
                <thead>
                  <tr>
                    <th>Recipient Address</th>
                    <th>Percentage</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {customPayments.map((customPaymentItem, index) => {
                    return (
                      <CustomFeeRow
                        key={index}
                        index={index}
                        array={customPayments}
                        deleter={removePayment}
                        {...{
                          rerender,
                          minterDecimals: BigNumber.from(minterDecimals | 3),
                          marketValuesChanged,
                          setMarketValuesChanged,
                          price: item.price,
                          symbol:
                            currentChain && chainData[currentChain]?.symbol
                        }}
                        {...customPaymentItem}
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
            {minterDecimals && (
              <div className="row w-100">
                <div className="col-12 col-md-10 py-2 text-center">
                  Total:{' '}
                  {BigNumber.from(total)
                    .div(Math.pow(10, minterDecimals | 3))
                    ?.toString()}
                  %
                </div>
                <button
                  disabled={BigNumber.from(total).gte(
                    Math.pow(10, minterDecimals | 3) * 100
                  )}
                  onClick={addPayment}
                  style={{
                    background: primaryButtonColor,
                    color: textColor
                  }}
                  className="col-12 col-md-2 rounded-rair btn rair-button">
                  <i className="fas fa-plus" /> Add
                </button>
              </div>
            )}
          </details>
        )}
        <hr />
      </div>
    </div>
  );
};

export default MarketplaceOfferConfig;
