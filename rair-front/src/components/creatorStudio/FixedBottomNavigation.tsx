import { useSelector } from 'react-redux';

import { IFixedBottomNavigation } from './creatorStudio.types';

import { RootState } from '../../ducks';
import { ColorStoreType } from '../../ducks/colors/colorStore.types';

const FixedBottomNavigation: React.FC<IFixedBottomNavigation> = ({
  forwardFunctions
}) => {
  const { primaryColor, textColor, primaryButtonColor } = useSelector<
    RootState,
    ColorStoreType
  >((store) => store.colorStore);

  if (!forwardFunctions) {
    return <></>;
  }

  return (
    <>
      <div className="py-3" />
      <div className={`w-100 py-4`}>
        <div style={{ position: 'relative' }}>
          <div className="btn" style={{ color: primaryColor }}>
            {
              // Makes room for the other buttons
              '_'
            }
          </div>
          <div
            style={{
              position: 'absolute',
              right: '5rem',
              display: 'inline-block'
            }}>
            {forwardFunctions &&
              forwardFunctions.length &&
              forwardFunctions
                .filter((item) => {
                  return item.visible === undefined || item.visible;
                })
                .map((item, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        background: primaryButtonColor
                      }}
                      className="rounded-rair btn p-0 mx-2">
                      <button
                        style={{
                          border: 'none',
                          background: primaryColor,
                          color: textColor
                        }}
                        disabled={item.disabled}
                        className="btn rounded-rair rair-button"
                        onClick={item.action}>
                        {item.label ? item.label : 'Proceed'}
                      </button>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
      <div className="py-3 my-5" />
    </>
  );
};

export default FixedBottomNavigation;
