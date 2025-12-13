// inertia/components/home/hero.tsx
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
  SimpleGrid,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { AiOutlineCheckCircle, AiOutlineCar, AiOutlineBarChart } from 'react-icons/ai'
import { ReactNode } from 'react'
import { useAppDrawer } from '../drawer'
import { OAuth } from '../auth/oauth'

export const Hero = () => {
  return (
    <>
      <HeroHeader />
      <HomePresentationSection />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   HEADER                                   */
/* -------------------------------------------------------------------------- */

const HeroHeader = () => {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)
  const { open } = useAppDrawer()

  const handleLearnMore = () => {
    const section = document.getElementById('home-presentation-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const openLogin = () =>
    open({
      title: 'Connexion',
      content: <OAuth mode="login" />,
    })

  return (
    <Box
      component="section"
      aria-label="Présentation RoadMapp"
      style={{
        paddingTop: isMobile ? rem(72) : rem(96),
        paddingBottom: isMobile ? rem(32) : rem(48),
      }}
    >
      <Container size="lg">
        <Paper
          shadow="md"
          radius="xl"
          p={isMobile ? 'lg' : 'xl'}
          style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(7, 14, 24, 0.8)',
            border: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <Stack
            gap={isMobile ? 'md' : 'lg'}
            style={{
              maxWidth: 980,
              marginInline: 'auto',
              textAlign: 'left',
            }}
          >
            <Text
              size="sm"
              fw={600}
              style={{
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: '#9ca3af',
              }}
            >
              Suivi de déplacements simplifié
            </Text>

            <Title
              style={{
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
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
              Enregistrez vos trajets, centralisez vos adresses et suivez vos kilomètres en un clin
              d’œil. Gagnez du temps sur vos notes de frais et gardez une vision claire de vos
              déplacements professionnels.
            </Text>

            <Stack gap="sm" style={{ marginTop: rem(8), opacity: 0.95 }}>
              <Text>• Création rapide de trajets avec plusieurs étapes</Text>
              <Text>• Distances calculées automatiquement via votre base ou Google Metrics</Text>
              <Text>• Export PDF propre pour vos comptables, clients ou déclarations</Text>
            </Stack>

            <Group
              gap="md"
              wrap="wrap"
              style={{
                marginTop: rem(20),
                justifyContent: isMobile ? 'flex-start' : 'flex-start',
              }}
            >
              {/* CTA principal : drawer OAuth */}
              <Button
                size={isMobile ? 'md' : 'lg'}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
                fw={600}
                onClick={openLogin}
              >
                Commencer gratuitement
              </Button>

              {/* CTA secondaire : scroll vers la section de présentation */}
              <Button
                size={isMobile ? 'md' : 'lg'}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'plum', to: 'ocean', deg: 60 }}
                fw={500}
                onClick={handleLearnMore}
              >
                En savoir plus
              </Button>
            </Group>

            <Box
              role="note"
              aria-label="Accroche RoadMapp"
              style={{
                marginTop: rem(8),
                fontSize: rem(14),
                opacity: 0.75,
              }}
            >
              <Text>
                Gratuit pour les indépendants • Idéal pour consultants, commerciaux, artisans et
                petites équipes.
              </Text>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}

/* -------------------------------------------------------------------------- */
/*                          SECTION PRÉSENTATION / FEATURES                   */
/* -------------------------------------------------------------------------- */

const HomePresentationSection = () => {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`, false)

  return (
    <Box
      id="home-presentation-section"
      component="section"
      style={{
        paddingTop: rem(32),
        paddingBottom: rem(56),
      }}
    >
      <Container size="lg">
        <Stack gap={isMobile ? 'lg' : 'xl'}>
          {/* Intro */}
          <Stack gap="xs" align="flex-start">
            <Text
              size="sm"
              fw={600}
              style={{ letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af' }}
            >
              Pourquoi RoadMapp ?
            </Text>
            <Title
              order={2}
              style={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Une vue claire sur tous vos déplacements
            </Title>
            <Text
              size="sm"
              style={{
                maxWidth: 640,
                color: 'var(--mantine-color-dimmed)',
              }}
            >
              RoadMapp centralise vos trajets, vos clients et vos véhicules pour vous faire gagner
              du temps au quotidien. Visualisez vos déplacements, anticipez vos frais et récupérez
              vos données en un clic.
            </Text>
          </Stack>

          {/* Cartes de fonctionnalités */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <FeatureCard
              icon={<AiOutlineCar size={20} color={theme.colors.ocean[5]} />}
              iconBg="rgba(56,189,248,0.12)"
              title="Trajets & tournées optimisés"
              description="Centralisez vos déplacements, segmentez par clients, chantiers ou missions et retrouvez en un instant votre historique."
            />

            <FeatureCard
              icon={<AiOutlineBarChart size={20} color={theme.colors.plum[4]} />}
              iconBg="rgba(129,140,248,0.12)"
              title="Suivi des kilomètres & coûts"
              description="Visualisez vos kilomètres parcourus, vos coûts estimés et vos tendances mensuelles pour mieux piloter votre activité."
            />

            <FeatureCard
              icon={<AiOutlineCheckCircle size={20} color={theme.colors.teal[4]} />}
              iconBg="rgba(52,211,153,0.12)"
              title="Prêt pour vos obligations"
              description="Générez des exports propres pour vos notes de frais, déclarations fiscales ou rapports clients, en quelques secondes."
            />
          </SimpleGrid>

          {/* Bloc “Pour qui ?” */}
          <Stack gap="xs" style={{ marginTop: rem(12), maxWidth: 640 }}>
            <Text fw={600}>Pour qui ?</Text>
            <Text size="sm" c="dimmed">
              RoadMapp est pensé pour les indépendants, TPE et équipes mobiles : consultants,
              commerciaux, techniciens, artisans, chauffeurs ou toute personne qui passe une bonne
              partie de sa journée sur la route et doit justifier ses déplacements.
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

/* -------------------------------------------------------------------------- */
/*                               FEATURE CARD                                 */
/* -------------------------------------------------------------------------- */

interface FeatureCardProps {
  icon: ReactNode
  iconBg: string
  title: string
  description: string
}

const FeatureCard = ({ icon, iconBg, title, description }: FeatureCardProps) => {
  return (
    <Paper
      radius="lg"
      p="md"
      withBorder
      style={{
        backgroundColor: 'rgba(15,23,42,0.85)',
        borderColor: 'rgba(148,163,184,0.3)',
        height: '100%',
      }}
    >
      <Stack gap="xs">
        {/* Header: icône + titre alignés */}
        <Group align="center" gap="sm">
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: iconBg,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Text fw={600}>{title}</Text>
        </Group>

        {/* Description */}
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>
    </Paper>
  )
}
