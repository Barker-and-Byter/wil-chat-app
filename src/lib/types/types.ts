export type MessageType = { id: string, username: string, text: string, system?: boolean }

export type UserType = { id: string, username: string, lastSeen: number, typing: boolean }

export type RoomType = { name: string; createdAt: number }

