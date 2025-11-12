import { jsonFetch } from './http'

export interface UpdateProfilePayload {
  name: string
  avatar_url: string
}

export function updateUserProfile(payload: UpdateProfilePayload) {
  return jsonFetch('/api/user/profile', {
    method: 'PUT',
    payload,
  })
}
