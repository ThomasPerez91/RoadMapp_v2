import { Head, router } from '@inertiajs/react'
import { Container, Grid, Group, Stack } from '@mantine/core'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import UserLayout from '~/layouts/user_layout'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'
import type { AddressBookAddress as Address } from '~/components/addresses/address_book'
import useTravelPlanner from '~/hooks/use_travel_planner'
import { TravelDateAndAddressBook } from '~/components/travels/travel_date_and_book'
import { TravelStepsColumn } from '~/components/travels/travel_steps_panel'
import { TravelInsertModal } from '~/components/travels/travel_insert_modal'
import { TravelAddressDrawer } from '~/components/travels/travel_address_drawer'
import { jsonFetch } from '~/services/http'
import { BackButton } from '~/components/generics/back_buttons'
import { ClickableBreadcrumbs } from '~/components/generics/clickable_breadcrumbs'

type Props = {
  travel: { id: number; date: string }
  picksIds: number[]
  addresses: Address[]
}

function Edit({ travel, picksIds, addresses }: Props) {
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)
  const [deleteOpened, setDeleteOpened] = useState(false)
  const [addressDrawerOpened, setAddressDrawerOpened] = useState(false)

  // Reconstitue les étapes à partir des IDs + adresses
  const initialPicks = useMemo(
    () =>
      picksIds.map((id) => ({
        id,
        name: addresses.find((a) => a.id === id)?.name ?? `Adresse #${id}`,
      })),
    [picksIds, addresses]
  )

  const planner = useTravelPlanner({
    addresses,
    initialDate: new Date(travel.date),
    initialPicks,
    onSave: async ({ date, legs: payloadLegs }) => {
      await jsonFetch(`/api/travels/${travel.id}`, {
        method: 'PUT',
        payload: {
          date: dayjs(date).format('YYYY-MM-DD'),
          legs: payloadLegs,
        },
        parseResponse: false,
      })
      router.visit('/travels')
    },
  })

  function askDelete(idx: number) {
    setDeleteIdx(idx)
    setDeleteOpened(true)
  }

  function confirmDelete() {
    if (deleteIdx === null) return
    planner.removePick(deleteIdx)
    setDeleteOpened(false)
    setDeleteIdx(null)
  }

  const handleAddFromDrawer = (addr: Address) => {
    planner.addPick(addr)
    setAddressDrawerOpened(false)
  }

  return (
    <>
      <Head title={`Modifier trajet #${travel.id}`} />
      <Container size="lg" py="lg">
        <Stack gap="md">
          <Group gap="xs" align="center">
            <BackButton href="/travels" />
            <ClickableBreadcrumbs
              items={[
                { label: 'Tableau de bord', href: '/dashboard' },
                { label: 'Trajets', href: '/travels' },
                { label: 'Modifier' },
              ]}
            />
          </Group>
          <Grid gutter="md">
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
              onRemove={askDelete}
              onInsertAfter={planner.openInsertAfter}
              onOpenAddressDrawer={() => setAddressDrawerOpened(true)}
            />
          </Grid>
        </Stack>
      </Container>

      {/* Modal d’insertion après une étape */}
      <TravelInsertModal
        opened={planner.insertForIndex !== null}
        selectData={planner.selectData}
        insertValue={planner.insertValue}
        onChangeValue={planner.setInsertValue}
        onClose={planner.closeInsertModal}
        onConfirm={planner.confirmInsertAfter}
      />

      {/* Drawer mobile pour choisir une adresse */}
      <TravelAddressDrawer
        opened={addressDrawerOpened}
        onClose={() => setAddressDrawerOpened(false)}
        addresses={planner.addresses}
        homeAddress={planner.homeAddress}
        onAddAddress={handleAddFromDrawer}
      />

      {/* Confirmation de suppression d’étape */}
      <ConfirmDeleteModal
        opened={deleteOpened}
        onCancel={() => setDeleteOpened(false)}
        onConfirm={confirmDelete}
        description="Supprimer cette étape du trajet ?"
      />
    </>
  )
}

Edit.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>
export default Edit
