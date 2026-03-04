import { type Signal } from '@preact/signals';
import { Icon } from '~web/components/icon';
import { cn } from '~web/utils/helpers';
import type { DbSnapshot } from '../types';

export const Header = ({
  snapshot,
  exportState,
  followActive,
  showDeleted,
  dbLoading,
  onRefresh,
  onExport,
  onFollowToggle,
  onShowDeletedToggle,
}: {
  snapshot: DbSnapshot;
  exportState: string;
  followActive: boolean;
  showDeleted: boolean;
  dbLoading: Signal<boolean>;
  onRefresh: () => void;
  onExport: () => void;
  onFollowToggle: () => void;
  onShowDeletedToggle: () => void;
}) => (
  <div className={cn('w-full flex border-b border-[#27272A] min-h-[40px]')}>
    <div className="min-w-fit w-full flex items-center pl-3 pr-2 text-sm gap-x-3">
      <Icon name="icon-database" size={14} className="text-[#8e61e3]" />
      <span className="text-neutral-300 text-xs font-medium">Evolu Database</span>
      <span className="text-[10px] text-neutral-500">
        {snapshot.tables.length} table{snapshot.tables.length !== 1 && 's'}
      </span>
      {dbLoading.value && (
        <span className="text-[10px] text-[#8e61e3] animate-pulse">syncing</span>
      )}
      <div className="flex items-center gap-x-2 ml-auto">
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh"
          className="button rounded w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300"
        >
          <Icon name="icon-refresh-cw" size={14} />
        </button>
        <button
          type="button"
          onClick={onFollowToggle}
          title={followActive ? 'Stop following changes' : 'Follow changes'}
          className="button rounded w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300"
          style={{ color: followActive ? '#4ade80' : undefined }}
        >
          <Icon name="icon-crosshair" size={14} />
        </button>
        <button
          type="button"
          onClick={onShowDeletedToggle}
          title={showDeleted ? 'Hide deleted rows' : 'Show deleted rows'}
          className="button rounded w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300"
          style={{ color: showDeleted ? '#f87171' : undefined }}
        >
          <Icon name="icon-trash" size={14} />
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={exportState === 'picking'}
          title={exportState === 'active' ? 'Stop syncing to disk' : 'Sync database to disk'}
          className="button rounded w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300"
          style={{
            color:
              exportState === 'active'
                ? '#4ade80'
                : exportState === 'picking'
                  ? '#8e61e3'
                  : undefined,
          }}
        >
          <Icon name="icon-download" size={14} />
        </button>
      </div>
    </div>
  </div>
);
