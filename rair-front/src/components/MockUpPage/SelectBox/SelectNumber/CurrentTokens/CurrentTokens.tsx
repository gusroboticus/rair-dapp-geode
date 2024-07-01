import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../../../../ducks';
import { ColorStoreType } from '../../../../../ducks/colors/colorStore.types';
import ArrowDown from '../../../assets/ArrowDown.svg?react';
import ArrowUp from '../../../assets/ArrowUp.svg?react';
import { ICurrentTokensComponent } from '../../selectBox.types';

const CurrentTokensComponent: React.FC<ICurrentTokensComponent> = ({
  primaryColor,
  items,
  isBack,
  isOpen,
  setIsOpen,
  setIsOpens,
  selectedToken,
  handleIsOpen,
  onClickItem,
  numberRef
}) => {
  const { primaryButtonColor } = useSelector<RootState, ColorStoreType>(
    (store) => store.colorStore
  );
  return (
    <>
      <div ref={numberRef} className="select-number-container">
        <div
          onClick={handleIsOpen}
          className="select-field"
          style={{
            backgroundColor: `${
              primaryColor === '#dedede'
                ? 'var(--rhyno-40)'
                : `color-mix(in srgb, ${primaryColor} 40%, #888888)`
            }`
          }}>
          <div className="number-item">{selectedToken}</div>
          {isOpen ? (
            <ArrowUp className="arrow-select" />
          ) : (
            <ArrowDown className="arrow-select" />
          )}
        </div>
        <div
          style={{
            display: `${isOpen ? 'flex' : 'none'}`,
            backgroundColor: `${
              primaryColor === '#dedede'
                ? 'var(--rhyno-40)'
                : `color-mix(in srgb, ${primaryColor} 40%, #888888)`
            }`,
            border: `${primaryColor === 'rhyno' ? '1px solid #D37AD6' : 'none'}`
          }}
          className={`select-number-popup ${
            import.meta.env.VITE_TESTNET === 'true' ? 'hotdrops' : ''
          }`}>
          <div className="select-number-title">
            <div
              className="backClose-current-tokens backClose-current-tokens-back-sign"
              style={{ visibility: isBack ? 'visible' : 'hidden' }}
              onClick={() => {
                setIsOpens?.(false);
                setIsOpen(false);
              }}>
              &#8617;
            </div>
            <div className="serial-number-title">Serial number</div>
            <div
              className="backClose-current-tokens backClose-current-tokens-close-sign"
              onClick={() => setIsOpen(false)}>
              &#10007;
            </div>
          </div>
          {items &&
            items.map((el, index) => {
              return (
                <div
                  className={`select-number-box ${
                    selectedToken === el.token ? 'selected-box' : ''
                  } ${el.sold ? 'sold-token' : ''}`}
                  data-title={` #${el.token}`}
                  style={{
                    background: `${
                      primaryColor === '#dedede'
                        ? import.meta.env.VITE_TESTNET === 'true'
                          ? 'var(--hot-drops)'
                          : 'linear-gradient(to right, #e882d5, #725bdb)'
                        : import.meta.env.VITE_TESTNET === 'true'
                          ? primaryButtonColor ===
                            'linear-gradient(to right, #e882d5, #725bdb)'
                            ? 'var(--hot-drops)'
                            : primaryButtonColor
                          : primaryButtonColor
                    }`,
                    color: `${primaryColor === 'rhyno' ? '#fff' : 'A7A6A6'}`
                  }}
                  key={el.id + index}
                  onClick={() => onClickItem(el.token)}>
                  {el.sold ? 'Sold' : el.token}
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

export const CurrentTokens = memo(CurrentTokensComponent);
