/** @format */

'use client';

import * as React from 'react';
import { Plus, Edit2, Trash2, Briefcase, GripVertical } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/badge';
import { IconBox } from '@/components/UI/icon/box';
import { Checkbox } from '@/components/UI/checkbox';
import { ColumnSettingsDialog } from '@/components/UI/table/column-settings';
import { DataTable } from '@/components/UI/table/data-table';

import { TableToolbar } from '@/components/custom/table-toolbar';
import { cn } from '@/lib/utils';
import { EmploymentTypeConfigurationDialog } from '../components/employment-type-configuration-dialog';
import { useAccounts } from '@/api';
import { useSearch } from '@/hooks/use-search';
import { WaterfallLayout } from '@/components/layout/waterfallLayout';
import {
  useEmploymentTypes,
  useDeleteEmploymentType,
  useDeleteEmploymentTypes,
  useUpdateEmploymentType,
  EmploymentType,
} from '@/api';

import { StatusSwitch } from '@/components/custom/status-switch';
import { notify } from '@/lib/notifications';
import { CardBackgroundInitials } from '@/components/UI/card/card-background-initials';
import { AddEntityCard } from '@/components/custom/add-entity-card';
import { AutoTooltip } from '@/components/UI/tooltip/auto-tooltip';
import { EditingOverlay } from '@/components/custom/overlay/editing-overlay';
import { SelectionOverlay } from '@/components/custom/overlay/selection-overlay';
import { Tooltip } from '@/components/UI/tooltip';

import { useLayoutStore } from '@/lib/store/layout-store';
import { useHeader } from '@/hooks/use-header';
import { H3 } from '@/components/UI/text/typography';
import {
  usePreferencesActions,
  usePreferencesStore,
} from '@/lib/store/preferences-store';

export function EmploymentTypesView() {
  const search = useSearch();
  const {
    value: searchQuery,
    debouncedValue: debouncedSearchQuery,
    isDebouncing,
  } = search;

  const {
    actions: { openDrawer, closeDrawer },
    isDrawerOpen,
  } = useLayoutStore();

  const [,] = React.useState<EmploymentType | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>(
    [],
  );
  const [selectedRows, setSelectedRows] = React.useState<EmploymentType[]>([]);

  const viewMode = usePreferencesStore((state) => state.viewMode);
  const isSelectionMode = usePreferencesStore((state) => state.isSelectionMode);
  const columnSettings = usePreferencesStore(
    (state) => state.columnSettings['employment-types'],
  );
  const { setSelectionMode, setColumnSettings } = usePreferencesActions();
  const columnVisibility = columnSettings?.visibility || {};
  const columnOrder = columnSettings?.order || [];

  const { data: accounts } = useAccounts();
  const { data: employmentTypes } = useEmploymentTypes();
  const deleteEmploymentType = useDeleteEmploymentType();
  const deleteEmploymentTypes = useDeleteEmploymentTypes();
  const updateEmploymentType = useUpdateEmploymentType();

  // Clear editingId when drawer closes
  React.useEffect(() => {
    if (!isDrawerOpen) {
      setEditingId(null);
    }
  }, [isDrawerOpen]);

  // Helper function to get account name by ID
  const getAccountName = React.useCallback(
    (accountId: string) => {
      return (
        accounts?.find((acc) => acc.AccountId === accountId)?.Name || 'Unknown'
      );
    },
    [accounts],
  );

  const filteredTypes = React.useMemo(() => {
    if (!employmentTypes) return [];

    let result = employmentTypes;

    // Filter by account
    if (selectedAccountIds.length > 0) {
      result = result.filter(
        (t) => t.AccountId && selectedAccountIds.includes(t.AccountId),
      );
    }

    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((t) => {
        // Helper to check if a value matches the query
        const matches = (val: unknown) =>
          String(val).toLowerCase().includes(query);

        return (
          matches(t.Name) ||
          matches(t.Code) ||
          (t.Description && matches(t.Description)) ||
          (t.IsActive ? matches('active') : matches('inactive'))
        );
      });
    }

    return result;
  }, [employmentTypes, selectedAccountIds, debouncedSearchQuery]);

  const handleCreate = () => {
    setEditingId(null);
    openDrawer({
      title: 'Create Employment Type',
      width: 500,
      content: (
        <EmploymentTypeConfigurationDialog
          onClose={closeDrawer}
          type={null}
          accountId={
            selectedAccountIds.length === 1 ? selectedAccountIds[0] : ''
          }
        />
      ),
    });
  };

  const handleEdit = (type: EmploymentType) => {
    setEditingId(type.EmploymentTypeId);
    openDrawer({
      title: 'Edit Employment Type',
      width: 500,
      content: (
        <EmploymentTypeConfigurationDialog
          onClose={() => {
            setEditingId(null);
            closeDrawer();
          }}
          type={type}
          accountId={
            selectedAccountIds.length === 1 ? selectedAccountIds[0] : ''
          }
        />
      ),
    });
  };

  const handleDelete = async (id: string) => {
    const type = employmentTypes?.find((t) => t.EmploymentTypeId === id);
    if (
      confirm(
        `Are you sure you want to delete the employment type "${type?.Name}"?`,
      )
    ) {
      try {
        await deleteEmploymentType.mutateAsync(id);
        notify.success(
          `You successfully deleted the employment type ———— ${type?.Name || 'Unknown'
          }`,
          'Delete Employment Type Success',
        );
      } catch {
        notify.error(
          'Failed to delete employment type. Please try again later.',
          'Delete Employment Type Error',
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    const count = selectedRows.length;
    if (
      confirm(
        `Are you sure you want to delete ${count} employment type${count > 1 ? 's' : ''
        }?`,
      )
    ) {
      try {
        const ids = selectedRows.map((row) => row.EmploymentTypeId);
        await deleteEmploymentTypes.mutateAsync(ids);
        setSelectedRows([]);
        notify.success(
          `You successfully deleted ${count} employment type${count > 1 ? 's' : ''
          }`,
          'Bulk Delete Success',
        );
      } catch {
        notify.error(
          'Failed to delete employment types. Please try again later.',
          'Bulk Delete Error',
        );
      }
    }
  };

  const toggleSelection = (type: EmploymentType) => {
    setSelectedRows((prev) => {
      const isSelected = prev.some(
        (r) => r.EmploymentTypeId === type.EmploymentTypeId,
      );
      if (isSelected) {
        return prev.filter((r) => r.EmploymentTypeId !== type.EmploymentTypeId);
      } else {
        return [...prev, type];
      }
    });
  };

  // Clear selection when selection mode is disabled
  React.useEffect(() => {
    if (!isSelectionMode) {
      setSelectedRows([]);
    }
  }, [isSelectionMode]);

  // Define table columns with useMemo to ensure stability
  const columns = React.useMemo<ColumnDef<EmploymentType>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        size: 50,
      },
      {
        accessorKey: 'Name',
        header: 'Name',
        cell: ({ row }) => (
          <AutoTooltip className='font-medium text-primary'>
            {row.getValue('Name')}
          </AutoTooltip>
        ),
      },
      {
        accessorKey: 'Code',
        header: 'Code',
        cell: ({ row }) => (
          <Badge variant='code'>
            <AutoTooltip>{row.getValue('Code')}</AutoTooltip>
          </Badge>
        ),
      },
      {
        accessorKey: 'AccountId',
        header: 'Account',
        sortingFn: (rowA, rowB, columnId) => {
          const nameA = getAccountName(
            rowA.getValue(columnId) as string,
          ).toLowerCase();
          const nameB = getAccountName(
            rowB.getValue(columnId) as string,
          ).toLowerCase();
          return nameA.localeCompare(nameB);
        },
        cell: ({ row }) => (
          <AutoTooltip className='text-ink-primary'>
            {getAccountName(row.getValue('AccountId') || '')}
          </AutoTooltip>
        ),
      },
      {
        accessorKey: 'Description',
        header: 'Description',
        cell: ({ row }) => (
          <AutoTooltip className='text-ink-secondary dark:text-gray-400 truncate max-w-[200px] block'>
            {row.getValue('Description') || '-'}
          </AutoTooltip>
        ),
      },
      {
        accessorKey: 'IsActive',
        header: 'Status',
        cell: ({ row }) => {
          return (
            <StatusSwitch
              checked={row.getValue('IsActive')}
              onCheckedChange={async (checked) => {
                try {
                  await updateEmploymentType.mutateAsync({
                    id: row.original.EmploymentTypeId,
                    data: { ...row.original, IsActive: checked },
                  });
                  notify.success(
                    `You successfully ${checked ? 'activated' : 'deactivated'
                    } the employment type ———— ${row.original.Name}`,
                    'Update Status Success',
                  );
                } catch {
                  notify.error(
                    'Failed to update status. Please try again.',
                    'Update Status Error',
                  );
                }
              }}
              className='scale-75'
            />
          );
        },
      },
    ],
    [getAccountName, updateEmploymentType],
  );

  // Initialize column order on load
  React.useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnSettings('employment-types', {
        order: columns.map(
          (c) =>
            (c.id || (c as { accessorKey?: string }).accessorKey) as string,
        ),
      });
    }
  }, [columns, columnOrder.length, setColumnSettings]);

  const isSettingsOpen =
    isDrawerOpen &&
    useLayoutStore.getState().drawerConfig.title === 'View Settings';

  const handleSettingsClick = () => {
    if (isSettingsOpen) {
      notify.info('View settings closed');
      closeDrawer();
      return;
    }

    notify.info('View settings opened');
    setEditingId(null);
    openDrawer({
      title: 'View Settings',
      width: 400,
      content: (
        <ColumnSettingsDialog
          columns={columns}
          columnOrder={columnOrder}
          setColumnOrder={(order) =>
            setColumnSettings('employment-types', { order })
          }
          columnVisibility={columnVisibility}
          setColumnVisibility={(updaterOrValue) => {
            const newValue =
              typeof updaterOrValue === 'function'
                ? (
                  updaterOrValue as (
                    prev: Record<string, boolean>,
                  ) => Record<string, boolean>
                )(columnVisibility)
                : updaterOrValue;
            setColumnSettings('employment-types', { visibility: newValue });
          }}
          onClose={() => {
            notify.info('View settings closed');
            closeDrawer();
          }}
        />
      ),
    });
  };

  useHeader({
    title: 'Employment Types',
    description: 'Manage employment types and their configurations.',
    children: (
      <TableToolbar
        search={{
          value: searchQuery,
          onChange: search.onChange,
          placeholder: 'Search employment types...',
          isDebouncing,
        }}
        filter={{
          accounts: accounts || [],
          selectedIds: selectedAccountIds,
          onSelectionChange: setSelectedAccountIds,
          totalCount: employmentTypes?.length,
        }}
        onSettingsClick={handleSettingsClick}
        isSettingsOpen={isSettingsOpen}
      >
        {selectedRows.length > 0 && (
          <Tooltip content={`Delete ${selectedRows.length} selected items`}>
            <Button
              onClick={handleBulkDelete}
              variant='destructive'
              size='icon'
              className='rounded-full'
            >
              <Trash2 className='size-4' />
            </Button>
          </Tooltip>
        )}
        <Tooltip
          content={isSelectionMode ? 'Exit Selection Mode' : 'Multi-Select'}
        >
          <Button
            onClick={() => {
              const newMode = !isSelectionMode;
              setSelectionMode(newMode);
              if (newMode) {
                notify.info('Entered multi-select mode');
                closeDrawer();
                useLayoutStore.getState().actions.setSidebarCollapsed(true);
              } else {
                notify.info('Exited multi-select mode');
              }
            }}
            variant={isSelectionMode ? 'default' : 'ghost'}
            size='icon'
          >
            <GripVertical className='size-4' />
          </Button>
        </Tooltip>
        <Tooltip
          content={
            selectedAccountIds.length !== 1
              ? 'Select exactly one account to create'
              : 'Create New'
          }
        >
          <div className='inline-block'>
            <Button
              onClick={handleCreate}
              disabled={selectedAccountIds.length !== 1}
              size='icon'
              className='rounded-full'
            >
              <Plus className='size-4' />
            </Button>
          </div>
        </Tooltip>
      </TableToolbar>
    ),
  });

  return (
    <div className='flex flex-1 items-start gap-4'>
      <div className='flex-1 space-y-6 min-w-0'>
        {viewMode === 'table' ? (
          <div className='rounded-2xl border border-gray-200 bg-panel -sm dark:border-zinc-800 /50'>
            <DataTable
              columns={columns}
              data={filteredTypes}
              enableSorting={true}
              enableColumnVisibility={true}
              enableRowSelection={true}
              onRowSelectionChange={setSelectedRows}
              hideToolbar={true}
              isSelectionMode={isSelectionMode}
              onSelectionModeChange={(mode) => setSelectionMode(mode)}
              // Settings
              // Column State
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={(updaterOrValue) => {
                const newValue =
                  typeof updaterOrValue === 'function'
                    ? updaterOrValue(columnVisibility)
                    : updaterOrValue;
                setColumnSettings('employment-types', { visibility: newValue });
              }}
              columnOrder={columnOrder}
              onColumnOrderChange={(updaterOrValue) => {
                const newValue =
                  typeof updaterOrValue === 'function'
                    ? updaterOrValue(columnOrder)
                    : updaterOrValue;
                setColumnSettings('employment-types', { order: newValue });
              }}
              defaultSorting={[{ id: 'AccountId', desc: false }]}
              renderRowActions={(row) => (
                <>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-full text-ink-secondary hover:text-gray-900 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800'
                    onClick={() => handleEdit(row.original)}
                  >
                    <Edit2 className='size-5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='rounded-full text-ink-secondary hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
                    onClick={() => handleDelete(row.original.EmploymentTypeId)}
                  >
                    <Trash2 className='size-5' />
                  </Button>
                </>
              )}
            />
          </div>
        ) : (
          <WaterfallLayout
            minColumnWidth={
              isSelectionMode
                ? { sm: 150, md: 150, lg: 180, xl: 200 }
                : undefined
            }
            itemScale={isSelectionMode ? 0.9 : 1}
          >
            {filteredTypes.map((type) => {
              const isSelected = selectedRows.some(
                (r) => r.EmploymentTypeId === type.EmploymentTypeId,
              );
              return (
                <div
                  key={type.EmploymentTypeId}
                  onClick={() =>
                    isSelectionMode ? toggleSelection(type) : handleEdit(type)
                  }
                  className={cn(
                    'group relative overflow-hidden rounded-card border-2 bg-panel p-card transition-all hover:border-primary/50 hover:dark:border-primary cursor-pointer',
                    isSelected
                      ? 'border-green-500 bg-green-50/5 dark:bg-green-900/10 ring-1 ring-green-500'
                      : 'border-transparent',
                  )}
                >
                  {isSelected && <SelectionOverlay />}
                  {editingId === type.EmploymentTypeId && <EditingOverlay />}
                  <CardBackgroundInitials name={type.Name} />

                  <div className='relative z-10'>
                    <div className='mb-4 flex items-start justify-between'>
                      <IconBox>
                        <Briefcase className='size-6' />
                      </IconBox>
                    </div>

                    {columnOrder.map((colId) => {
                      if (columnVisibility[colId] === false) return null;

                      switch (colId) {
                        case 'Name':
                          return (
                            <H3 key={colId} className='mb-2 text-primary'>
                              <AutoTooltip className='font-bold'>
                                {type.Name}
                              </AutoTooltip>
                            </H3>
                          );
                        case 'Code':
                          return (
                            <Badge key={colId} variant='code' className='mb-4'>
                              <AutoTooltip>{type.Code}</AutoTooltip>
                            </Badge>
                          );
                        case 'AccountId':
                          return (
                            <div key={colId} className='mb-4'>
                              <span className='rounded-md bg-gray-500/5 px-2 py-1 text-xs text-ink-secondary'>
                                {getAccountName(type.AccountId || '')}
                              </span>
                            </div>
                          );
                        case 'Description':
                          return type.Description ? (
                            <div key={colId} className='mb-4'>
                              <AutoTooltip className='text-sm text-ink-secondary dark:text-gray-400 line-clamp-2'>
                                {type.Description}
                              </AutoTooltip>
                            </div>
                          ) : null;
                        case 'IsActive':
                          return (
                            <div key={colId} className='mb-4'>
                              <span
                                className={cn(
                                  'rounded-full px-2.5 py-1 text-xs font-bold',
                                  type.IsActive
                                    ? 'bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-500/10 text-ink-secondary dark:bg-zinc-800 dark:text-gray-400',
                                )}
                              >
                                {type.IsActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add Employment Type Placeholder */}
            <div className='flex flex-col gap-2'>
              <AddEntityCard
                onClick={() => {
                  if (selectedAccountIds.length === 1) {
                    handleCreate();
                  }
                }}
                label='Add Employment Type'
                className={
                  selectedAccountIds.length !== 1
                    ? 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-transparent dark:hover:border-zinc-700'
                    : ''
                }
              />
              {selectedAccountIds.length !== 1 && (
                <p className='text-center text-xs text-red-500'>
                  Select one account first
                </p>
              )}
            </div>
          </WaterfallLayout>
        )}
      </div>
    </div>
  );
}
