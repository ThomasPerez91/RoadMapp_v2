import env from '#start/env'

export type Metrics = {
  distance: number
  duration: number
  distanceToString: string
  durationToString: string
}

type DistanceMatrixResponse = {
  rows?: Array<{
    elements?: Array<{
      status?: string
      distance?: { value: number; text: string }
      duration?: { value: number; text: string }
    }>
  }>
}

export class GoogleMetricsService {
  static async forAddresses(origin: string, destination: string): Promise<Metrics> {
    const key = env.get('GOOGLE_METRICS_API_KEY')
    if (!key) throw new Error('GOOGLE_METRICS_API_KEY is not configured')

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('key', key)
    url.searchParams.set('origins', origin)
    url.searchParams.set('destinations', destination)
    url.searchParams.set('units', 'metric')
    url.searchParams.set('mode', 'driving')
    url.searchParams.set('language', 'fr')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Google Metrics error: ${res.status}`)
    const json = (await res.json()) as DistanceMatrixResponse

    const el = json.rows?.[0]?.elements?.[0]
    if (!el || el.status !== 'OK' || !el.distance || !el.duration) {
      throw new Error('Google Metrics response not OK')
    }

    return {
      distance: el.distance.value,
      duration: el.duration.value,
      distanceToString: el.distance.text,
      durationToString: el.duration.text,
    }
  }
}
