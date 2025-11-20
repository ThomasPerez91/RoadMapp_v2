// inertia/pages/travels/create.tsx
import { Head, router } from '@inertiajs/react'
import { Breadcrumbs, Container, Grid, Group, Stack, Text } from '@mantine/core'
import dayjs from 'dayjs'
import UserLayout from '~/layouts/user_layout'
import type { AddressBookAddress as Address } from '~/components/addresses/address_book'
import { jsonFetch } from '~/services/http'
import useTravelPlanner from '~/hooks/use_travel_planner'
import { TravelDateAndAddressBook } from '~/components/travels/travel_date_and_book'
import { TravelStepsColumn } from '~/components/travels/travel_steps_panel'
import { TravelInsertModal } from '~/components/travels/travel_insert_modal'
import { TravelAddressDrawer } from '~/components/travels/travel_address_drawer'
import { useState } from 'react'
import { BackButton } from '~/components/generics/back_buttons'

type Props = { addresses: Address[] }

function Create({ addresses }: Props) {
  const [addressDrawerOpened, setAddressDrawerOpened] = useState(false)

  const planner = useTravelPlanner({
    addresses,
    onSave: async ({ date, legs }) => {
      await jsonFetch('/api/travels', {
        method: 'POST',
        payload: {
          date: dayjs(date).format('YYYY-MM-DD'),
          legs,
        },
        parseResponse: false,
      })

      router.visit('/travels')
    },
  })

  const handleAddFromDrawer = (addr: Address) => {
    planner.addPick(addr)
    setAddressDrawerOpened(false)
  }

  return (
    <>
      <Head title="Créer un trajet" />
      <Container py="lg">
        <Stack gap="md">
          <Group gap="xs" align="center">
            <BackButton href="/travels" />
            <Breadcrumbs>
              <Text size="sm" c="dimmed">
                Tableau de bord
              </Text>
              <Text size="sm" c="dimmed">
                Trajets
              </Text>
              <Text size="sm">Créer</Text>
            </Breadcrumbs>
          </Group>
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TravelDateAndAddressBook
              date={planner.date}
              onDateChange={planner.setDate}
              addresses={planner.addresses}
              homeAddress={planner.homeAddress}
              onAddAddress={planner.addPick}
            />
          </Grid.Col>

          <TravelStepsColumn
            picks={planner.picks}
            addressesById={planner.allAddressesById}
            metricsMap={planner.metricsMap}
            resolving={planner.resolving}
            invalidIndices={planner.invalidIndices}
            totalDistance={planner.totalDistance}
            canSave={planner.canSave}
            hasInvalidSegments={planner.hasInvalidSegments}
            onSave={planner.save}
            onMoveUp={planner.movePickUp}
            onMoveDown={planner.movePickDown}
            onRemove={planner.removePick}
            onInsertAfter={planner.openInsertAfter}
            onOpenAddressDrawer={() => setAddressDrawerOpened(true)}
          />
        </Grid>
        </Stack>
      </Container>

      <TravelInsertModal
        opened={planner.insertForIndex !== null}
        selectData={planner.selectData}
        insertValue={planner.insertValue}
        onChangeValue={planner.setInsertValue}
        onClose={planner.closeInsertModal}
        onConfirm={planner.confirmInsertAfter}
      />

      <TravelAddressDrawer
        opened={addressDrawerOpened}
        onClose={() => setAddressDrawerOpened(false)}
        addresses={planner.addresses}
        homeAddress={planner.homeAddress}
        onAddAddress={handleAddFromDrawer}
      />
    </>
  )
}

Create.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Create
