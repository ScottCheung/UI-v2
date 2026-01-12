/** @format */

'use client';

import * as React from 'react';
import {
  useForm,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form';
import {
  Briefcase,
  Calculator,
  Calendar,
  Tag,
  FileText,
  Hash,
  X,
  ChevronLeft,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { InputField } from '@/components/UI/input';
import { Select } from '@/components/UI/select/select';
import { Switch } from '@/components/UI/switch';
import { SegmentedControl } from '@/components/UI/segmented-control';
import { cn } from '@/lib/utils';
import {
  useCreateLeaveTypeRule,
  useUpdateLeaveTypeRule,
  LeaveTypeRule,
  LeaveTypeRuleCreate,
  useLeaveTypes,
  useEmploymentTypes,
  useLeaveTypeRulesMeta,
  FieldMetadata,
} from '@/api';
import { H2, H4, Muted } from '@/components/UI/text/typography';
import { notify } from '@/lib/notifications';

interface LeaveRuleConfigurationDialogProps {
  onClose: () => void;
  rule: LeaveTypeRule | null;
  preselectedLeaveTypeId?: string;
  onBack?: () => void;
}

type Tab = 'general' | 'accrual' | 'usage' | 'advanced';

export function LeaveRuleConfigurationDialog({
  onClose,
  rule,
  preselectedLeaveTypeId,
  onBack,
}: LeaveRuleConfigurationDialogProps) {
  const createRule = useCreateLeaveTypeRule();
  const updateRule = useUpdateLeaveTypeRule();
  const [activeTab, setActiveTab] = React.useState<Tab>('general');

  const { data: leaveTypes } = useLeaveTypes();
  const { data: employmentTypes } = useEmploymentTypes();
  const { data: metadata } = useLeaveTypeRulesMeta();

  // Helper function to get field metadata
  const getFieldMeta = (fieldName: string): FieldMetadata | undefined => {
    return metadata?.fields.find((f: FieldMetadata) => f.name === fieldName);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<LeaveTypeRuleCreate>();

  React.useEffect(() => {
    if (rule) {
      reset({
        ...rule,
        AccrualMethod: rule.AccrualMethod?.toUpperCase() || 'HOURLY',
        EffectiveDate: rule.EffectiveDate
          ? rule.EffectiveDate.split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    } else {
      reset({
        AccountId: '',
        LeaveTypeId: preselectedLeaveTypeId || '',
        EmploymentTypeId: '',
        Code: '',
        Name: '',
        Description: '',
        EffectiveDate: new Date().toISOString().split('T')[0],
        IsActive: true,

        // New Scope Fields
        RuleType: '',
        RuleValue: '',
        EmploymentTypeScope: '',

        // Defaults
        AccrualMethod: 'HOURLY',
        AccrualRate: 0.0769,
        IncludePublicHolidays: false,
        DeductsOnPublicHoliday: true,
        EvidenceRequirementMode: 'NONE',
        EvidenceContentMode: 'ANY',
        MinimumBlockSizeMode: 'NONE',
        CashingOutMode: 'DISALLOWED',
        AdvanceLeaveHandlingMode: 'DISALLOW',
        AccrualPHMode: 'NONE',
        BasisFallbackMode: 'NONE',
        RoundingMode: 'ROUND_NEAREST',

        // Initialize boolean flags
        AccruesForCasual: false,
        ShiftworkerQualifier: '',
        EvidenceRequiredFlag: false,
        FallbackCountsPH: false,
      });
    }
  }, [rule, preselectedLeaveTypeId, reset]);

  const onSubmit = async (data: LeaveTypeRuleCreate) => {
    console.log('Submitting Leave Rule:', data);
    try {
      if (!data.LeaveTypeId && rule) data.LeaveTypeId = rule.LeaveTypeId;
      if (!data.EmploymentTypeId && rule)
        data.EmploymentTypeId = rule.EmploymentTypeId;
      if (!data.LeaveTypeId && preselectedLeaveTypeId)
        data.LeaveTypeId = preselectedLeaveTypeId;

      if (!data.AccountId && leaveTypes) {
        const selectedLeaveType = leaveTypes.find(
          (lt) => lt.LeaveTypeId === data.LeaveTypeId,
        );
        if (selectedLeaveType) {
          data.AccountId = selectedLeaveType.AccountId;
        }
      }

      // Fallback for AccountId from rule if available
      if (!data.AccountId && rule) {
        data.AccountId = rule.AccountId;
      }

      if (!data.AccountId) {
        notify.error(
          'Could not determine Account ID. Please select a valid Leave Type.',
        );
        return;
      }

      if (rule) {
        await updateRule.mutateAsync({ id: rule.LeaveTypeRuleId, data });
        notify.success(
          `You successfully updated the rule ———— ${data.Name}`,
          'Update Rule Success',
        );
      } else {
        await createRule.mutateAsync(data);
        notify.success(
          `You successfully created a new rule ———— ${data.Name}`,
          'Create Rule Success',
        );
      }
      onClose();
    } catch (error: unknown) {
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      notify.error(
        errorMessage ||
        (rule
          ? 'Failed to update rule. Please try again.'
          : 'Failed to create rule. Please try again.'),
        rule ? 'Update Rule Error' : 'Create Rule Error',
      );
    }
  };

  const isEdited = Object.keys(dirtyFields).length > 0;

  return (
    <div className='drawer-container p-panel'>
      <div className='drawer-header'>
        <div className='flex items-center gap-2'>
          {onBack && <Button onClick={onBack} Icon={ChevronLeft} />}
          <div>
            <H2 className='text-primary'>
              {rule
                ? `Edit Leave Rule - ${rule.Name}${isEdited ? ' ( Edited )' : ''
                }`
                : 'Create Leave Type Rule'}
            </H2>
            <Muted className='text-ink-secondary'>
              {rule
                ? 'Update existing leave accrual rule.'
                : 'Create a new leave accrual rule.'}
            </Muted>
          </div>
        </div>
        {!onBack && <Button onClick={onClose} Icon={X} variant='ghost' />}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, (e) => {
          console.error('Form Validation Errors:', e);
          notify.error('Please check the form for errors.');
        })}
        className='flex flex-col flex-1 overflow-hidden'
      >
        <div className=''>
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as Tab)}
            options={[
              { value: 'general', label: 'General', icon: Briefcase },
              { value: 'accrual', label: 'Accrual', icon: Calculator },
              { value: 'usage', label: 'Usage', icon: Clock },
              { value: 'advanced', label: 'Advanced', icon: ShieldAlert },
            ]}
          />
        </div>

        <div className='flex-1 overflow-y-auto custom-scrollbar'>
          {/* General Tab */}
          <div className={cn('form-body', activeTab !== 'general' && 'hidden')}>
            <div className='grid grid-cols-2 gap-4'>
              <Select
                label='Leave Type'
                icon={Calendar}
                {...register('LeaveTypeId', { required: 'Required' })}
                error={errors.LeaveTypeId?.message}
                disabled={!!rule || !!preselectedLeaveTypeId}
                helpTextShort={getFieldMeta('LeaveTypeId')?.helpTextShort}
                helpTextLong={getFieldMeta('LeaveTypeId')?.helpTextLong}
              >
                <option value='' disabled>
                  Select leave type
                </option>
                {leaveTypes?.map((type) => (
                  <option key={type.LeaveTypeId} value={type.LeaveTypeId}>
                    {type.Name}
                  </option>
                ))}
              </Select>

              <Select
                label='Employment Type'
                icon={Briefcase}
                {...register('EmploymentTypeId', { required: 'Required' })}
                error={errors.EmploymentTypeId?.message}
                disabled={!!rule}
                helpTextShort={getFieldMeta('EmploymentTypeId')?.helpTextShort}
                helpTextLong={getFieldMeta('EmploymentTypeId')?.helpTextLong}
              >
                <option value='' disabled>
                  Select employment type
                </option>
                {employmentTypes?.map((type) => (
                  <option
                    key={type.EmploymentTypeId}
                    value={type.EmploymentTypeId}
                  >
                    {type.Name}
                  </option>
                ))}
              </Select>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <InputField
                label='Code'
                icon={Hash}
                placeholder='e.g. ACCRUAL_STD_001'
                {...register('Code', { required: 'Required' })}
                error={errors.Code?.message}
                helpTextShort={getFieldMeta('Code')?.helpTextShort}
                helpTextLong={getFieldMeta('Code')?.helpTextLong}
              />
              <InputField
                label='Name'
                icon={Tag}
                placeholder='e.g. Standard Accrual'
                {...register('Name', { required: 'Required' })}
                error={errors.Name?.message}
                helpTextShort={getFieldMeta('Name')?.helpTextShort}
                helpTextLong={getFieldMeta('Name')?.helpTextLong}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <Select label='Rule Type' {...register('RuleType')}>
                <option value=''>None</option>
                <option value='STANDARD'>Standard</option>
                <option value='CUSTOM'>Custom</option>
                <option value='OVERRIDE'>Override</option>
              </Select>
              <InputField
                label='Rule Value'
                {...register('RuleValue')}
                placeholder='Optional value...'
              />
            </div>

            <InputField
              label='Description'
              icon={FileText}
              placeholder='e.g. Continuous accrual, four weeks p.a.'
              {...register('Description')}
              error={errors.Description?.message}
            />

            <div className='grid  gap-4'>
              <InputField
                label='Effective Date'
                type='date'
                {...register('EffectiveDate', { required: 'Required' })}
                error={errors.EffectiveDate?.message}
              />
              <SwitchField
                label='Active Status'
                name='IsActive'
                watch={watch}
                setValue={setValue}
              />
            </div>
          </div>

          {/* Accrual Tab */}
          <div className={cn('form-body', activeTab !== 'accrual' && 'hidden')}>
            <div>
              <div className='space-y-3 mt-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <Select
                    label='Accrual Method'
                    icon={Calculator}
                    {...register('AccrualMethod', { required: 'Required' })}
                    helpTextShort={getFieldMeta('AccrualMethod')?.helpTextShort}
                    helpTextLong={getFieldMeta('AccrualMethod')?.helpTextLong}
                  >
                    <option value='HOURLY'>Perc. of Hours Worked</option>
                    <option value='FIXED'>Fixed Entitlement</option>
                    <option value='PER_PERIOD'>Per Period</option>
                  </Select>
                  <InputField
                    label='Accrual Rate'
                    type='number'
                    step='0.000001'
                    {...register('AccrualRate', { valueAsNumber: true })}
                    helpTextShort={getFieldMeta('AccrualRate')?.helpTextShort}
                    helpTextLong={getFieldMeta('AccrualRate')?.helpTextLong}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <SwitchField
                    label='Include Public Holidays'
                    name='IncludePublicHolidays'
                    watch={watch}
                    setValue={setValue}
                  />
                  <SwitchField
                    label='Deducts on Public Holiday'
                    name='DeductsOnPublicHoliday'
                    watch={watch}
                    setValue={setValue}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='space-y-3 mt-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <InputField
                    label='Annual Entitlement (Weeks)'
                    type='number'
                    {...register('AnnualEntitlementWeeks', {
                      valueAsNumber: true,
                    })}
                  />
                  <Select
                    label='Rounding Mode'
                    {...register('RoundingMode')}
                  >
                    <option value='ROUND_NEAREST'>Nearest</option>
                    <option value='ROUND_UP'>Up</option>
                    <option value='ROUND_DOWN'>Down</option>
                  </Select>
                </div>
                <div className='grid grid-cols- gap-4'>
                  <SwitchField
                    label='Accrues for Casual'
                    name='AccruesForCasual'
                    watch={watch}
                    setValue={setValue}
                  />
                  <Select
                    label='Shiftworker Qualifier'
                    {...register('ShiftworkerQualifier')}
                  >
                    <option value=''>None</option>
                    <option value='SHIFT_WORKER'>Shift Worker</option>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Tab */}
          <div className={cn('form-body', activeTab !== 'usage' && 'hidden')}>
            <div>
              <div className='grid grid-cols-2 gap-4 mt-2'>
                <Select label='Mode' {...register('CashingOutMode')}>
                  <option value='DISALLOWED'>Disallowed</option>
                  <option value='PERMITTED'>Permitted</option>
                </Select>
                <InputField
                  label='Max Weeks / Year'
                  type='number'
                  {...register('MaxCashoutWeeksPerYear', {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>

            <div>
              <H4>Evidence</H4>
              <div className='space-y-3 mt-2'>
                <SwitchField
                  label='Evidence Required'
                  name='EvidenceRequiredFlag'
                  watch={watch}
                  setValue={setValue}
                />
                {watch('EvidenceRequiredFlag') && (
                  <div className='grid grid-cols-2 gap-4'>
                    <Select
                      label='Requirement'
                      {...register('EvidenceRequirementMode')}
                    >
                      <option value='SOFT'>Soft (Recommended)</option>
                      <option value='STRICT'>Strict (Required)</option>
                    </Select>
                    <Select
                      label='Content'
                      {...register('EvidenceContentMode')}
                    >
                      <option value='ANY'>Any</option>
                      <option value='ATTACHMENT_ONLY'>Attachment Only</option>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div>
              <InputField
                label='Conversion Rules (JSON)'
                icon={FileText}
                placeholder='e.g. {"target": "PL", "ratio": 1.0}'
                {...register('ConversionRules')}
                error={errors.ConversionRules?.message}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <Select
                label='Advance Leave'
                {...register('AdvanceLeaveHandlingMode')}
              >
                <option value='DISALLOW'>Disallow</option>
                <option value='ALLOW_WITH_AGREEMENT'>
                  Allow (With Agreement)
                </option>
              </Select>
              <InputField
                label='Max Negative Hours'
                type='number'
                {...register('MaxNegativeHours', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Advanced Tab */}
          <div
            className={cn('form-body', activeTab !== 'advanced' && 'hidden')}
          >
            <div className='grid grid-cols-2 gap-4'>
              <InputField
                label='Excess Threshold (Weeks)'
                type='number'
                {...register('ExcessThresholdWeeks', { valueAsNumber: true })}
              />
              <Select
                label='Excess Direction'
                {...register('ExcessDirectionMode')}
              >
                <option value='NONE'>None</option>
                <option value='WARN'>Warn</option>
                <option value='DIRECT'>Direct</option>
              </Select>
            </div>

            <div className='space-y-3'>
              <Select
                label='Half Pay Accrual'
                {...register('HalfPayAccrualMode')}
              >
                <option value='FULL'>Full Accrual</option>
                <option value='PRO_RATA'>Pro-Rata</option>
                <option value='NONE'>None</option>
              </Select>
              <Select label='Half Pay Mode' {...register('HalfPayMode')}>
                <option value='HALF_UNITS_HALF_CASH'>
                  Half Units / Half Cash
                </option>
                <option value='DOUBLED_DURATION'>Doubled Duration</option>
                <option value='NONE'>None</option>
              </Select>
              <Select
                label='Workers Comp Accrual'
                {...register('WorkersCompAccrualMode')}
              >
                <option value='FULL'>Full Accrual</option>
                <option value='NONE'>None</option>
              </Select>
            </div>
          </div>
        </div>

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
            disabled={isSubmitting}
            className='rounded-full'
          >
            {rule ? 'Update Rule' : 'Create Rule'}
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
  name: keyof LeaveTypeRuleCreate;
  watch: UseFormWatch<LeaveTypeRuleCreate>;
  setValue: UseFormSetValue<LeaveTypeRuleCreate>;
}) {
  const value = watch(name);
  return (
    <div className='textarea'>
      <span className='text-sm font-medium text-ink-primary'>{label}</span>
      <Switch
        checked={!!value}
        onCheckedChange={(checked) =>
          setValue(name, checked, { shouldDirty: true })
        }
      />
    </div>
  );
}
