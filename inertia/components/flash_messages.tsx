import {
  Box,
  Group,
  Paper,
  Text,
  ThemeIcon,
  CloseButton,
  Transition,
  useMantineTheme,
} from '@mantine/core'
import { TbCheck, TbAlertTriangle } from 'react-icons/tb'
import { useEffect, useState } from 'react'

export type FlashState = {
  type: 'success' | 'error'
  message: string
} | null

interface FlashMessagesProps {
  flash: FlashState
}

export function FlashMessages({ flash }: FlashMessagesProps) {
  const theme = useMantineTheme()
  const [visible, setVisible] = useState(false)
  const [internal, setInternal] = useState<FlashState>(null)

  // Sync prop -> interne + timeout 5s
  useEffect(() => {
    if (!flash) {
      setVisible(false)
      return
    }

    setInternal(flash)
    setVisible(true)

    const timeout = setTimeout(() => {
      setVisible(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [flash])

  if (!internal) return null

  const isSuccess = internal.type === 'success'
  const iconColor = isSuccess ? theme.colors.teal[4] : theme.colors.red[4]
  const iconBg = isSuccess ? 'rgba(34,197,158,0.10)' : 'rgba(248,113,113,0.10)'

  return (
    <Transition
      mounted={visible}
      transition="slide-left" // arrive par la droite, repart vers la droite
      duration={220}
      timingFunction="ease-out"
    >
      {(styles) => (
        <Box
          style={{
            position: 'fixed',
            top: 80, // sous la navbar
            right: 24,
            zIndex: 3000,
            pointerEvents: 'none',
            ...styles,
          }}
        >
          <Paper
            radius="xl"
            p="sm"
            shadow="xl"
            withBorder
            style={{
              pointerEvents: 'auto',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.97), rgba(10,19,35,0.97))',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              minWidth: 260,
              maxWidth: 420,
            }}
          >
            <Group gap="sm" wrap="nowrap" justify="space-between" align="center">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon
                  size={28}
                  radius="xl"
                  style={{
                    backgroundColor: iconBg,
                    color: iconColor,
                    boxShadow: `0 0 12px ${iconColor}33`,
                  }}
                >
                  {isSuccess ? <TbCheck size={18} /> : <TbAlertTriangle size={18} />}
                </ThemeIcon>

                <Text
                  fz="sm"
                  fw={500}
                  style={{
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: 0.2,
                  }}
                >
                  {internal.message}
                </Text>
              </Group>

              <CloseButton size="sm" variant="subtle" onClick={() => setVisible(false)} />
            </Group>
          </Paper>
        </Box>
      )}
    </Transition>
  )
}
