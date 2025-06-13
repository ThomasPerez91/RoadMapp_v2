import { Button, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { FlashMessages } from '~/components/flash_messages'
import { useAppDrawer } from '~/components/drawer'
import type { Address } from '~/types/app'

interface AddressFormValues {
  name: string
  address: string
  postalCode: string
  city: string
}

interface AddressFormProps {
  onSuccess: () => void
  address?: Address
}

export function AddressForm({ onSuccess, address }: AddressFormProps) {
  const { close } = useAppDrawer()
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const form = useForm<AddressFormValues>({
    initialValues: {
      name: address?.name || '',
      address: address?.address || '',
      postalCode: address?.postalCode || '',
      city: address?.city || '',
    },
    validate: {
      name: (v) => (v.trim() === '' ? 'Requis' : null),
      address: (v) => (v.trim() === '' ? 'Requis' : null),
      postalCode: (v) => (v.trim() === '' ? 'Requis' : null),
      city: (v) => (v.trim() === '' ? 'Requis' : null),
    },
  })

  const handleSubmit = async (values: AddressFormValues) => {
    try {
      const res = await fetch(address ? `/api/addresses/${address.id}` : '/api/addresses', {
        method: address ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Erreur inconnue')
      }
      onSuccess()
      close()
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <FlashMessages flash={flash} />
      <Stack>
        <TextInput label="Nom" withAsterisk {...form.getInputProps('name')} />
        <TextInput label="Adresse" withAsterisk {...form.getInputProps('address')} />
        <TextInput label="Code postal" withAsterisk {...form.getInputProps('postalCode')} />
        <TextInput label="Ville" withAsterisk {...form.getInputProps('city')} />
        <Button type="submit">{address ? 'Mettre à jour' : 'Ajouter'}</Button>
      </Stack>
    </form>
  )
}
