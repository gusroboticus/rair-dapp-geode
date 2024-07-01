import React, { useEffect, useState } from 'react';

import { ImageLazy } from '../../ImageLazy/ImageLazy';
import {
  INftSingleUnlockables,
  TNftSingleUnlockablesSections,
  TRarityType
} from '../nftList.types';

import NftDifferentRarity from './UnlockablesPage/NftDifferentRarity/NftDifferentRarity';

import './NftSingleUnlockables.css';

const NftSingleUnlockables: React.FC<INftSingleUnlockables> = ({
  embeddedParams,
  productsFromOffer,
  setTokenDataFiltered,
  primaryColor,
  setSelectVideo,
  isDiamond
}) => {
  const [sections, setSections] =
    useState<TNftSingleUnlockablesSections | null>(null);
  const [rarity, setRarity] = useState<TRarityType>([
    'Unlock Ultra Rair',
    'Unlock Rair',
    'Unlock Common'
  ]);

  useEffect(() => {
    const ope = productsFromOffer.some((i) => {
      return i.isUnlocked === true;
    });
    if (ope) {
      setRarity(['Ultra Rair', 'Rair', 'Common']);
    }
  }, [productsFromOffer]);

  useEffect(() => {
    const result = productsFromOffer?.reduce((acc, item) => {
      if (isDiamond) {
        const key = item.offer.length;
        const value = acc[key];

        if (value) {
          acc[key] = [...value, item];
        } else {
          acc[key] = [item];
        }
        return acc;
      }

      const key = item.offer[0];
      const value = acc[key];

      if (value) {
        acc[key] = [...value, item];
      } else {
        acc[key] = [item];
      }
      return acc;
    }, {});
    setSections(result);
  }, [productsFromOffer, isDiamond]);

  return (
    <div className="nft-single-unlockables-page">
      {sections &&
        Object.entries(sections).map(([key, item]) => {
          const diamondKey = isDiamond ? +key - 1 : key;
          return (
            <div className="nft-rarity-wrapper" key={key}>
              <NftDifferentRarity
                embeddedParams={embeddedParams}
                setTokenDataFiltered={setTokenDataFiltered}
                title={rarity[diamondKey]}
                isUnlocked={item.map((i) => i.isUnlocked)}
              />
              <div className="video-wrapper">
                {item.map((v) => {
                  return (
                    <div
                      key={v._id}
                      style={{
                        marginBottom: '16px'
                      }}>
                      <div
                        onClick={() => setSelectVideo(v)}
                        className="video-box-rarity"
                        style={{
                          backgroundColor: `${
                            primaryColor === 'rhyno' ? '#F2F2F2' : '#4E4D4DCC'
                          }`
                        }}>
                        {v.isUnlocked ? (
                          <div
                            className="block-rariry-unlock-video"
                            style={{
                              position: 'relative'
                            }}>
                            <ImageLazy
                              src={`${v?.staticThumbnail}`}
                              alt="Preview unlockable video"
                            />
                          </div>
                        ) : (
                          <div className="block-rariry-unlock-video lock">
                            <div className="custom-lock">
                              <i className="fa fa-lock" aria-hidden="true"></i>
                              <p
                                className={`video-rarity-preview-text ${
                                  v.description.length > 20 ? 'long' : ''
                                } ${primaryColor === 'rhyno' ? 'rhyno' : ''}`}>
                                {v.description}
                              </p>
                            </div>
                            <ImageLazy
                              src={`${v?.staticThumbnail}`}
                              alt="Preview unlockable video"
                            />
                          </div>
                        )}
                        <div
                          className={`nft-unlokvideo-description ${
                            primaryColor === 'rhyno' ? 'rhyno' : ''
                          }`}>
                          <div>
                            {' '}
                            <p>{v?.title}</p>{' '}
                          </div>
                          <div>
                            <p>{v?.duration}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default NftSingleUnlockables;
