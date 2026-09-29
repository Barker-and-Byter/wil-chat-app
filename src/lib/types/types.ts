export type Message = { id: string; username: string; text: string; system?: boolean };

export type User = { id: string; username: string; lastSeen: number; typing: boolean };

export type Room = { name: string; createdAt: number };
