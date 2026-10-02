// In future, maybe add message id and user id

export type User = { id: string, username: string, lastSeen: Date, typing: boolean };

export type Message = { messageId: string, userId: string, username: string, text: string, system?: boolean}

