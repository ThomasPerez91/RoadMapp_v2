import User from '#models/user'

export interface UserDto {
  id: number
  name: string
  email: string
  nickname: string
  avatarUrl: string
}

export function userToDto(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatar_url,
  }
}
