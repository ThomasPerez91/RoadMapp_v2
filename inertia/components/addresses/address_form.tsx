// inertia/components/addresses/address_form.tsx
import { Button, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { FlashMessages } from '~/components/flash_messages'
import { useAppDrawer } from '~/components/drawer'
import type { Address } from '~/types/app'
import { saveAddress } from '~/services/addresses'

interface AddressFormValues {
  name: string
  address: string
  postal_code: string
  city: string
}

interface AddressFormProps {
  onSuccess: () => void
  address?: Address
  /** Permet d’ajouter des champs comme is_home, is_active, etc. */
  extraPayload?: Record<string, unknown>
}

export function AddressForm({ onSuccess, address, extraPayload }: AddressFormProps) {
  const { close } = useAppDrawer()
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const isEdit = !!address
  const isUsed = !!address?.used

  const form = useForm<AddressFormValues>({
    initialValues: {
      name: address?.name || '',
      address: address?.address || '',
      postal_code: address?.postalCode || '',
      city: address?.city || '',
    },
    validate: {
      name: (v) => (v.trim() === '' ? 'Requis' : null),
      address: (v) => (isUsed ? null : v.trim() === '' ? 'Requis' : null),
      postal_code: (v) => (isUsed ? null : v.trim() === '' ? 'Requis' : null),
      city: (v) => (isUsed ? null : v.trim() === '' ? 'Requis' : null),
    },
  })

  const handleSubmit = async (values: AddressFormValues) => {
    setFlash(null)
    setLoading(true)

    try {
      await saveAddress(isEdit ? address!.id : null, {
        ...values,
        ...(extraPayload || {}),
      })

      onSuccess()
      close()
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <FlashMessages flash={flash} />
      <Stack>
        <TextInput label="Nom" withAsterisk {...form.getInputProps('name')} />
        <TextInput label="Adresse" withAsterisk={!isUsed} {...form.getInputProps('address')} />
        <TextInput
          label="Code postal"
          withAsterisk={!isUsed}
          {...form.getInputProps('postal_code')}
        />
        <TextInput label="Ville" withAsterisk={!isUsed} {...form.getInputProps('city')} />

        <Button
          type="submit"
          loading={loading}
          variant="gradient"
          gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
        >
          {address ? 'Mettre à jour' : 'Ajouter'}
        </Button>
      </Stack>
    </form>
  )
}
