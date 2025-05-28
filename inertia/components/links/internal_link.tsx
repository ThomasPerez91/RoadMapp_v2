import { Link } from '@inertiajs/react'
import { Anchor } from '@mantine/core'
import { CSSProperties } from 'react'

interface InternalLinkProps {
  children: React.ReactNode
  route: string
  onClick?: (event: React.MouseEvent<any>) => void
  style?: CSSProperties
  className?: string
}

export const InternalLink = ({ children, route, style, onClick, className }: InternalLinkProps) => (
  <Anchor
    component={Link}
    href={route}
    style={style}
    // prefetch
    onClick={onClick}
    className={className}
  >
    {children}
  </Anchor>
)
