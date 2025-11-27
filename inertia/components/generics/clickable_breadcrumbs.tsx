import { Link } from '@inertiajs/react'
import { Breadcrumbs, Anchor } from '@mantine/core'

export interface Crumb {
  label: string
  href?: string
}

interface Props {
  items: Crumb[]
}

export function ClickableBreadcrumbs({ items }: Props) {
  return (
    <Breadcrumbs>
      {items.map((item, i) =>
        item.href ? (
          <Anchor key={i} component={Link} href={item.href} size="sm">
            {item.label}
          </Anchor>
        ) : (
          <Anchor key={i} component={Link} href="" size="sm">
            {item.label}
          </Anchor>
        )
      )}
    </Breadcrumbs>
  )
}
