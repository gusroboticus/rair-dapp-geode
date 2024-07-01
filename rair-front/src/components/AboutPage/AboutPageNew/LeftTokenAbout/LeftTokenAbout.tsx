import React from 'react';

import { discrodIconNoBorder } from '../../../../images';
import { ILeftTokenAbout } from '../aboutPage.types';

const LeftTokenAbout: React.FC<ILeftTokenAbout> = ({ primaryColor }) => {
  return (
    <div className="left-tokens about-page">
      <div className="block-left-tokens"></div>
      <div className="left-tokens-content">
        <div className="title-tokens">
          <h3>
            <span className="text-gradient">Mission</span>
          </h3>
        </div>
        <div className="tokens-description">
          <p className={primaryColor === 'rhyno' ? 'rhyno' : ''}>
            RAIRtech has developed a new way to control content on the
            blockchain called DDRM or distributed digital rights management.
          </p>
          <ul>
            <li>
              <p className={primaryColor === 'rhyno' ? 'rhyno' : ''}>
                Allows for encrypted streaming of videos, music, images and data
              </p>
            </li>
            <li>
              <p className={primaryColor === 'rhyno' ? 'rhyno' : ''}>
                Only the owner of the NFT can stream the content this makes
                digital goods work like real goods
              </p>
            </li>
            <li>
              <p className={primaryColor === 'rhyno' ? 'rhyno' : ''}>
                Feature complete platform: minting, streaming, royalties &
                metadata
              </p>
            </li>
          </ul>
          <div className="release-join-discord">
            <div className="btn-discord">
              <a
                href="https://discord.gg/APmkpQzxrx"
                target="_blank"
                rel="noreferrer">
                <img src={discrodIconNoBorder} alt="Discord RAIR.TECH" /> Join
                our Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftTokenAbout;
