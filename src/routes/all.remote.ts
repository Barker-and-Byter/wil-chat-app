import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import type { Message, User, Room } from '$lib/types/types';


// In Memory 
const users: User[] = []
const rooms: Room[] = [{ id: 'main', name: 'main', createdAt: new Date(), joinedIds: [] }]
const messages: Message[] = []


// chat
const chatSchema = type({ roomId: 'string', userId: 'string' });
const messageSchema = type({ roomId: 'string', userId: 'string', text: 'string' });
const deleteSchema = type({ roomId: 'string', messageId: 'string' });
const editSchema = type({ roomId: 'string', messageId: 'string', text: 'string' });

// rooms
const createRoomSchema = type({ name: 'string' });

// users
const userSchema = type({ userId: 'string', username: 'string' });
const typingSchema = type({ userId: 'string', typing: 'boolean' });

// resolver
const chatListeners = new Set<() => void>();


// Interval runner
setInterval(() => {
    for (const room of rooms) {
        disconnectUsers(room);
    }
}, 5000);

// helpers 

function getRoom(roomId: string) {
    const thisRoom = rooms.find(r => r.id === roomId)
    if (!thisRoom) error(404, 'room does not exist')
    return thisRoom
}

function getMessages(roomId: string) {
    return messages.filter(m => m.roomId === roomId)
}

function getUser(userId: string) {
    return users.find(u => u.id === userId)
}

function notify() {
    for (const resolve of chatListeners) {
        resolve();
    }

    chatListeners.clear();
}

function pushMessage(room: Room, user: User, text: string, system = false) {
    messages.push({
        messageId: crypto.randomUUID(),
        roomId: room.id,
        userId: user.id,
        username: user.username,
        text: text,
        system: system
    })
    notify()
}

function getTypingUsers(room: Room) {
    const cutoff = new Date(Date.now() - 7000)
    return users
        .filter(u => u.typing && u.lastSeen > cutoff && room.joinedIds.includes(u.id))
        .map(u => ({ id: u.id, username: u.username }))
}

function disconnectUsers(room: Room) {
    const cutoff = new Date(Date.now() - 10000)
    const disconnectedUsers = users.filter(u => u.lastSeen < cutoff && room.joinedIds.includes(u.id))

    for (const user of disconnectedUsers) {
        const userListIndex = users.findIndex(u => u.id === user.id)
        if (userListIndex !== -1) users.splice(userListIndex, 1)

        const userJoinedIndex = room.joinedIds.indexOf(user.id)
        if (userJoinedIndex !== -1) room.joinedIds.splice(userJoinedIndex, 1)

        pushMessage(room, user, `${user.username} left the chat`, true)
    }
}

// Chat

export const getChat = query.live(chatSchema, async function* ({ roomId, userId }) {

    const thisRoom = getRoom(roomId)

    const thisUser = users.find(user => user.id === userId)

    if (!thisUser) error(404, 'must join before you can message')

    const alreadyJoined = thisRoom?.joinedIds.includes(userId)

    if (!alreadyJoined) {
        thisRoom.joinedIds.push(userId)
        pushMessage(thisRoom, thisUser, `${thisUser.username} joined the chat`, true)
    }


    // try {
        while (true) {
            thisUser.lastSeen = new Date()

            yield {...thisRoom, messages: getMessages(roomId), typing: getTypingUsers(thisRoom) }

            const { promise, resolve } = Promise.withResolvers<void>()

            chatListeners.add(resolve)

            await Promise.race([ promise, new Promise<void>((resolve) => setTimeout(resolve, 5000) ) ]);

            chatListeners.delete(resolve);
        }
});

export const addMessage = command(messageSchema, async ({ roomId, userId, text }) => {
    const thisRoom = getRoom(roomId)
    const thisUser = getUser(userId)

    if (!thisUser) error(400, 'You need to join before sending messages');

    pushMessage(thisRoom, thisUser, text)

    if (messages.length > 200) messages.shift()
})

// Need to add some validation
export const deleteMessage = command(deleteSchema, async ({ roomId, messageId }) => {
    const messageIndex = messages.findIndex(m => m.messageId === messageId && m.roomId === roomId)
 
    if (messageIndex === -1) error(404, 'message does not exist')
 
    messages.splice(messageIndex, 1)
    notify()
});

// need to add some validation, non users can't change id
export const editMessage = command(editSchema, async ({ roomId, messageId, text }) => {
     const message = messages.find(m => m.messageId === messageId && m.roomId === roomId)
 
    if (!message) error(404, 'message does not exist')
 
    message.text = text
    notify()
});


// ROOMS


// Should be a query.live
export const getRooms = query(async () => {
    return { rooms }
});

export const createRoom = command(createRoomSchema, async ({ name }) => {
    const taken = rooms.some((r: Room) => r.name === name)
 
    if (taken) error(409, 'Room already exists')
 
    rooms.push({ id: crypto.randomUUID(), name: name, createdAt: new Date(), joinedIds: [] })
});


// USERS

export const addUser = command(userSchema, async ({ userId, username }) => {
     const taken = users.some((u: User) => u.username === username && u.id !== userId)
 
    if (taken) error(409, 'Username taken')
 
    const existingUser = users.find(u => u.id === userId)
 
    if (existingUser) {
        existingUser.username = username
        existingUser.lastSeen = new Date()
    } else {
        users.push({ id: userId, username: username, lastSeen: new Date(), typing: false })
    }
});

export const setTyping = command(typingSchema, async ({ userId, typing }) => {
     const thisUser = users.find(u => u.id === userId)
 
    if (!thisUser) error(404, 'user does not exist')
 
    thisUser.typing = typing
    notify()
});
