// inertia/components/travels/travel_steps_panel.tsx
import {
  ActionIcon,
  Box,
  Button,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Transition,
  Tooltip,
} from '@mantine/core'
import { Fragment } from 'react'
import { TbArrowDown, TbArrowUp, TbPlus, TbTrash } from 'react-icons/tb'
import { LuMapPinHouse, LuMapPin, LuMapPinCheck, LuMapPinX } from 'react-icons/lu'
import type { AddressBookAddress as Address } from '~/components/addresses/address_book'
import type { Metrics, Pick } from '~/hooks/use_travel_planner'
import { formatKm, segKey as defaultSegKey } from '~/hooks/use_travel_planner'

export interface TravelStepsColumnProps {
  picks: Pick[]
  addressesById: Map<number, Address>
  metricsMap: Record<string, Metrics>
  resolving: Record<string, boolean>
  invalidIndices: Set<number>
  totalDistance: number
  canSave: boolean
  hasInvalidSegments: boolean
  onSave: () => void
  onMoveUp: (idx: number) => void
  onMoveDown: (idx: number) => void
  onRemove: (idx: number) => void
  onInsertAfter: (idx: number) => void
  onOpenAddressDrawer: () => void
}

export function TravelStepsColumn({
  picks,
  addressesById,
  metricsMap,
  resolving,
  invalidIndices,
  totalDistance,
  canSave,
  hasInvalidSegments,
  onSave,
  onMoveUp,
  onMoveDown,
  onRemove,
  onInsertAfter,
  onOpenAddressDrawer,
}: TravelStepsColumnProps) {
  return (
    <Grid.Col span={{ base: 12, md: 8 }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Title order={3}>Étapes du trajet</Title>
            {/* Petit texte d’aide uniquement visible sur mobile */}
            <Text size="xs" c="dimmed" hiddenFrom="md">
              Ajoutez vos adresses une par une, puis réordonnez ou insérez des étapes intermédiaires.
            </Text>
          </Box>

          <Box ta="right" style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              Distance totale estimée
            </Text>
            <Text fw={600} size="sm">
              {totalDistance > 0 ? formatKm(totalDistance) : 'En attente des étapes'}
            </Text>
          </Box>

          <Button
            radius="xl"
            variant="gradient"
            gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
            disabled={!canSave}
            onClick={onSave}
            visibleFrom="sm"
          >
            Enregistrer le trajet
          </Button>
        </Group>

        <Paper withBorder radius="lg" p="md">
          <Stack gap="sm">
            {picks.length === 0 && (
              <>
                <Text size="sm" c="dimmed">
                  Aucune étape pour le moment.
                </Text>
                <Text size="xs" c="dimmed" hiddenFrom="md">
                  Touchez le bouton ci-dessous pour choisir votre première adresse.
                </Text>

                {/* Bouton mobile pour ouvrir le drawer d’adresses */}
                <Button
                  radius="xl"
                  variant="light"
                  leftSection={<TbPlus />}
                  fullWidth
                  hiddenFrom="md"
                  onClick={onOpenAddressDrawer}
                >
                  Ajouter une adresse
                </Button>
              </>
            )}

            {picks.map((p, idx) => {
              const isFirst = idx === 0
              const isLast = idx === picks.length - 1
              const isInvalidTo = invalidIndices.has(idx)

              const icon = isInvalidTo ? (
                <LuMapPinX size={20} />
              ) : isFirst ? (
                <LuMapPinHouse size={20} />
              ) : isLast ? (
                <LuMapPinCheck size={20} />
              ) : (
                <LuMapPin size={18} />
              )

              const address = addressesById.get(p.id)

              const hasNext = !isLast && picks[idx + 1]
              const nextPick = hasNext ? picks[idx + 1] : null
              const segmentKey = hasNext && nextPick ? defaultSegKey(p.id, nextPick.id) : null
              const metrics = segmentKey ? metricsMap[segmentKey] : undefined
              const isLoading = segmentKey ? resolving[segmentKey] && !metrics : false

              return (
                <Fragment key={`${p.id}-${idx}`}>
                  <Transition
                    mounted
                    transition="slide-up"
                    duration={180}
                    timingFunction="ease-out"
                  >
                    {(styles) => (
                      <div style={styles}>
                        <Paper
                          withBorder
                          radius="md"
                          p="xs"
                          style={{
                            background: 'rgba(15,23,42,.9)',
                            borderColor: isInvalidTo
                              ? 'var(--mantine-color-red-6)'
                              : 'rgba(56,189,248,.6)',
                          }}
                        >
                          <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                            {/* Col 1 : icône */}
                            <Box
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background:
                                  'linear-gradient(135deg, rgba(56,189,248,.28), rgba(129,140,248,.32))',
                                border: isInvalidTo
                                  ? '1px solid var(--mantine-color-red-6)'
                                  : '1px solid rgba(129,140,248,.8)',
                              }}
                            >
                              {icon}
                            </Box>

                            {/* Col 2 : contenu texte */}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                fw={600}
                                size="sm"
                                style={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {p.name}
                              </Text>
                              {address && (
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {address.address}, {address.postalCode} {address.city}
                                </Text>
                              )}
                            </Box>

                            {/* Col 3 : monter / descendre / insérer */}
                            <Group gap="xs" wrap="nowrap" visibleFrom="sm">
                              <Tooltip label="Monter" color="dark">
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Monter"
                                  disabled={idx === 0}
                                  onClick={() => onMoveUp(idx)}
                                >
                                  <TbArrowUp />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Descendre" color="dark">
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Descendre"
                                  disabled={idx === picks.length - 1}
                                  onClick={() => onMoveDown(idx)}
                                >
                                  <TbArrowDown />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Insérer une adresse après" color="dark">
                                <ActionIcon
                                  variant="subtle"
                                  aria-label="Insérer après"
                                  onClick={() => onInsertAfter(idx)}
                                >
                                  <TbPlus />
                                </ActionIcon>
                              </Tooltip>
                            </Group>

                            {/* Sur mobile : actions compactes (moins de boutons visibles) */}
                            <Group gap={4} wrap="nowrap" hiddenFrom="sm">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                aria-label="Insérer après"
                                onClick={() => onInsertAfter(idx)}
                              >
                                <TbPlus size={16} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                aria-label="Supprimer"
                                onClick={() => onRemove(idx)}
                              >
                                <TbTrash size={16} />
                              </ActionIcon>
                            </Group>

                            {/* Col 4 : suppression (desktop) */}
                            <Tooltip label="Supprimer l’étape" color="dark" visibleFrom="sm">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                aria-label="Supprimer l’étape"
                                onClick={() => onRemove(idx)}
                                visibleFrom="sm"
                              >
                                <TbTrash />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Paper>
                      </div>
                    )}
                  </Transition>

                  {/* Connecteur entre cette étape et la suivante */}
                  {hasNext && (
                    <Box
                      pl={40}
                      ml={8}
                      style={{
                        borderLeft: '1px dashed rgba(56,189,248,.6)',
                      }}
                    >
                      <Box
                        style={{
                          marginLeft: 8,
                          marginTop: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Group gap="xs" align="center">
                          {isLoading && <Loader size="xs" />}
                          {!isLoading && metrics && (
                            <>
                              <Box
                                className="roadmapp-metric-dot"
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: 'var(--mantine-color-ocean-4)',
                                  boxShadow: `0 0 4px rgba(56,189,248,0.6),
                                    0 0 8px rgba(56,189,248,0.3),
                                    inset 0 0 4px rgba(255,255,255,0.15)
                                    `,
                                  flexShrink: 0,
                                }}
                              />
                              <Text size="xs" fw={500} style={{ color: '#e5e7eb' }}>
                                {metrics.distanceToString}
                              </Text>

                              <Text size="xs" c="dimmed">
                                • {metrics.durationToString}
                              </Text>
                            </>
                          )}
                          {!isLoading && !metrics && (
                            <Text size="xs" c="dimmed">
                              Calcul en cours…
                            </Text>
                          )}
                        </Group>
                      </Box>
                    </Box>
                  )}
                </Fragment>
              )
            })}
          </Stack>

          {hasInvalidSegments && (
            <Paper
              withBorder
              radius="lg"
              p="sm"
              mt="xs"
              style={{
                background: 'rgba(15,23,42,.9)',
                borderColor: 'var(--mantine-color-red-6)',
              }}
            >
              <Text size="sm" c="red">
                Deux étapes consécutives pointent vers la même adresse. Corrigez l&apos;ordre ou
                supprimez une étape pour pouvoir enregistrer le trajet.
              </Text>
            </Paper>
          )}

          {/* Bouton mobile pour ajouter une nouvelle étape à la fin */}
          {picks.length > 0 && (
            <Group justify="center" mt="md" hiddenFrom="md">
              <Button variant="light" leftSection={<TbPlus />} onClick={onOpenAddressDrawer}>
                Ajouter une adresse
              </Button>
            </Group>
          )}

          {/* Bouton d’enregistrement visible en bas sur mobile */}
          <Group justify="flex-end" mt="md" hiddenFrom="sm">
            <Button
              radius="xl"
              variant="gradient"
              gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
              disabled={!canSave}
              onClick={onSave}
            >
              Enregistrer
            </Button>
          </Group>

          {/* Bouton d’enregistrement principal (desktop) */}
          <Group justify="flex-end" mt="md" visibleFrom="sm">
            <Button
              radius="xl"
              variant="gradient"
              gradient={{ from: 'ocean', to: 'plum', deg: 60 }}
              disabled={!canSave}
              onClick={onSave}
            >
              Enregistrer le trajet
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Grid.Col>
  )
}
