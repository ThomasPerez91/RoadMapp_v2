import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AiOutlineUserAdd } from 'react-icons/ai';
import { RiLoginBoxLine } from 'react-icons/ri';
import { useAppDrawer } from '../drawer';
import { OAuth } from '../auth/oauth';

export const Hero = () => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false);
  const { open } = useAppDrawer();

  const registerIcon = <AiOutlineUserAdd size={20} />;
  const loginIcon = <RiLoginBoxLine size={18} />;

  return (
    <Box
      component="section"
      aria-label="Présentation RoadMapp"
      style={{
        paddingTop: isMobile ? rem(72) : rem(64 + 24), // navbar + marge
        paddingBottom: isMobile ? rem(32) : rem(48),
      }}
    >
      <Container size="lg">
        <Paper
          shadow="md"
          radius="xl"
          p="xl"
          style={{
            backdropFilter: 'blur(8px)',
            background: 'rgba(7, 14, 24, 0.65)',
            border: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <Stack
            gap="md"
            style={{
              maxWidth: 980,
              marginInline: 'auto',
              textAlign: 'left',
            }}
          >
            <Title
              style={{
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.015em',
                fontSize: 'clamp(28px, 4.2vw, 48px)',
              }}
            >
              Suivez vos trajets et déplacements avec{' '}
              <Text
                component="span"
                inherit
                variant="gradient"
                gradient={{
                  from: theme.colors.ocean?.[5] ?? 'teal',
                  to: theme.colors.plum?.[4] ?? 'cyan',
                  deg: 60,
                }}
              >
                RoadMapp
              </Text>
            </Title>

            <Text
              style={{
                opacity: 0.9,
                maxWidth: 760,
                fontSize: 'clamp(16px, 2.2vw, 18px)',
              }}
            >
              Enregistrez vos adresses, calculez les distances parcourues et gardez une trace
              précise de vos trajets. Simplifiez la déclaration de vos frais kilométriques avec
              RoadMapp.
            </Text>

            <Stack gap={6} style={{ marginTop: rem(8), opacity: 0.95 }}>
              <Text>• Création de trajets, étapes multiples, carnet d’adresses</Text>
              <Text>• Distances par BDD ou API Google Metrics</Text>
              <Text>• Visualisation claire des kilomètres parcourus</Text>
            </Stack>

            <Group gap="md" wrap="wrap" style={{ marginTop: rem(20) }}>
              <Button
                size="lg"
                radius="xl"
                rightSection={registerIcon}
                variant="gradient"
                gradient={{ from: 'teal', to: 'cyan', deg: 90 }}
                onClick={() =>
                  open({
                    title: 'Inscription',
                    content: <OAuth mode="register" />,
                  })
                }
              >
                <b>Inscription</b>
              </Button>

              <Button
                size="lg"
                radius="xl"
                variant="light"
                rightSection={loginIcon}
                onClick={() =>
                  open({
                    title: 'Connexion',
                    content: <OAuth mode="login" />,
                  })
                }
              >
                Se connecter
              </Button>
            </Group>

            <Box
              role="note"
              aria-label="Accroche RoadMapp"
              style={{ marginTop: rem(8), fontSize: rem(14), opacity: 0.75 }}
            >
              <Text>
                Gratuit pour les particuliers • Outils pros et gestion de flotte à venir
              </Text>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
