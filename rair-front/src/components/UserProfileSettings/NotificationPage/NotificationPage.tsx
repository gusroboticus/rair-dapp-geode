//@ts-nocheck
import { useSelector } from 'react-redux';

import { RootState } from '../../../ducks';
import { ColorStoreType } from '../../../ducks/colors/colorStore.types';

import IconRemove from './images/icon-remove.png';

// import { useSelector } from 'react-redux';
import './NotificationPage.css';

const NotificationPage = () => {
  const currentName =
    import.meta.env.VITE_TESTNET === 'true' ? 'HotDrops' : 'Rair.tech';
  const { headerLogo, primaryColor } = useSelector<RootState, ColorStoreType>(
    (store) => store.colorStore
  );

  return (
    <div className="wrapper-notification">
      <div className="notification-from-rair">
        <div className="notification-new">
          <div
            className="notification-main-text"
            style={{
              color: `${primaryColor === 'rhyno' && '#000'}`
            }}>
            New
          </div>
          <div
            className="box-notification"
            style={{
              backgroundColor: `${primaryColor === 'rhyno' && '#c0c0c0'}`
            }}>
            <div className="notification-left">
              <div className="dot-notification" />
              <div className="notification-img">
                <img src={headerLogo} alt="Rair Tech" />
              </div>
              <div className="text-notification">
                <div className="title-notif">
                  Notification from {currentName}
                </div>
                <div className="text-notif">
                  Don’t click away! You can navigate away from the page once
                  your video is done uploading
                </div>
              </div>
            </div>
            <div className="notification-right">
              {/* <div
                className="time-notification"
                style={{
                  color: `${primaryColor === 'rhyno' && '#000'}`
                }}>
                3 hours ago
              </div> */}
              <div className="icon-remove">
                <img src={IconRemove} alt="Close notification item" />
              </div>
            </div>
          </div>
        </div>
        <div className="notification-viewed">
          <div
            className="notification-main-text"
            style={{
              color: `${primaryColor === 'rhyno' && '#000'}`
            }}>
            Viewed
          </div>
          {/* <div
            className="box-notification"
            style={{
              backgroundColor: `${primaryColor === 'rhyno' && '#c0c0c0'}`
            }}>
            <div className="notification-left">
              <div className="dot-notification" />
              <div className="notification-img">
                <img src={headerLogo} alt="Rair Tech" />
              </div>
              <div className="text-notification">
                <div className="title-notif">Notification from Rair.tech</div>
                <div className="text-notif">
                  New announcements coming next Friday
                </div>
              </div>
            </div>
            <div className="notification-right">
              <div
                className="time-notification"
                style={{
                  color: `${primaryColor === 'rhyno' && '#000'}`
                }}>
                3 hours ago
              </div>
              <div className="icon-remove">
                <img src={IconRemove} alt="Close notification item" />
              </div>
            </div>
          </div> */}
          {/* <div
            className="box-notification"
            style={{
              backgroundColor: `${primaryColor === 'rhyno' && '#c0c0c0'}`
            }}>
            <div className="notification-left">
              <div className="dot-notification" />
              <div className="notification-img">
                <img src={NftImg} alt="Exclusive NFT token" />
              </div>
              <div className="text-notification">
                <div className="title-notif">Factory updates</div>
                <div className="text-notif">
                  Your nft “<span>Pegayo</span>” has been listed
                </div>
              </div>
            </div>
            <div className="notification-right">
              <div
                className="time-notification"
                style={{
                  color: `${primaryColor === 'rhyno' && '#000'}`
                }}>
                5 hours ago
              </div>
              <div className="icon-remove">
                <img src={IconRemove} alt="Close notification item" />
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
