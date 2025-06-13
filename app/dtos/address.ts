export interface AddressDto {
  id: number
  name: string
  address: string
  postalCode: string
  city: string
  isHome: boolean
}

import type Address from '#models/address'

export function addressToDto(address: Address): AddressDto {
  return {
    id: address.id,
    name: address.name,
    address: address.address,
    postalCode: address.postalCode,
    city: address.city,
    isHome: address.isHome,
  }
}
