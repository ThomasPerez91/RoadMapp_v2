import type Leg from '#models/leg'

export interface LegDto {
  id: number
  startId: number
  endId: number
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

export function legToDto(leg: Leg): LegDto {
  return {
    id: leg.id,
    startId: leg.startId,
    endId: leg.endId,
    distance: leg.distance,
    duration: leg.duration,
    distanceToString: leg.distanceToString,
    durationToString: leg.durationToString,
  }
}
