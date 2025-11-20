import { Link } from '@inertiajs/react'
import { Button, type ButtonProps } from '@mantine/core'
import { TbArrowLeft } from 'react-icons/tb'

type BackButtonProps = Omit<ButtonProps, 'component' | 'leftSection'> & {
  href: string
  label?: string
}

export function BackButton({ href, label = 'Retour', ...props }: BackButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      variant="subtle"
      radius="xl"
      size="xs"
      leftSection={<TbArrowLeft size={16} />}
      {...props}
    >
      {label}
    </Button>
  )
}
