/** @format */

'use client';

import * as React from 'react';
import {
  Calculator,
  Percent,
  ShieldAlert,
  FileText,
  Briefcase,
  Hash,
  Clock,
  PiggyBank,
  X,
  List,
} from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { InputField } from '@/components/UI/input';
import { Select } from '@/components/UI/select/select';
import { Textarea as LabeledTextarea } from '@/components/UI/textarea';
import { Switch } from '@/components/UI/switch';
import { SegmentedControl } from '@/components/UI/segmented-control';
import { cn } from '@/lib/utils';
import {
  useForm,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form';
import {
  LeaveType,
  LeaveTypeCreate,
  useCreateLeaveType,
  useUpdateLeaveType,
  useLeaveType,
  LeaveTypeRule,
} from '@/api';
import { H2, H4, Muted } from '@/components/UI/text/typography';
import { notify } from '@/lib/notifications';
import { LeaveRulesList } from './leave-rules-list';
import { LeaveRuleConfigurationDialog } from '../../leave-rules/components/leave-rule-configuration-dialog';

type Tab = 'general' | 'nes' | 'loading' | 'advanced' | 'rules';

interface LeaveConfigurationDialogProps {
  onClose: () => void;
  leaveType: LeaveType | null;
  accountId: string;
}

export function LeaveConfigurationDialog({
  onClose,
  leaveType,
  accountId,
}: LeaveConfigurationDialogProps) {
  const createType = useCreateLeaveType();
  const updateType = useUpdateLeaveType();
  const [activeTab, setActiveTab] = React.useState<Tab>('general');

  // Rule Editing State
  const [editingRule, setEditingRule] = React.useState<LeaveTypeRule | null>(
    null,
  );
  const [showRuleEditor, setShowRuleEditor] = React.useState(false);

  const { data: fullLeaveType, isLoading: isFetchingDetails } = useLeaveType(
    leaveType?.LeaveTypeId || '',
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, dirtyFields },
  } = useForm<LeaveTypeCreate>({
    mode: 'onChange',
    defaultValues: {
      AccountId: accountId,
      Name: '',
      Code: '',
      Description: '',
      NESCategory: '',
      IsPaid: true,
      AccruesDuringEmployment: true,
      IsCumulative: true,
      CountsForAnnualLeaveAccrual: false,
      HasLeaveLoading: false,
      DefaultLeaveLoadingPct: 0,
      IsCashedOutAllowed: false,
      MinBalancePostCashoutWeeks: 0,
      IsPaidOnTermination: true,
      IsPublicHolidaySensitive: true,
      IsShutdownEligible: false,
      HasExcessThresholdFlag: false,
      AllowsAdvanceLeaveFlag: false,
      HasHalfPayModeFlag: false,
      HasMinimumBlockSizeFlag: false,
      ConvertibleToPersonalLeaveFlag: false,
      ConvertibleToOtherTypesFlag: false,
      IsTransferableBetweenEmployers: false,
      HasAccrualExcludeFlags: false,
    },
  });

  // Check if form has any changes
  const isEdited = Object.keys(dirtyFields).length > 0;

  React.useEffect(() => {
    setActiveTab('general');
    if (leaveType) {
      // Use full details if available, otherwise fall back to list item via leaveType to prevent empty form
      const data = fullLeaveType || leaveType;
      reset({
        AccountId: data.AccountId,
        Code: data.Code,
        Name: data.Name,
        Description: data.Description || '',
        NESCategory: data.NESCategory || '',
        IsPaid: data.IsPaid ?? true,
        AccruesDuringEmployment: data.AccruesDuringEmployment ?? true,
        IsCumulative: data.IsCumulative ?? true,
        CountsForAnnualLeaveAccrual: data.CountsForAnnualLeaveAccrual ?? false,
        HasLeaveLoading: data.HasLeaveLoading ?? false,
        DefaultLeaveLoadingPct: data.DefaultLeaveLoadingPct ?? 0,
        IsCashedOutAllowed: data.IsCashedOutAllowed ?? false,
        MinBalancePostCashoutWeeks: data.MinBalancePostCashoutWeeks ?? 0,
        IsPaidOnTermination: data.IsPaidOnTermination ?? true,
        IsPublicHolidaySensitive: data.IsPublicHolidaySensitive ?? true,
        IsShutdownEligible: data.IsShutdownEligible ?? false,
        HasExcessThresholdFlag: data.HasExcessThresholdFlag ?? false,
        AllowsAdvanceLeaveFlag: data.AllowsAdvanceLeaveFlag ?? false,
        HasHalfPayModeFlag: data.HasHalfPayModeFlag ?? false,
        HasMinimumBlockSizeFlag: data.HasMinimumBlockSizeFlag ?? false,
        ConvertibleToPersonalLeaveFlag:
          data.ConvertibleToPersonalLeaveFlag ?? false,
        ConvertibleToOtherTypesFlag: data.ConvertibleToOtherTypesFlag ?? false,
        IsTransferableBetweenEmployers:
          data.IsTransferableBetweenEmployers ?? false,
        HasAccrualExcludeFlags: data.HasAccrualExcludeFlags ?? false,
      });
    } else {
      reset({
        AccountId: accountId,
        Code: '',
        Name: '',
        Description: '',
        NESCategory: '',
        IsPaid: true,
        AccruesDuringEmployment: true,
        IsCumulative: true,
        CountsForAnnualLeaveAccrual: false,
        HasLeaveLoading: false,
        DefaultLeaveLoadingPct: 0,
        IsCashedOutAllowed: false,
        MinBalancePostCashoutWeeks: 0,
        IsPaidOnTermination: true,
        IsPublicHolidaySensitive: true,
        IsShutdownEligible: false,
        HasExcessThresholdFlag: false,
        AllowsAdvanceLeaveFlag: false,
        HasHalfPayModeFlag: false,
        HasMinimumBlockSizeFlag: false,
        ConvertibleToPersonalLeaveFlag: false,
        ConvertibleToOtherTypesFlag: false,
        IsTransferableBetweenEmployers: false,
        HasAccrualExcludeFlags: false,
      });
    }
  }, [leaveType, fullLeaveType, accountId, reset]);

  const onSubmit = async (data: LeaveTypeCreate) => {
    try {
      if (leaveType) {
        const updatePayload = {
          ...data,
          IsDeleted: leaveType.IsDeleted ?? false,
        };
        await updateType.mutateAsync({
          id: leaveType.LeaveTypeId,
          data: updatePayload,
        });
        notify.success(
          `You successfully updated the leave type ———— ${data.Name}`,
          'Update Leave Type Success',
        );
      } else {
        const payload = {
          ...data,
          AccountId: accountId,
        };
        await createType.mutateAsync(payload);
        notify.success(
          `You successfully created a new leave type ———— ${data.Name}`,
          'Create Leave Type Success',
        );
        // Close for now, maybe in future switch to edit mode to allow adding rules immediately
        onClose();
      }
    } catch (error: unknown) {
      console.error('Failed to save leave type', error);
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      notify.error(
        errorMessage ||
        (leaveType
          ? 'Failed to update leave type. Please try again.'
          : 'Failed to create leave type. Please try again.'),
        leaveType ? 'Update Leave Type Error' : 'Create Leave Type Error',
      );
    }
  };

  // Handle Rule Actions
  const handleAddRule = () => {
    setEditingRule(null);
    setShowRuleEditor(true);
  };

  const handleEditRule = (rule: LeaveTypeRule) => {
    setEditingRule(rule);
    setShowRuleEditor(true);
  };

  const handleBackFromRule = () => {
    setShowRuleEditor(false);
    setEditingRule(null);
  };

  const isLoading =
    createType.isPending ||
    updateType.isPending ||
    (!!leaveType && isFetchingDetails);
  const hasLeaveLoading = watch('HasLeaveLoading');
  const isCashedOutAllowed = watch('IsCashedOutAllowed');

  // If Rule Editor is active, render it
  if (showRuleEditor) {
    return (
      <LeaveRuleConfigurationDialog
        onClose={onClose}
        onBack={handleBackFromRule}
        rule={editingRule}
        preselectedLeaveTypeId={leaveType?.LeaveTypeId}
      />
    );
  }

  return (
    <div className='p-panel'>
      {/* Header */}
      <div className='drawer-header'>
        <div className='flex flex-col gap-2'>
          <H2 className='text-primary'>
            {leaveType
              ? `Edit Leave Type - ${leaveType.Name}${isEdited ? ' ( Edited )' : ''
              }`
              : 'Create Leave Type'}
          </H2>
          <Muted className='text-ink-secondary'>
            Configure complete leave type rules and settings.
          </Muted>
        </div>

        <Button Icon={X} onClick={onClose} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col flex-1 overflow-hidden'
      >
        <div className=''>
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as Tab)}
            options={[
              { value: 'general', label: 'Basics', icon: Briefcase },
              { value: 'nes', label: 'NES & Entitlement', icon: Calculator },
              { value: 'loading', label: 'Loading & Cashout', icon: PiggyBank },
              { value: 'advanced', label: 'Advanced', icon: ShieldAlert },
              { value: 'rules', label: 'Rules', icon: List },
            ]}
          />
        </div>

        <div className=''>
          {/* General Tab Content */}
          <div className={cn('form-body', activeTab !== 'general' && 'hidden')}>
            <div className='grid grid-cols-2 gap-4'>
              <InputField
                label={`Leave Name ${dirtyFields.Name ? '( Edited )' : ''}`}
                icon={Briefcase}
                placeholder='e.g. Annual Leave'
                {...register('Name', {
                  required: 'Name is required',
                  maxLength: 100,
                })}
                error={errors.Name?.message}
                maxLength={100}
              />
              <InputField
                label={`Code ${dirtyFields.Code ? '( Edited )' : ''}`}
                icon={Hash}
                placeholder='e.g. AL'
                {...register('Code', {
                  required: 'Code is required',
                  maxLength: 20,
                })}
                error={errors.Code?.message}
                maxLength={20}
              />
            </div>
            <LabeledTextarea
              label={`Description ${dirtyFields.Description ? '( Edited )' : ''
                }`}
              placeholder='Internal HR notes...'
              {...register('Description', { maxLength: 500 })}
              error={errors.Description?.message}
              maxLength={500}
            />
            <SwitchField
              label={`Is Active ${dirtyFields.IsActive ? '( Edited )' : ''}`}
              name='IsActive'
              watch={watch}
              setValue={setValue}
            />
          </div>

          {/* NES Tab Content */}
          <div className={cn('form-body', activeTab !== 'nes' && 'hidden')}>
            <Select
              label={`NES Category ${dirtyFields.NESCategory ? '( Edited )' : ''
                }`}
              icon={FileText}
              {...register('NESCategory')}
            >
              <option value=''>Select NES Category...</option>
              <option value='ANNUAL'>Annual Leave</option>
              <option value='PERSONAL'>Personal/Carer&apos;s Leave</option>
              <option value='LONG_SERVICE'>Long Service Leave</option>
              <option value='COMPASSIONATE'>Compassionate Leave</option>
              <option value='COMMUNITY_SERVICE'>Community Service Leave</option>
              <option value='OTHER'>Other (Non-NES)</option>
            </Select>
            <div className='  '>
              <H4>Payment & Accrual</H4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 relative mt-2'>
                <SwitchField
                  label={`Is Paid Leave ${dirtyFields.IsPaid ? '( Edited )' : ''
                    }`}
                  name='IsPaid'
                  watch={watch}
                  setValue={setValue}
                />
                <SwitchField
                  label={`Accrues During Employment ${dirtyFields.AccruesDuringEmployment ? '( Edited )' : ''
                    }`}
                  name='AccruesDuringEmployment'
                  watch={watch}
                  setValue={setValue}
                />
                <SwitchField
                  label={`Is Cumulative ${dirtyFields.IsCumulative ? '( Edited )' : ''
                    }`}
                  name='IsCumulative'
                  watch={watch}
                  setValue={setValue}
                />
                <SwitchField
                  label={`Counts for Annual Accrual ${dirtyFields.CountsForAnnualLeaveAccrual ? '( Edited )' : ''
                    }`}
                  name='CountsForAnnualLeaveAccrual'
                  watch={watch}
                  setValue={setValue}
                />
              </div>
            </div>
          </div>

          {/* Loading Tab Content */}
          <div className={cn('form-body', activeTab !== 'loading' && 'hidden')}>
            <div>
              <H4>Leave Loading</H4>
              <div className='relative mt-2'>
                <SwitchField
                  label={`Has Leave Loading ${dirtyFields.HasLeaveLoading ? '( Edited )' : ''
                    }`}
                  name='HasLeaveLoading'
                  watch={watch}
                  setValue={setValue}
                />
                {hasLeaveLoading && (
                  <InputField
                    type='number'
                    label={`Loading Percentage ${dirtyFields.DefaultLeaveLoadingPct ? '( Edited )' : ''
                      }`}
                    icon={Percent}
                    placeholder='17.5'
                    {...register('DefaultLeaveLoadingPct', {
                      valueAsNumber: true,
                    })}
                  />
                )}
              </div>
            </div>

            <div>
              <H4>Cashout Rules</H4>
              <div className='relative mt-2'>
                <SwitchField
                  label={`Allow Cashout ${dirtyFields.IsCashedOutAllowed ? '( Edited )' : ''
                    }`}
                  name='IsCashedOutAllowed'
                  watch={watch}
                  setValue={setValue}
                />
                {isCashedOutAllowed && (
                  <InputField
                    type='number'
                    label={`Min Balance Post Cashout (Weeks) ${dirtyFields.MinBalancePostCashoutWeeks ? '( Edited )' : ''
                      }`}
                    icon={Clock}
                    placeholder='4'
                    {...register('MinBalancePostCashoutWeeks', {
                      valueAsNumber: true,
                    })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Advanced Tab Content */}
          <div
            className={cn('form-body', activeTab !== 'advanced' && 'hidden')}
          >
            <H4>Termination & Sensitivity</H4>
            <div className='space-y-3'>
              <SwitchField
                label={`Paid on Termination ${dirtyFields.IsPaidOnTermination ? '( Edited )' : ''
                  }`}
                name='IsPaidOnTermination'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Public Holiday Sensitive ${dirtyFields.IsPublicHolidaySensitive ? '( Edited )' : ''
                  }`}
                name='IsPublicHolidaySensitive'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Shutdown Eligible ${dirtyFields.IsShutdownEligible ? '( Edited )' : ''
                  }`}
                name='IsShutdownEligible'
                watch={watch}
                setValue={setValue}
              />
            </div>

            <H4>Advanced Flags (Unlock Rules)</H4>
            <div className='grid grid-cols-1 gap-3'>
              <SwitchField
                label={`Has Excess Threshold ${dirtyFields.HasExcessThresholdFlag ? '( Edited )' : ''
                  }`}
                name='HasExcessThresholdFlag'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Allows Advance Leave ${dirtyFields.AllowsAdvanceLeaveFlag ? '( Edited )' : ''
                  }`}
                name='AllowsAdvanceLeaveFlag'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Has Half Pay Mode ${dirtyFields.HasHalfPayModeFlag ? '( Edited )' : ''
                  }`}
                name='HasHalfPayModeFlag'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Has Minimum Block Size ${dirtyFields.HasMinimumBlockSizeFlag ? '( Edited )' : ''
                  }`}
                name='HasMinimumBlockSizeFlag'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Convertible to Personal Leave ${dirtyFields.ConvertibleToPersonalLeaveFlag ? '( Edited )' : ''
                  }`}
                name='ConvertibleToPersonalLeaveFlag'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Convertible to Other Types ${dirtyFields.ConvertibleToOtherTypesFlag ? '( Edited )' : ''
                  }`}
                name='ConvertibleToOtherTypesFlag'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Transferable Between Employers ${dirtyFields.IsTransferableBetweenEmployers ? '( Edited )' : ''
                  }`}
                name='IsTransferableBetweenEmployers'
                watch={watch}
                setValue={setValue}
              />
              <SwitchField
                label={`Has Accrual Exclude Flags ${dirtyFields.HasAccrualExcludeFlags ? '( Edited )' : ''
                  }`}
                name='HasAccrualExcludeFlags'
                watch={watch}
                setValue={setValue}
              />
            </div>
          </div>

          {/* Rules Tab Content */}
          <div className={cn('form-body', activeTab !== 'rules' && 'hidden')}>
            {leaveType ? (
              <LeaveRulesList
                leaveTypeId={leaveType.LeaveTypeId}
                onEditRule={handleEditRule}
                onCreateRule={handleAddRule}
              />
            ) : (
              <div className='text-center p-8 text-ink-secondary'>
                Please create the leave type first before adding rules.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='footer'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            className='rounded-full'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            className='rounded-full'
            disabled={isLoading || !isValid || Object.keys(errors).length > 0}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SwitchField({
  label,
  name,
  watch,
  setValue,
}: {
  label: string;
  name: keyof LeaveTypeCreate;
  watch: UseFormWatch<LeaveTypeCreate>;
  setValue: UseFormSetValue<LeaveTypeCreate>;
}) {
  const value = watch(name);
  return (
    <div className='textarea'>
      <span className='text-sm font-medium text-ink-secondary'>{label}</span>
      <Switch
        checked={!!value}
        onCheckedChange={(checked) =>
          setValue(name, checked, { shouldDirty: true })
        }
      />
    </div>
  );
}
