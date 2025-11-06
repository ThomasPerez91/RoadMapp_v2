import { Button, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { FlashMessages } from '~/components/flash_messages'
import { useAppDrawer } from '~/components/drawer'
import type { Address } from '~/types/app'

interface AddressFormValues {
  name: string
  address: string
  postal_code: string
  city: string
}

interface AddressFormProps {
  onSuccess: () => void
  address?: Address
}

// 🔐 Récupère le token CSRF depuis le cookie XSRF-TOKEN
function getCsrfTokenFromCookie(): string {
  if (typeof document === 'undefined') return ''
  const cookie = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='))
  if (!cookie) return ''
  return decodeURIComponent(cookie.split('=')[1] || '')
}

export function AddressForm({ onSuccess, address }: AddressFormProps) {
  const { close } = useAppDrawer()
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<AddressFormValues>({
    initialValues: {
      name: address?.name || '',
      address: address?.address || '',
      postal_code: address?.postalCode || '',
      city: address?.city || '',
    },
    validate: {
      name: (v) => (v.trim() === '' ? 'Requis' : null),
      address: (v) => (v.trim() === '' ? 'Requis' : null),
      postal_code: (v) => (v.trim() === '' ? 'Requis' : null),
      city: (v) => (v.trim() === '' ? 'Requis' : null),
    },
  })

  const handleSubmit = async (values: AddressFormValues) => {
    setFlash(null)
    setLoading(true)

    try {
      const csrfToken = getCsrfTokenFromCookie()

      const res = await fetch(address ? `/api/addresses/${address.id}` : '/api/addresses', {
        method: address ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': csrfToken, // ✅ ce que Shield attend
        },
        body: JSON.stringify(values),
        credentials: 'include', // 🔐 pour envoyer le cookie XSRF-TOKEN avec la requête
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Erreur inconnue')
      }

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
        <TextInput label="Adresse" withAsterisk {...form.getInputProps('address')} />
        <TextInput label="Code postal" withAsterisk {...form.getInputProps('postal_code')} />
        <TextInput label="Ville" withAsterisk {...form.getInputProps('city')} />
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
