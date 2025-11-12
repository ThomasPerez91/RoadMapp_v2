// inertia/pages/users/settings.tsx
import { Head, router } from '@inertiajs/react'
import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import UserLayout from '~/layouts/user_layout'
import type { Address } from '~/types/app'
import { AddressForm } from '~/components/addresses/address_form'
import { FlashMessages } from '~/components/flash_messages'
import { updateUserProfile } from '~/services/user'

interface SettingsUser {
  id: number
  name: string
  email: string
  nickname: string
  avatarUrl: string
}

interface SettingsProps {
  user: SettingsUser
  homeAddress: Address | null
}

type Section = 'profile' | 'home'

function Settings({ user, homeAddress }: SettingsProps) {
  const [section, setSection] = useState<Section>('profile')
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const profileForm = useForm({
    initialValues: {
      name: user.name,
      avatar_url: user.avatarUrl || '',
    },
    validate: {
      name: (v) => (v.trim() === '' ? 'Requis' : null),
    },
  })

  const handleProfileSubmit = async (values: typeof profileForm.values) => {
    setFlash(null)
    try {
      await updateUserProfile(values)

      router.reload({
        only: ['user'],
        onSuccess: () => {
          setFlash({ type: 'success', message: 'Profil mis à jour' })
        },
      })
    } catch (error: any) {
      setFlash({ type: 'error', message: error.message })
    }
  }

  return (
    <>
      <Head title="Paramètres" />
      <Container size="lg">
        <Group align="flex-start" gap="xl" mt="xl">
          {/* Menu latéral */}
          <Paper
            withBorder
            radius="lg"
            p="md"
            w={260}
            style={{
              background: 'linear-gradient(180deg, rgba(7,14,24,.85), rgba(7,14,24,.70))',
              borderColor: 'rgba(255,255,255,.06)',
            }}
          >
            <Title order={4} mb="sm">
              Paramètres
            </Title>
            <Stack gap={4}>
              <Button
                variant={section === 'profile' ? 'gradient' : 'subtle'}
                gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                size="xs"
                justify="flex-start"
                fullWidth
                onClick={() => setSection('profile')}
              >
                Profil
              </Button>
              <Button
                variant={section === 'home' ? 'gradient' : 'subtle'}
                gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                size="xs"
                justify="flex-start"
                fullWidth
                onClick={() => setSection('home')}
              >
                Adresse de départ
              </Button>
            </Stack>
          </Paper>

          {/* Contenu principal */}
          <Box style={{ flex: 1, maxWidth: rem(900) }}>
            <FlashMessages flash={flash} />

            {section === 'profile' && (
              <Paper
                withBorder
                radius="lg"
                p="lg"
                style={{
                  background: 'rgba(7,14,24,.80)',
                  borderColor: 'rgba(255,255,255,.06)',
                }}
              >
                <Group justify="space-between" align="flex-start" mb="lg">
                  <div>
                    <Title order={3}>Profil</Title>
                    <Text c="dimmed" fz="sm">
                      Modifie ton nom et l’URL de ton avatar.
                    </Text>
                  </div>
                  <Avatar src={user.avatarUrl} alt={user.name} size="lg" radius="xl">
                    {user.name?.[0]?.toUpperCase()}
                  </Avatar>
                </Group>

                <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
                  <Stack gap="md">
                    <TextInput label="Nom" withAsterisk {...profileForm.getInputProps('name')} />
                    <TextInput
                      label="URL de l’avatar"
                      placeholder="https://…"
                      {...profileForm.getInputProps('avatar_url')}
                    />

                    <Button
                      type="submit"
                      variant="gradient"
                      gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                      maw={200}
                    >
                      Enregistrer
                    </Button>
                  </Stack>
                </form>
              </Paper>
            )}

            {section === 'home' && (
              <Paper
                withBorder
                radius="lg"
                p="lg"
                style={{
                  background: 'rgba(7,14,24,.80)',
                  borderColor: 'rgba(255,255,255,.06)',
                }}
              >
                <Stack gap="md">
                  <div>
                    <Title order={3}>Adresse de départ</Title>
                    <Text c="dimmed" fz="sm">
                      Choisis l’adresse utilisée par défaut comme point de départ (maison, bureau,
                      …).
                    </Text>
                  </div>

                  {homeAddress && (
                    <Paper
                      withBorder
                      radius="md"
                      p="sm"
                      style={{ background: 'rgba(255,255,255,.02)' }}
                    >
                      <Text fw={500}>{homeAddress.name}</Text>
                      <Text fz="sm" c="dimmed">
                        {homeAddress.address}
                      </Text>
                      <Text fz="sm" c="dimmed">
                        {homeAddress.postalCode} {homeAddress.city}
                      </Text>
                    </Paper>
                  )}

                  <AddressForm
                    address={homeAddress ?? undefined}
                    extraPayload={{ is_home: true, is_active: true }}
                    onSuccess={() => {
                      router.reload({
                        only: ['homeAddress'],
                        onSuccess: () => {
                          setFlash({ type: 'success', message: 'Adresse de départ mise à jour' })
                        },
                      })
                    }}
                  />
                </Stack>
              </Paper>
            )}
          </Box>
        </Group>
      </Container>
    </>
  )
}

Settings.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Settings
