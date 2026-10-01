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
// let currentResolver = Promise.withResolvers<void>()
const chatListeners: (() => void)[] = [];

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
    // currentResolver.resolve()
    // currentResolver = Promise.withResolvers<void>()

    chatListeners.forEach(resolve => resolve());
    chatListeners.length = 0;
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

// function disconnectUsers() {
//     const cutoff = new Date(Date.now() - 7000)
//     const disconnected = users.filter()
// }

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


    try {
        while (true) {
            // const change = currentResolver.promise

            // set user date

            // then filter users


            // might be better to have two functions, one yielding typing, one messages?
            yield {...thisRoom, messages: getMessages(roomId), typing: getTypingUsers(thisRoom) }
            // await Promise.race([change, new Promise(resolve => setTimeout(resolve, 5000))])
            // await change

            const { promise, resolve } = Promise.withResolvers<void>();
            chatListeners.push(resolve);

            // Race the local listener promise against your 5-second fallback timeout
            await Promise.race([ promise, new Promise(r => setTimeout(r, 5000))]);
        }

    } finally {
        const userListIndex = users.findIndex(user => user.id === userId)
        if (userListIndex !== -1) users.splice(userListIndex, 1)

        const userJoinedIndex = thisRoom.joinedIds.indexOf(userId)
        if (userJoinedIndex !== -1) thisRoom.joinedIds.splice(userJoinedIndex, 1)

        pushMessage(thisRoom, thisUser, `${thisUser.username} left the chat`, true)
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
    const taken = users.some((u: User) => u.username.toLowerCase() === username.toLowerCase() && u.id !== userId)

    username = username.trim();

    if (!username || username.length === 0) error(409, "Username is required!");
    if (taken) error(409, 'Username taken');
    if (username.length > 20) error (409, 'Username exceeds acceptable bounds');
    if (username.length < 3) error (409, 'Username must be 3 characters long');
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(username)) {
        error(400, 'Username can only contain letters, numbers, underscores, or hyphens');

}
 
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
