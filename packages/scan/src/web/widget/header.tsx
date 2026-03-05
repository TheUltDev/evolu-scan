import { Store } from '../../core/index';
import { Icon } from '../components/icon';
import { useDelayedValue } from '../hooks/use-delayed-value';
import { signalWidgetViews } from '../state';
import { cn } from '../utils/helpers';
import { HeaderInspect } from '../views/inspector/header';

export const Header = () => {
  const isInitialView = useDelayedValue(
    Store.inspectState.value.kind === 'focused',
    150,
    0,
  );
  const handleClose = () => {
    signalWidgetViews.value = {
      view: 'none',
    };
    Store.inspectState.value = {
      kind: 'inspect-off',
    };
  };

  const isHeaderHidden =
    signalWidgetViews.value.view === 'notifications' ||
    signalWidgetViews.value.view === 'evolu';

  if (isHeaderHidden) {
    return;
  }

  return (
    <div className="evolu-scan-header">
      <div className="relative flex-1 h-full">
        <div
          className={cn(
            'evolu-scan-header-item is-visible',
            !isInitialView && '!duration-0',
          )}
        >
          <HeaderInspect />
        </div>
      </div>

      <button
        type="button"
        title="Close"
        className="evolu-scan-close-button"
        onClick={handleClose}
      >
        <Icon name="icon-close" />
      </button>
    </div>
  );
};
