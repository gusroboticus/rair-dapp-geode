import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import useConnectUser from '../../../hooks/useConnectUser';
import { NavFooter, NavFooterBox } from '../../Footer/FooterItems/FooterItems';
import { BackBtnMobileNav } from '../NavigationItems/NavigationItems';
import chainData from '../../../utils/blockchainData';
import { RairFavicon, RairTokenLogo } from '../../../images';
import { TooltipBox } from '../../common/Tooltip/TooltipBox';
import { useSelector } from 'react-redux';
import { RootState } from '../../../ducks';
import { ContractsInitialType } from '../../../ducks/contracts/contracts.types';
import { BigNumber, utils } from 'ethers';
import useWeb3Tx from '../../../hooks/useWeb3Tx';
import { formatEther } from 'ethers/lib/utils';
import { TUsersInitialState } from '../../../ducks/users/users.types';

interface IMobileNavigationList {
  messageAlert: string | null;
  setMessageAlert: (arg: string | null) => void;
  primaryColor: string;
  currentUserAddress: string | undefined;
  toggleMenu: (otherPage?: string) => void;
  setTabIndexItems: (arg: number) => void;
  isSplashPage: boolean;
  click: boolean;
}

const MobileNavigationList: React.FC<IMobileNavigationList> = ({
  messageAlert,
  setMessageAlert,
  primaryColor,
  toggleMenu,
  currentUserAddress,
  click
}) => {
  const hotDropsVar = import.meta.env.VITE_TESTNET;

  const [userBalance, setUserBalance] = useState<string>('');
  const [userRairBalance, setUserRairBalance] = useState<any>(
    BigNumber.from(0)
  );
  const { userData } = useSelector<RootState, TUsersInitialState>((store) => store.userStore);

  const { web3TxHandler } = useWeb3Tx();

  const { erc777Instance, currentChain } = useSelector<
  RootState,
  ContractsInitialType
>((store) => store.contractStore);

const getBalance = useCallback(async () => {
  if (currentUserAddress && erc777Instance?.provider) {
    const balance =
      await erc777Instance.provider.getBalance(currentUserAddress);

    if (balance) {
      const result = utils.formatEther(balance);
      const final = Number(result.toString())?.toFixed(2)?.toString();

      setUserBalance(final);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUserAddress, erc777Instance, userData]);

  const getUserRairBalance = useCallback(async () => {
    if (!erc777Instance || userRairBalance?.gt(0)) {
      return;
    }
    const result = await web3TxHandler(erc777Instance, 'balanceOf', [
      currentUserAddress
    ]);
    if (result?._isBigNumber) {
      setUserRairBalance(result);
    }
  }, [erc777Instance, currentUserAddress, userRairBalance, web3TxHandler]);

  const [copyEth, setCopyEth] = useState<boolean>(false);

  const { logoutUser } = useConnectUser();

  useEffect(() => {
    getBalance();
  }, [getBalance])

  useEffect(() => {
    getUserRairBalance();
  }, [getUserRairBalance]);

  useEffect(() => {
    setCopyEth(false);

    return () => {
      setCopyEth(false);
    };
  }, [messageAlert, click]);

  return (
    <NavFooter>
      {messageAlert && messageAlert === 'notification' ? (
        <NavFooterBox
          className="nav-header-box-mobile"
          primaryColor={primaryColor}>
          <BackBtnMobileNav onClick={() => setMessageAlert(null)}>
            <i className="fas fa-chevron-left"></i>
          </BackBtnMobileNav>
          <li>You don’t have notifications yet</li>
        </NavFooterBox>
      ) : messageAlert === 'profile' ? (
        <NavFooterBox
          className="nav-header-box-mobile"
          primaryColor={primaryColor}>
          <BackBtnMobileNav onClick={() => setMessageAlert(null)}>
            <i className="fas fa-chevron-left"></i>
          </BackBtnMobileNav>
          {/* <li onClick={() => setMessageAlert('profileEdit')}>
            Personal Profile <i className="fal fa-edit" />
          </li> */}
          <li onClick={() => toggleMenu()}>
            <NavLink to={`/${currentUserAddress}`}>View Profile</NavLink>
          </li>
          {currentUserAddress && (
            <li
              onClick={() => {
                navigator.clipboard.writeText(currentUserAddress);
                setCopyEth(true);
              }}>
              {copyEth ? 'Copied!' : 'Copy your eth address'}
            </li>
          )}
        </NavFooterBox>
      ) : messageAlert === 'profileEdit' ? (
        <NavFooterBox
          className="nav-header-box-mobile"
          primaryColor={primaryColor}
          messageAlert={messageAlert}>
          <div>
          <div style={{
              padding: "10px",
              width: "90vw",
              height: "150px",
              color: `${primaryColor === '#dedede' ? "#000" : "#fff"}`,
              display: "flex",
              justifyContent: "space-around",
              alignItems: 'center',
              borderRadius: "12px",
              border: "1px solid #000",
              marginBottom: '10px'
            }}> 
              <div style={{
                display: 'flex',
                flexDirection: "column",
                justifyContent: 'space-evenly'
              }}>
              <div style={{
                display: "flex",
                marginBottom: "15px"
              }}>
                <div>
                  {userBalance ? userBalance : 0.00}
                {/* {isLoadingBalance ? <LoadingComponent size={18} /> : userBalance} */}
                </div>
                <div>
                {currentChain && chainData[currentChain] && (
            <img style={{
              height: "25px",
              marginLeft: "15px"
            }} src={chainData[currentChain]?.image} alt="logo" />
          )}
                </div>
              </div>
              <div style={{
                display: "flex"
              }}>
                <div>
                  {userRairBalance ? formatEther(userRairBalance) : 0.00}
                {/* {isLoadingBalance ? <LoadingComponent size={18} /> : userBalance} */}
                </div>
                <div>
                <img style={{
              height: "25px",
              marginLeft: "15px"
            }} src={primaryColor === '#dedede' ?  RairFavicon : RairTokenLogo} alt="logo" />
                </div>
              </div>
              </div>
              <div style={{
                marginLeft: "25px",
                display: "flex",
                flexDirection: "column",

              }}>
                <div style={{
                  marginBottom: "10px"
                }} className="user-new-balance-title-text">
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>Exchange rate</div>
                <div style={{
                  fontSize: '14px'
                }}>50K RAIR/bETH</div>
                </div>
                <div>
                <TooltipBox position={'bottom'} title="Coming soon!">
                  <button style={{
                    background: "#7762D7",
                    color: "#fff",
                    border: "1px solid #000",
                    borderRadius: "12px",
                    width: "120px",
                    height: '50px',
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>Top up</button>
                  </TooltipBox>
                </div>
              </div>
            </div>
          </div>
          {currentUserAddress && (
            <li className="logout" onClick={logoutUser}>
              <i className="fas fa-sign-out-alt"></i>Logout
            </li>
          )}
        </NavFooterBox>
      ) : (
        <NavFooterBox
          className="nav-header-box-mobile"
          primaryColor={primaryColor}>
          {currentUserAddress && (
            <li className="logout" onClick={logoutUser}>
              <i className="fas fa-sign-out-alt"></i>Logout
            </li>
          )}
        </NavFooterBox>
      )}
    </NavFooter>
  );
};

export default MobileNavigationList;
