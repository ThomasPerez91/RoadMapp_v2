import type Travel from '#models/travel'

export interface TravelDto {
  id: number
  date: string
  distance: number
  distanceToString: string
  stepsCount: number
}

export function travelToDto(travel: Travel): TravelDto {
  return {
    id: travel.id,
    date: travel.date.toISOString().split('T')[0],
    distance: travel.distance,
    distanceToString: travel.distanceToString,
    stepsCount: travel.$extras.step_count ?? 0,
  }
}
