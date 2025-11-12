import type Travel from '#models/travel'

export interface TravelDto {
  id: number
  date: string
  distance: number
  distanceToString: string
}

export function travelToDto(travel: Travel): TravelDto {
  return {
    id: travel.id,
    date: travel.date.toISOString().split('T')[0],
    distance: travel.distance,
    distanceToString: travel.distanceToString,
  }
}
