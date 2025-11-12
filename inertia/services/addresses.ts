import type { Address } from '~/types/app'
import { jsonFetch } from './http'

export interface AddressPayload {
  name: string
  address: string
  postal_code: string
  city: string
  [key: string]: unknown
}

export function saveAddress(id: number | null, payload: AddressPayload) {
  const url = id ? `/api/addresses/${id}` : '/api/addresses'
  return jsonFetch(url, {
    method: id ? 'PUT' : 'POST',
    payload,
  })
}

export function toggleAddressActive(address: Address) {
  return jsonFetch(`/api/addresses/${address.id}`, {
    method: 'PUT',
    payload: {
      name: address.name,
      address: address.address,
      postal_code: address.postalCode,
      city: address.city,
      is_active: !address.isActive,
    },
  })
}

export function deleteAddress(id: number) {
  return jsonFetch(`/api/addresses/${id}`, {
    method: 'DELETE',
    parseResponse: false,
  })
}

export function searchAddresses(query: string, isActive: boolean) {
  const params = new URLSearchParams({
    q: query,
    active: isActive ? 'true' : 'false',
  })

  return jsonFetch<Address[]>(`/api/addresses/search?${params.toString()}`, {
    includeCsrf: false,
  })
}
