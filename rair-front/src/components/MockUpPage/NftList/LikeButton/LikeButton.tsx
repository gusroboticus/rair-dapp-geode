import { useCallback, useEffect, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { CircularProgress } from '@mui/material';
import axios from 'axios';

import { TAxiosFavoriteData } from '../../../../axios.responseTypes';
import { RootState } from '../../../../ducks';
import { ContractsInitialType } from '../../../../ducks/contracts/contracts.types';
import { TooltipBox } from '../../../common/Tooltip/TooltipBox';
import { ILikeButton } from '../../mockupPage.types';

import {
  addItemFavoriteEnd,
  addItemFavoriteStart,
  errorFavorites,
  getCurrentItemFalse,
  getCurrentItemSuccess,
  removeItemFavoriteEnd
} from './favoritesReducer/actions/actionFavorites';
import {
  favoritesReducer,
  initialFavoritesState
} from './favoritesReducer/favoritesReducers';

import './LikeButton.css';

const LikeButton: React.FC<ILikeButton> = ({
  likeButtonStyle,
  tokenId,
  selectedToken
}) => {
  const [{ loading, liked, currentLikeToken }, dispatch] = useReducer(
    favoritesReducer,
    initialFavoritesState
  );
  const { currentUserAddress } = useSelector<RootState, ContractsInitialType>(
    (store) => store.contractStore
  );

  const addFavorite = async (tokenBody: string | undefined) => {
    const token = {
      token: tokenBody
    };

    if (currentUserAddress) {
      dispatch(addItemFavoriteStart());
      try {
        await axios
          .post<TAxiosFavoriteData>('/api/favorites', token, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then((res) => {
            if (res.data && res.status) {
              dispatch(addItemFavoriteEnd());
            }
          });
      } catch (e) {
        dispatch(errorFavorites());
      }
    }
  };

  const removeFavotite = useCallback(async () => {
    if (currentUserAddress) {
      if (currentLikeToken) {
        try {
          dispatch(addItemFavoriteStart());
          await axios
            .delete(`/api/favorites/${currentLikeToken[0]?._id}`, {
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then((res) => {
              if (res.data === '') {
                dispatch(removeItemFavoriteEnd());
              }
            });
        } catch (e) {
          dispatch(errorFavorites());
        }
      }
    }
  }, [currentLikeToken, currentUserAddress]);

  const getFavotiteData = useCallback(async () => {
    try {
      const { data: result } = await axios.get('/api/favorites', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (result && result.result) {
        const check = result.result.filter((el) => el.token._id === tokenId);
        if (check.length > 0) {
          dispatch(getCurrentItemSuccess(check));
        } else {
          dispatch(getCurrentItemFalse());
        }
      }
    } catch (e) {
      dispatch(errorFavorites());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken, loading]);

  useEffect(() => {
    getFavotiteData();
  }, [getFavotiteData]);

  return (
    <>
      {loading ? (
        <CircularProgress sx={{ color: '#E882D5' }} size={40} thickness={4} />
      ) : (
        <>
          <TooltipBox
            title={`${liked ? 'Remove from Favorites' : 'Add to Favorites'}`}>
            {liked ? (
              <div
                className={likeButtonStyle}
                onClick={() => {
                  removeFavotite();
                }}>
                <i className="fas fa-heart like-button" />
              </div>
            ) : (
              <div
                className={likeButtonStyle}
                onClick={() => {
                  addFavorite(tokenId);
                }}>
                <i className="far fa-heart like-button" />
              </div>
            )}
          </TooltipBox>
        </>
      )}
    </>
  );
};

export default LikeButton;
