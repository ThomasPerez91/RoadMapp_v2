import { Box, Image, rem } from '@mantine/core'
import classes from './logo.module.css'

interface LogoProps {
  size?: number
}

export const Logo = ({ size }: LogoProps) => (
  <Box className={classes['logo-bg']} style={size ? { width: rem(size), height: rem(size) } : {}}>
    <Image src="/logo.svg" alt="Logo" className={classes.logo} />
  </Box>
)
