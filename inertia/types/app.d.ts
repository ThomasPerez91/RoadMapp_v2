export interface User {
  id: number
  name: string
  avatarUrl: string
  email: string
  nickname: string
}

export interface Address {
  id: number
  name: string
  address: string
  postalCode: string
  city: string
  isHome: boolean
  isActive: boolean
  checked: boolean
}

export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}
