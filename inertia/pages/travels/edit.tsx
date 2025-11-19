import { Head, router } from '@inertiajs/react'
import { Container, Grid } from '@mantine/core'
import dayjs from 'dayjs'
import { useState } from 'react'
import UserLayout from '~/layouts/user_layout'
import { ConfirmDeleteModal } from '~/components/generics/confirm_delete_modal'
import type { AddressBookAddress as Address } from '~/components/addresses/address_book'
import useTravelPlanner, { type InitialLeg } from '~/hooks/use_travel_planner'
import { TravelDateAndAddressBook } from '~/components/travels/travel_date_and_book'
import { TravelStepsColumn } from '~/components/travels/travel_steps_panel'
import { TravelInsertModal } from '~/components/travels/travel_insert_modal'
import { TravelAddressDrawer } from '~/components/travels/travel_address_drawer'

type Leg = {
  id: number
  startId: number
  endId: number
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

type Props = {
  travel: { id: number; date: string }
  legs: Leg[]
  addresses: Address[]
}

function Edit({ travel, legs, addresses }: Props) {
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)
  const [deleteOpened, setDeleteOpened] = useState(false)
  const [addressDrawerOpened, setAddressDrawerOpened] = useState(false)

  const initialLegs: InitialLeg[] = legs.map((l) => ({
    startId: l.startId,
    endId: l.endId,
    distance: l.distance,
    duration: l.duration,
    distanceToString: l.distanceToString,
    durationToString: l.durationToString,
  }))

  const planner = useTravelPlanner({
    addresses,
    initialDate: new Date(travel.date),
    initialLegs,
    onSave: async ({ date, legs: payloadLegs }) => {
      await router.put(`/api/travels/${travel.id}`, {
        date: dayjs(date).format('YYYY-MM-DD'),
        legs: payloadLegs,
      })
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
