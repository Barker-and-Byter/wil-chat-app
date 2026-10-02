import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import type { Message, User } from '$lib/types/types';


// In Memory 
const users: User[] = []
const messages: Message[] = []

// chat
const chatSchema = type({ userId: 'string' });
const messageSchema = type({ userId: 'string', text: 'string' });

// rooms

// users
const userSchema = type({ userId: 'string', username: 'string' });
const typingSchema = type({ userId: 'string', typing: 'boolean' });

// resolver
const chatListeners = new Set<() => void>();


// Interval runner
setInterval(() => {

        disconnectUsers();

}, 5000);

// helpers 

function getMessages() {
    return messages
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

function pushMessage(user: User, text: string, system = false) {
    messages.push({
        messageId: crypto.randomUUID(),
        userId: user.id,
        username: user.username,
        text: text,
        system: system
    })
    notify()
}

function getTypingUsers() {
    const cutoff = new Date(Date.now() - 7000)
    return users
        .filter(u => u.typing && u.lastSeen > cutoff)
        .map(u => ({ id: u.id, username: u.username }))
}

function disconnectUsers() {
    const cutoff = new Date(Date.now() - 10000)
    const disconnectedUsers = users.filter(u => u.lastSeen < cutoff )

    for (const user of disconnectedUsers) {
        const userListIndex = users.findIndex(u => u.id === user.id)
        if (userListIndex !== -1) users.splice(userListIndex, 1)

        pushMessage(user, `${user.username} left the chat`, true)
    }
}

// Chat

export const getChat = query.live(chatSchema, async function* ({ userId }) {

    const thisUser = users.find(user => user.id === userId)

    if (!thisUser) error(404, 'must join before you can message')


    pushMessage( thisUser, `${thisUser.username} joined the chat`, true)



    // try {
        while (true) {
            thisUser.lastSeen = new Date()

            yield { messages: getMessages(), typing: getTypingUsers() }

            const { promise, resolve } = Promise.withResolvers<void>()

            chatListeners.add(resolve)

            await Promise.race([ promise, new Promise<void>((resolve) => setTimeout(resolve, 5000) ) ]);

            chatListeners.delete(resolve);
        }
});

export const addMessage = command(messageSchema, async ({ userId, text }) => {

    const thisUser = getUser(userId)

    text = text.trim();

    if (!thisUser) error(400, 'You need to join before sending messages');
    if (text.length > 50) error(400, 'Message length exceeds limit');
    if (text.length < 1) error(400, "Please type a message");

    const validPattern = /^[a-zA-Z0-9_\-\p{Extended_Pictographic}]+$/u;

    if (!validPattern.test(text)) {
        error(400, 'Username can only contain letters, numbers, underscores, hyphens, or emojis');
    }


    pushMessage( thisUser, text)

    if (messages.length > 200) messages.shift()
})


// USERS

export const addUser = command(userSchema, async ({ userId, username }) => {
    if (users.length > 200) return

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
