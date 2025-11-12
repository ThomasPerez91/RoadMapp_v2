import { useState } from 'react'
import {
  ActionIcon,
  CloseButton,
  Group,
  List,
  Paper,
  Portal,
  Text,
  Title,
  Transition,
  useMantineTheme,
} from '@mantine/core'
import { useClickOutside, useHotkeys, useMediaQuery } from '@mantine/hooks'
import { TbInfoCircle, TbX } from 'react-icons/tb'
import { pageDocs, type PageDocKey } from '~/pages/page_docs'

interface PageInfoButtonProps {
  page: PageDocKey
  ariaLabel?: string
}

export function PageInfoButton({ page, ariaLabel = 'Afficher les informations de la page' }: PageInfoButtonProps) {
  const info = pageDocs[page]
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)
  const [opened, setOpened] = useState(false)
  const panelId = `page-info-${page}`

  const close = () => setOpened(false)
  const toggle = () => setOpened((prev) => !prev)

  useHotkeys(
    [
      ['Escape', () => close()],
    ],
    { enabled: opened }
  )

  const ref = useClickOutside<HTMLDivElement>(() => close())

  if (!info) {
    return null
  }

  return (
    <>
      <ActionIcon
        variant="light"
        color="ocean"
        radius="xl"
        size="lg"
        onClick={toggle}
        aria-label={ariaLabel}
        aria-expanded={opened}
        aria-controls={panelId}
      >
        <TbInfoCircle size={18} />
      </ActionIcon>

      <Portal>
        <Transition mounted={opened} transition="slide-left" duration={180} timingFunction="ease">
          {(styles) => (
            <Paper
              id={panelId}
              ref={ref}
              shadow="xl"
              radius="lg"
              p="lg"
              style={{
                ...styles,
                position: 'fixed',
                top: isMobile ? 'var(--mantine-spacing-lg)' : 'var(--mantine-spacing-xl)',
                right: isMobile ? 'var(--mantine-spacing-md)' : 'var(--mantine-spacing-xl)',
                left: isMobile ? 'var(--mantine-spacing-md)' : 'auto',
                width: isMobile ? 'auto' : 360,
                maxWidth: isMobile ? undefined : 360,
                zIndex: 4000,
                background: 'rgba(7,14,24,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Group justify="space-between" align="flex-start" mb="sm">
                <div>
                  <Text c="dimmed" fw={600} fz="xs" tt="uppercase" mb={4}>
                    Astuces
                  </Text>
                  <Title order={4} fz="lg">
                    {info.heading}
                  </Title>
                </div>
                <CloseButton
                  size="sm"
                  variant="subtle"
                  onClick={close}
                  aria-label="Fermer les informations de la page"
                  icon={<TbX size={14} />}
                />
              </Group>
              <List spacing="sm" size="sm" c="var(--mantine-color-text)" withPadding>
                {info.bullets.map((line) => (
                  <List.Item key={line}>{line}</List.Item>
                ))}
              </List>
            </Paper>
          )}
        </Transition>
      </Portal>
    </>
  )
}
