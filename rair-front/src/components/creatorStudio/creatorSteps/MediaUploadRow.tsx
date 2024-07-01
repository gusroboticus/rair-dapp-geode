import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

import { RootState } from '../../../ducks';
import { ColorStoreType } from '../../../ducks/colors/colorStore.types';
import { rFetch } from '../../../utils/rFetch';
import { OptionsType } from '../../common/commonTypes/InputSelectTypes.types';
import InputField from '../../common/InputField';
import InputSelect from '../../common/InputSelect';
import { IMediaUploadRow } from '../creatorStudio.types';

import './../../DemoMediaUpload/DemoMediaUpload.css';

const MediaUploadRow: React.FC<IMediaUploadRow> = ({
  item,
  offerList,
  deleter,
  rerender,
  index,
  array,
  categoriesArray
}) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [thisSessionId, setThisSessionId] = useState<string>('');
  const [socketMessage, setSocketMessage] = useState<string | undefined>();

  const storageOptions: OptionsType[] = [
    { label: 'Google Cloud', value: 'gcp' },
    { label: 'IPFS', value: 'ipfs' }
  ];

  useEffect(() => {
    const sessionId = Math.random().toString(36).slice(2, 9);
    setThisSessionId(sessionId);
    const so = io(`http://localhost:5002`, { transports: ['websocket'] });

    so.emit('init', sessionId);

    so.on('uploadProgress', (data) => {
      const { last, message } = data;
      setSocketMessage(message);
      if (last) {
        setUploading(false);
        setUploadSuccess(true);
      }
    });

    return () => {
      so.removeListener('uploadProgress');
      so.emit('end', sessionId);
    };
  }, []);

  const { primaryColor, textColor } = useSelector<RootState, ColorStoreType>(
    (store) => store.colorStore
  );

  const cornerStyle = { height: '35vh', borderRadius: '16px 0 0 16px' };
  const selectCommonInfo = {
    customClass: 'form-control rounded-rair',
    customCSS: {
      backgroundColor: `color-mix(in srgb, ${primaryColor}, #888888)`,
      color: textColor
    },
    optionCSS: {
      color: textColor
    }
  };

  const updateMediaTitle = (value: string) => {
    array[index].title = value;
    rerender();
  };

  const updateMediaDescription = (value: string) => {
    array[index].description = value;
    rerender();
  };

  const updateMediaCategory = (value: string) => {
    array[index].category = value;
    rerender();
  };

  const updateMediaOffer = (value: string) => {
    array[index].offer = value;
    rerender();
  };

  const updateStorage = (value: string) => {
    array[index].storage = value;
    rerender();
  };

  return (
    <div
      style={{
        backgroundColor: `color-mix(in srgb, ${primaryColor}, #888888)`,
        color: textColor
      }}
      // className="p-0 rounded-rair d-flex align-items-center my-3 col-12 row mx-0"
      className="medialist-box">
      <div className="mediaitem-block col-12">
        <video className="w-100" src={item.preview} />
        <button
          onClick={() => deleter()}
          className={`btn btn-danger rounded-rairo ${
            primaryColor === 'rhyno' ? 'rhyno' : ''
          }`}>
          <i className="far fa-trash"></i>
        </button>
      </div>
      {/* <div className="col-12 text-end">
        <button
          onClick={deleter}
          className="btn btn-danger rounded-rair text-center border-danger"
          style={{ color: textColor }}>
          <i className="fas fa-trash" />
        </button>
      </div> */}
      <div
        className="col-12 m-0 p-0 col-md-5"
        style={{ ...cornerStyle, height: '100%', overflowY: 'hidden' }}>
        {item.file.type.split('/')[0] === 'video' && (
          <video
            style={cornerStyle}
            className="h-100 w-100"
            src={item.preview}
          />
        )}
        {item.file.type.split('/')[0] === 'image' && (
          <img
            alt=""
            style={cornerStyle}
            src={item.preview}
            className="h-auto w-100"
          />
        )}
        {item.file.type.split('/')[0] === 'audio' && (
          <>
            <div className="w-100 h-100">
              <audio controls src={item.preview}>
                Your browser does not support the
                <code>audio</code> element.
              </audio>
            </div>
          </>
        )}
      </div>
      <div className="col-12 row text-start d-flex align-items-center py-3 col-md-7">
        <div className="my-1">
          Title
          <div className="border-stimorol rounded-rair col-12 mb-0">
            <InputField
              disabled={uploadSuccess}
              maxLength={30}
              getter={item.title}
              setter={updateMediaTitle}
              customClass="mb-0 form-control rounded-rair"
              customCSS={{
                backgroundColor: `color-mix(in srgb, ${primaryColor}, #888888)`,
                color: textColor ? textColor : ''
              }}
            />
          </div>
        </div>
        <div className="my-1">
          Category
          <div className="border-stimorol rounded-rair col-12">
            <InputSelect
              disabled={uploadSuccess}
              options={categoriesArray}
              placeholder="Select a category"
              getter={item.category}
              setter={updateMediaCategory}
              {...selectCommonInfo}
            />
          </div>
          <small>{item.file.type}</small>
        </div>
        <div className="my-1">
          Offer
          <div className="border-stimorol rounded-rair col-12">
            <InputSelect
              disabled={uploadSuccess}
              options={offerList}
              getter={item.offer}
              setter={updateMediaOffer}
              placeholder="Select an offer"
              {...selectCommonInfo}
            />
          </div>
        </div>
        <div className="my-1">
          Storage
          <div className="border-stimorol rounded-rair col-12">
            <InputSelect
              disabled={uploadSuccess}
              options={storageOptions}
              getter={item.storage}
              setter={updateStorage}
              placeholder="Storage type"
              {...selectCommonInfo}
            />
          </div>
        </div>
        <div className="my-1">
          Description
          <div className="border-stimorol rounded-rair col-12">
            <textarea
              disabled={uploadSuccess}
              style={selectCommonInfo.customCSS}
              value={item.description}
              onChange={(e) => updateMediaDescription(e.target.value)}
              className="rounded-rair form-control"
            />
          </div>
        </div>
        <button
          onClick={async () => {
            const reversedOfferList = [...offerList].reverse();
            const formData = new FormData();
            formData.append('video', item.file);
            formData.append('title', item.title.slice(0, 29));
            formData.append('description', item.description);
            formData.append('contract', item.contractAddress);
            formData.append('product', item.productIndex);
            formData.append('category', item.category);
            formData.append('storage', item.storage);
            formData.append(
              'offer',
              JSON.stringify(
                item.offer !== '-1'
                  ? reversedOfferList
                      .map((offerData) => {
                        if (Number(offerData.value) < Number(item.offer)) {
                          return undefined;
                        }
                        return offerData.value;
                      })
                      .filter((item) => item !== undefined)
                  : []
              )
            );
            formData.append('demo', String(item.offer === '-1'));
            setUploading(true);
            try {
              const tokenRequest = await rFetch('/api/upload/token');
              if (!tokenRequest.success) {
                setUploading(false);
                return;
              }
              const response = await rFetch(
                `${
                  import.meta.env.VITE_UPLOAD_PROGRESS_HOST
                }/ms/api/v1/media/upload?socketSessionId=${thisSessionId}`,
                {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'X-rair-token': tokenRequest.secret
                  },
                  body: formData
                }
              );
              if (!response.success) {
                setUploading(false);
              }
            } catch (e) {
              console.error(e);
              setUploading(false);
            }
          }}
          disabled={
            uploadSuccess ||
            uploading ||
            item.category === 'null' ||
            item.description === '' ||
            item.offer === 'null'
          }
          className="btn btn-primary rounded-rair">
          {uploading && socketMessage ? (
            socketMessage
          ) : uploadSuccess ? (
            <>
              <i className="fas fa-check" /> Upload Complete!{' '}
            </>
          ) : (
            <>
              <i className="fas fa-upload" /> Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MediaUploadRow;
