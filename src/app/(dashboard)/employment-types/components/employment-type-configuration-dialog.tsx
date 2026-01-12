/** @format */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Briefcase, Power, Hash, AlignLeft, X } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { InputField } from '@/components/UI/input';
import { Textarea } from '@/components/UI/textarea';
import { Switch } from '@/components/UI/switch';
import { notify } from '@/lib/notifications';
import {
  EmploymentType,
  EmploymentTypeCreate,
  useCreateEmploymentType,
  useUpdateEmploymentType,
} from '@/api';
import { H2, Muted } from '@/components/UI/text/typography';
import { title } from 'process';

interface EmploymentTypeConfigurationDialogProps {
  onClose: () => void;
  type: EmploymentType | null;
  accountId: string;
}

export function EmploymentTypeConfigurationDialog({
  onClose,
  type,
  accountId,
}: EmploymentTypeConfigurationDialogProps) {
  const createType = useCreateEmploymentType();
  const updateType = useUpdateEmploymentType();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, dirtyFields },
  } = useForm<EmploymentTypeCreate>({
    mode: 'onChange',
    defaultValues: {
      AccountId: accountId,
      Code: '',
      Name: '',
      Description: '',
      IsActive: true,
    },
  });

  const isActive = watch('IsActive');
  const isEdited = Object.keys(dirtyFields).length > 0;

  React.useEffect(() => {
    if (type) {
      reset({
        AccountId: type.AccountId || accountId,
        Code: type.Code,
        Name: type.Name,
        Description: type.Description || '',
        IsActive: type.IsActive,
      });
    } else {
      reset({
        AccountId: accountId,
        Code: '',
        Name: '',
        Description: '',
        IsActive: true,
      });
    }
  }, [type, accountId, reset]);

  const onSubmit = async (data: EmploymentTypeCreate) => {
    try {
      const payload = {
        ...data,
        IsDeleted: type?.IsDeleted ?? false,
      };

      if (type) {
        await updateType.mutateAsync({
          id: type.EmploymentTypeId,
          data: payload,
        });
        notify.success(
          `You successfully update ${type.Name}`,
          'Update Employment Success',
        );
      } else {
        await createType.mutateAsync(payload);
        notify.success(
          `You successfully create a new employment type ———— ${data.Name}`,
          'Create Employment Success',
        );
      }
      onClose();
    } catch (error: any) {
      notify.error(
        error?.response?.data?.message ||
        'Failed to save employment type. Please try again.',
        'Error',
      );
    }
  };

  const isLoading = createType.isPending || updateType.isPending;

  return (
    <div className='flex flex-col h-full bg-panel p-panel'>
      <div className='drawer-header'>
        <div>
          <H2 className='text-primary'>
            {type
              ? `Edit Employment Type - ${type.Name}${isEdited ? ' ( Edited )' : ''
              }`
              : 'Create Employment Type'}
          </H2>
          <Muted className='text-ink-secondary'>
            Configure employment type details.
          </Muted>
        </div>

        <Button Icon={X} onClick={onClose} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className=' '>
        <div className='form-body'>
          {/* Status Toggle */}
          <div className='flex items-center justify-between rounded-full bg-glass  focus:border-primary border border-input p-4 '>
            <div className='flex items-center gap-3'>
              <div
                className={`flex size-10 items-center justify-center rounded-full ${isActive
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-500/10 text-ink-secondary'
                  }`}
              >
                <Power className='size-5' />
              </div>
              <div>
                <p className='font-semibold text-primary'>Active Status</p>
                <p className='text-xs text-ink-secondary'>
                  Enable or disable this type
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue('IsActive', checked, { shouldDirty: true })
              }
            />
          </div>

          {/* Form Fields */}
          <div className='space-y-4'>
            <InputField
              label={`Code${dirtyFields.Code ? ' ( Edited )' : ''}`}
              icon={Hash}
              placeholder='e.g. FT'
              {...register('Code', {
                required: 'Code is required',
                maxLength: {
                  value: 20,
                  message: 'Code must be 20 characters or less',
                },
              })}
              error={errors.Code?.message}
              maxLength={20}
            />

            <InputField
              label={`Name${dirtyFields.Name ? ' ( Edited )' : ''}`}
              icon={Briefcase}
              placeholder='e.g. Full-Time'
              {...register('Name', {
                required: 'Name is required',
                maxLength: {
                  value: 100,
                  message: 'Name must be 100 characters or less',
                },
              })}
              error={errors.Name?.message}
              maxLength={100}
            />

            <Textarea
              label={`Description${dirtyFields.Description ? ' ( Edited )' : ''
                }`}
              icon={AlignLeft}
              rows={4}
              placeholder='Enter description...'
              {...register('Description', {
                maxLength: {
                  value: 500,
                  message: 'Description must be 500 characters or less',
                },
              })}
              error={errors.Description?.message}
              maxLength={500}
            />
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
