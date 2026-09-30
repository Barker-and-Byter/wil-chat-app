
// In future, maybe add message id and user id
export type Message = { messageId: string; userId: string; username: string; text: string; system?: boolean };

export type User = { id: string; username: string; lastSeen: number; typing: boolean };

export type Room = { name: string; createdAt: number };
