import { Group, Button, Text } from '@mantine/core'
import { FcGoogle } from 'react-icons/fc'
import { SiGithub } from 'react-icons/si'
import { ExternalLinkUnstyled } from '../links/external_link'

interface OAuthProps {
  mode: 'login' | 'register'
}

export const OAuth = ({ mode }: OAuthProps) => {
  const googleIcon = <FcGoogle size={18} />
  const githubIcon = <SiGithub size={18} />
  return (
    <>
      <Group>
        <Button
          justify="center"
          fullWidth
          leftSection={googleIcon}
          component={ExternalLinkUnstyled}
          href="/api/google/redirect"
          newTab={false}
          variant="gradient"
          gradient={{ from: 'cyan', to: 'teal', deg: 90 }}
        >
          <Text>{mode === 'login' ? 'Se connecter' : "S'inscrire"} avec Google</Text>
        </Button>
        <Button
          justify="center"
          fullWidth
          leftSection={githubIcon}
          component={ExternalLinkUnstyled}
          href="/api/github/redirect"
          newTab={false}
          variant="gradient"
          gradient={{ from: 'teal', to: 'cyan', deg: 90 }}
        >
          <Text>{mode === 'login' ? 'Se connecter' : "S'inscrire"} avec Github</Text>
        </Button>
      </Group>
    </>
  )
}
