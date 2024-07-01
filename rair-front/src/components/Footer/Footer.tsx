import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';

import { IFooter } from './footer.types';

import { RootState } from '../../ducks';
import { ColorStoreType } from '../../ducks/colors/colorStore.types';
import { DiscordIcon, TelegramIcon, TwitterIcon } from '../../images';
import { SocialBox } from '../../styled-components/SocialLinkIcons/SocialLinkIcons';
import useServerSettings from '../adminViews/useServerSettings';

import {
  CommunityBlock,
  CommunityBoxFooter,
  FooterEmailBlock,
  FooterImage,
  FooterMain,
  FooterTextRairTech,
  FooterWrapper,
  NavFooter,
  NavFooterBox
} from './FooterItems/FooterItems';

const Footer: React.FC<IFooter> = () => {
  const [emailChimp, setEmailChimp] = useState<string>('');

  const { footerLinks, legal } = useServerSettings();

  const hotdropsVar = import.meta.env.VITE_TESTNET;

  const { headerLogo, primaryColor, textColor, primaryButtonColor } =
    useSelector<RootState, ColorStoreType>((store) => store.colorStore);

  const onChangeEmail = (e) => {
    setEmailChimp(e.target.value);
  };

  const onSubmit = () => {
    Swal.fire(
      'Success',
      `Thank you for sign up! Check to your email ${emailChimp}`,
      'success'
    );
    setTimeout(() => {
      setEmailChimp('');
    }, 1000);
  };

  return (
    <FooterMain
      hotdrops={hotdropsVar}
      primaryColor={primaryColor}
      textColor={textColor}>
      <FooterWrapper
        className="footer-wrapper-hotdrops"
        primaryColor={primaryColor}>
        <FooterImage className="footer-img-hotdrops">
          <NavLink to="/">
            <img src={headerLogo} alt="Rair Tech" />
          </NavLink>
        </FooterImage>
        <NavFooter className="footer-nav-hotdrops">
          <NavFooterBox
            className="footer-nav-item-hotdrop"
            primaryColor={primaryColor}>
            {footerLinks && footerLinks.length > 0 ? (
              footerLinks.map((el) => {
                return (
                  <li key={el.label}>
                    <a target={'_blank'} rel="noreferrer" href={el.url}>
                      {el.label}
                    </a>
                  </li>
                );
              })
            ) : (
              <>
                {hotdropsVar === 'true' ? (
                  <>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://www.myhotdrops.com/terms-and-conditions"
                        rel="noreferrer">
                        Terms and Conditions
                      </a>
                    </li>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://www.myhotdrops.com/privacy-policy"
                        rel="noreferrer">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://www.myhotdrops.com/faqs"
                        rel="noreferrer">
                        FAQs
                      </a>
                    </li>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://www.myhotdrops.com/hot-drops-content-removal-request"
                        rel="noreferrer">
                        Content Removal Request
                      </a>
                    </li>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://www.myhotdrops.com/hotties/recruiting"
                        rel="noreferrer">
                        Apply to Be a Creator
                      </a>
                    </li>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://www.myhotdrops.com/usc2257"
                        rel="noreferrer">
                        USC 2257
                      </a>
                    </li>
                    <li>
                      <a href="mailto:customerservice@myhotdrops.com">
                        Contact Us
                      </a>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <a
                        target={'_blank'}
                        href="https://etherscan.io/token/0x2b0ffbf00388f9078d5512256c43b983bb805ef8"
                        rel="noreferrer">
                        Contract
                      </a>
                    </li>
                  </>
                )}
              </>
            )}
          </NavFooterBox>
        </NavFooter>
      </FooterWrapper>
      <FooterTextRairTech textColor={textColor} primaryColor={primaryColor}>
        <ul>
          <li>
            {legal ? (
              legal
            ) : (
              <>
                {import.meta.env.VITE_TESTNET === 'true'
                  ? ' HotDrops'
                  : ' Rairtech'}{' '}
                {new Date().getFullYear()}. All rights reserved
              </>
            )}
          </li>
          <li>
            <NavLink to="/privacy">Privacy policy</NavLink>
          </li>
          <li>
            <NavLink to="/terms-use">Terms of Service</NavLink>
          </li>
        </ul>
      </FooterTextRairTech>
    </FooterMain>
  );
};

export default Footer;
