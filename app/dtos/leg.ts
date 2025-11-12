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
    startId: leg.start_id,
    endId: leg.end_id,
    distance: leg.distance,
    duration: leg.duration,
    distanceToString: leg.distance_to_string,
    durationToString: leg.duration_to_string,
  }
}
