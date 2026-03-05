import { signalIsSettingsOpen } from '../../state';
import { cn } from '../../utils/helpers';

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
