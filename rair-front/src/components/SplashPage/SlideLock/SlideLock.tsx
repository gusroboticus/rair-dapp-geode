import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { teamSlideLockArray } from './AboutUsTeam';

import { RootState } from '../../../ducks';
import { ContractsInitialType } from '../../../ducks/contracts/contracts.types';
import { setInfoSEO } from '../../../ducks/seo/actions';
import { InitialState } from '../../../ducks/seo/reducers';
import { TInfoSeo } from '../../../ducks/seo/seo.types';
import { TUsersInitialState } from '../../../ducks/users/users.types';
import { splashData } from '../../../utils/infoSplashData/slideLock';
import MetaTags from '../../SeoTags/MetaTags';
/* importing images*/
import {
  slideNFT0,
  slideNFT1,
  slideNFT2,
  slideNFT3,
  slideNFT4,
  videoBackground
} from '../images/slideLock/slideLock';
import NotCommercialTemplate from '../NotCommercial/NotCommercialTemplate';
import { ISplashPageProps } from '../splashPage.types';
import AuthorCard from '../SplashPageTemplate/AuthorCard/AuthorCard';
import NFTImages from '../SplashPageTemplate/NFTImages/NFTImages';
import VideoPlayerModule from '../SplashPageTemplate/VideoPlayer/VideoPlayerModule';
/* importing Components*/
import TeamMeet from '../TeamMeet/TeamMeetList';
import TokenLeftTemplate from '../TokenLeft/TokenLeftTemplate';

import '../SplashPageTemplate/AuthorCard/AuthorCard.css';
import '../../AboutPage/AboutPageNew/AboutPageNew.css';
import './SlideLock.css';
import '../SplashPageTemplate/AuthorCard/AuthorCard.css';
import '../../AboutPage/AboutPageNew/AboutPageNew.css';
import './SlideLock.css';

// TODO: UNUSED
// import MetaTags from '../../SeoTags/MetaTags'
// import StaticTiles from '../SplashPageTemplate/VideoTiles/StaticTiles';
// import NFTLA_Video from "../images/NFT-LA-RAIR-2021.mp4"
// import nftCountUkraine from '../images/UkrainianSoldierswithMedical/nftCountUkraine.jpeg';

// Google Analytics
//const TRACKING_ID = 'UA-209450870-5'; // YOUR_OWN_TRACKING_ID
//ReactGA.initialize(TRACKING_ID);

const SlideLock: React.FC<ISplashPageProps> = ({
  connectUserData,
  setIsSplashPage
}) => {
  const dispatch = useDispatch();
  const [soldCopies, setSoldCopies] = useState<number>(0);
  const primaryColor = useSelector<RootState, string>(
    (store) => store.colorStore.primaryColor
  );
  const { loggedIn } = useSelector<RootState, TUsersInitialState>(
    (store) => store.userStore
  );
  const seo = useSelector<RootState, TInfoSeo>((store) => store.seoStore);
  const { currentChain, minterInstance } = useSelector<
    RootState,
    ContractsInitialType
  >((store) => store.contractStore);
  const carousel_match = window.matchMedia('(min-width: 900px)');
  const [carousel, setCarousel] = useState<boolean>(carousel_match.matches);

  useEffect(() => {
    dispatch(setInfoSEO(InitialState));
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    window.addEventListener('resize', () =>
      setCarousel(carousel_match.matches)
    );
    return () =>
      window.removeEventListener('resize', () =>
        setCarousel(carousel_match.matches)
      );
  }, [carousel_match.matches]);

  const getAllProduct = useCallback(async () => {
    if (loggedIn && minterInstance && splashData.purchaseButton?.offerIndex) {
      if (currentChain === splashData.purchaseButton?.requiredBlockchain) {
        setSoldCopies(
          (
            await minterInstance.getOfferRangeInfo(
              ...(splashData.purchaseButton?.offerIndex || [])
            )
          ).tokensAllowed.toString()
        );
      } else {
        setSoldCopies(0); /*it was empty but I put 0*/
      }
    }
  }, [setSoldCopies, loggedIn, currentChain, minterInstance]);

  useEffect(() => {
    getAllProduct();
  }, [getAllProduct]);

  useEffect(() => {
    setIsSplashPage?.(true);
  }, [setIsSplashPage]);

  // useEffect(() => {
  //   setTitle(`#UkraineGlitch`);
  // }, []);

  return (
    <div className="wrapper-splash-page slidelock">
      <MetaTags seoMetaTags={seo} />
      <div className="template-home-splash-page">
        <AuthorCard {...{ splashData, connectUserData }} />
        {/* <NFTCounterTemplate 
          primaryColor={"rhyno"} 
          leftTokensNumber={0} 
          wholeTokens={0} 
          counterData={splashData.counterData}
        /> */}
        <TokenLeftTemplate
          counterData={splashData.counterData}
          soldCopies={soldCopies}
          primaryColor={primaryColor}
          nftTitle={splashData.counterData?.nftTitle}
        />
        <div style={{ height: '108px' }} />
        <VideoPlayerModule
          backgroundImage={videoBackground}
          videoData={splashData.videoData}
        />
        <NFTImages
          NftImage={slideNFT0}
          Nft_1={slideNFT1}
          Nft_2={slideNFT2}
          Nft_3={slideNFT3}
          Nft_4={slideNFT4}
          amountTokens={splashData.counterData?.nftCount}
          titleNft={splashData.exclusiveNft?.title}
          colorText={splashData.exclusiveNft?.titleColor}
          carousel={carousel}
        />
        <TeamMeet
          arraySplash={'slidelock'}
          titleHeadFirst={'Meet the'}
          titleHeadSecond={'Team'}
          colorHeadSecond={'#57B69C'}
          teamArray={teamSlideLockArray}
        />
        <NotCommercialTemplate
          primaryColor={primaryColor}
          NFTName={splashData.NFTName}
        />
      </div>
    </div>
  );
};

export default SlideLock;
