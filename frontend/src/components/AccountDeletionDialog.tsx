import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { normalizeEmail, validateEmail } from '@/features/auth/auth'

type ConfirmationField = {
  autoComplete?: string
  expectedValue: string
  id: string
  invalidMessage: string
  label: string
  placeholder: string
  requiredMessage: string
}

type FieldFeedback = {
  message: string | null
  state: 'idle' | 'invalid' | 'valid'
}

type AccountDeletionDialogProps = {
  confirmationDescription?: string
  confirmationTitle: string
  confirmText?: string
  errorMessage?: string | null
  fields: ConfirmationField[]
  loading?: boolean
  onClose: () => void
  onConfirm: (values: Record<string, string>) => Promise<void>
  open: boolean
  warningDescription: string
  warningTitle: string
}

const createFieldValueMap = (fields: ConfirmationField[]) =>
  Object.fromEntries(fields.map((field) => [field.id, '']))

export function AccountDeletionDialog({
  open,
  fields,
  ...props
}: AccountDeletionDialogProps) {
  const fieldSignature = fields
    .map((field) => `${field.id}:${field.expectedValue}`)
    .join('|')

  if (!open) {
    return null
  }

  return (
    <AccountDeletionDialogContent
      {...props}
      fields={fields}
      key={fieldSignature}
    />
  )
}

function AccountDeletionDialogContent({
  confirmationDescription,
  confirmationTitle,
  confirmText = 'Supprimer',
  errorMessage,
  fields,
  loading = false,
  onClose,
  onConfirm,
  warningDescription,
  warningTitle,
}: Omit<AccountDeletionDialogProps, 'open'>) {
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning')
  const [values, setValues] = useState<Record<string, string>>(() =>
    createFieldValueMap(fields),
  )
  const [expectedValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [field.id, normalizeEmail(field.expectedValue)]),
    ),
  )

  const feedbackByField = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => {
          const normalizedValue = normalizeEmail(values[field.id] ?? '')
          const expectedValue = expectedValues[field.id] ?? ''

          if (!normalizedValue) {
            return [
              field.id,
              {
                message: null,
                state: 'idle',
              } satisfies FieldFeedback,
            ]
          }

          if (normalizedValue === expectedValue) {
            return [
              field.id,
              {
                message: 'Adresse validee.',
                state: 'valid',
              } satisfies FieldFeedback,
            ]
          }

          if (validateEmail(normalizedValue) === null) {
            return [
              field.id,
              {
                message: field.invalidMessage,
                state: 'invalid',
              } satisfies FieldFeedback,
            ]
          }

          return [
            field.id,
            {
              message: null,
              state: 'idle',
            } satisfies FieldFeedback,
          ]
        }),
      ) as Record<string, FieldFeedback>,
    [expectedValues, fields, values],
  )

  const allFieldsValid = useMemo(
    () =>
      fields.every((field) => feedbackByField[field.id]?.state === 'valid'),
    [feedbackByField, fields],
  )

  const closeDialog = () => {
    if (loading) {
      return
    }

    onClose()
  }

  const handleChange = (fieldId: string, nextValue: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [fieldId]: nextValue,
    }))
  }

  return (
    <>
      <ConfirmDialog
        confirmText={confirmText}
        description={warningDescription}
        onCancel={closeDialog}
        onConfirm={async () => {
          setStep('confirmation')
        }}
        open={step === 'warning'}
        title={warningTitle}
      />

      <ConfirmDialog
        confirmDisabled={!allFieldsValid}
        confirmText={confirmText}
        description={confirmationDescription}
        loading={loading}
        onCancel={closeDialog}
        onConfirm={async () => {
          await onConfirm(values)
        }}
        open={step === 'confirmation'}
        title={confirmationTitle}
      >
        <div className="space-y-4">
          {errorMessage ? (
            <p className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-900">
              {errorMessage}
            </p>
          ) : null}

          {fields.map((field, index) => {
            const feedback = feedbackByField[field.id]
            const isInvalid = feedback?.state === 'invalid'
            const isValid = feedback?.state === 'valid'

            return (
              <label className="block space-y-2" htmlFor={field.id} key={field.id}>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {field.label}
                </span>

                <div className="relative">
                  <input
                    autoComplete={field.autoComplete}
                    autoFocus={index === 0}
                    className={`w-full rounded-3xl border bg-stone-50 px-5 py-4 pr-12 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:bg-white ${
                      isInvalid
                        ? 'border-red-500 focus:border-red-500'
                        : isValid
                          ? 'border-emerald-300 bg-emerald-50/70 focus:border-emerald-500'
                          : 'border-stone-200 focus:border-stone-950'
                    }`}
                    id={field.id}
                    onChange={(event) => handleChange(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    type="email"
                    value={values[field.id] ?? ''}
                  />

                  {isValid ? (
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-600">
                      <Check className="h-4 w-4" strokeWidth={2} />
                    </span>
                  ) : null}
                </div>

                {feedback?.message ? (
                  <p
                    className={`text-sm ${
                      isInvalid ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {feedback.message}
                  </p>
                ) : null}
              </label>
            )
          })}
        </div>
      </ConfirmDialog>
    </>
  )
}
