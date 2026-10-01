// In future, maybe add message id and user id

export type User = { id: string, username: string, lastSeen: Date, typing: boolean };

export type Room = { id: string, name: string, createdAt: Date, joinedIds: string[] };

export type Message = { messageId: string, userId: string, roomId: string, username: string, text: string, system?: boolean}
