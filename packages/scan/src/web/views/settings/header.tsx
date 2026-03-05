import { signalIsSettingsOpen } from '~web/state';
import { cn } from '~web/utils/helpers';

export const HeaderSettings = () => {
  const isSettingsOpen = signalIsSettingsOpen.value;
  return (
    <span
      data-text="Settings"
      className={cn(
        'evolu-scan-header-item',
        'with-data-text',
        isSettingsOpen && 'is-visible',
      )}
    />
  );
};
