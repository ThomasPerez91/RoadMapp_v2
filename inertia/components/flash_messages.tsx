import { FlashType } from '~/types/inertia'
import { PageProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/react'
import { Notification } from '@mantine/core'
import { useEffect, useState } from 'react'
import { TbAlertCircle, TbCheck, TbInfoCircle } from 'react-icons/tb'

type FlashPageProps = PageProps & {
  flash: {
    type: 'info' | 'success' | 'error' | 'warning'
    message: string
  } | null
}

interface FlashMessagesProps {
  flash?: { type: FlashType; message: string } | null
}

export function FlashMessages({ flash }: FlashMessagesProps = {}) {
  const { props } = usePage<FlashPageProps>()
  const current = flash ?? props.flash
  const [opened, setOpened] = useState<boolean>(!!current)

  useEffect(() => {
    setOpened(!!current)
  }, [current])

  return (
    opened && (
      <Notification
        icon={getNotificationIcon(current?.type)}
        color={getNotificationColor(current?.type)}
        title={current?.message}
        onClose={() => setOpened(false)}
      />
    )
  )
}

const getNotificationColor = (type: FlashType | undefined) => {
  switch (type) {
    case 'info':
      return 'blue'
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'warning':
      return 'yellow'
    default:
      return 'gray'
  }
}

const getNotificationIcon = (type: FlashType | undefined) => {
  switch (type) {
    case 'info':
      return <TbInfoCircle />
    case 'success':
      return <TbCheck />
    case 'error':
      return <TbAlertCircle />
    case 'warning':
      return <TbAlertCircle />
    default:
      return <TbInfoCircle />
  }
}
