import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';



// In Memory 
// const users: User[] = []
// const messages: Message[] = []

// chat
const chatSchema = type({ userId: 'string' });
const messageSchema = type({ userId: 'string', text: 'string' });

// rooms

// users
const userSchema = type({ userId: 'string', username: 'string' });
const typingSchema = type({ userId: 'string', typing: 'boolean' });

// resolver


function getChatStub() {
    const { platform } = getRequestEvent();
    return platform!.env.CHAT.get(platform!.env.CHAT.idFromName('main'));
}

// Chat

export const getChat = query.live(chatSchema, async function* ({ userId }) {
    const chat = getChatStub()

    const joined = await chat.joinChat(userId)
    if (!joined) error(404, 'must join before you can message')


    while (true) {
        yield await chat.getState(userId);
        await chat.waitForChange();
    }
});

export const addMessage = command(messageSchema, async ({ userId, text }) => {
    if (text.length > 255) error(400, 'Message length exceeds limit');
    if (text.length < 1) error(400, 'Please type a message');

    // do patch for symbols

    // const validPattern = /^[a-zA-Z0-9_\-\p{Extended_Pictographic}]+$/u;

    // if (!validPattern.test(text)) {
    //     error(400, 'Username can only contain letters, numbers, underscores, hyphens, or emojis');
    // }

    const problem = await getChatStub().addMessage(userId, text);
    if (problem) error(400, problem);
})


// USERS

export const addUser = command(userSchema, async ({ userId, username }) => {
    username = username.trim();

    if (!username || username.length === 0) error(409, 'Username is required!');
    if (username.length > 255) error(409, 'Username exceeds acceptable bounds');
    if (username.length < 3) error(409, 'Username must be 3 characters long');

    // const validPattern = /^[a-zA-Z0-9_-]+$/;
    // if (!validPattern.test(username)) {
    //     error(400, 'Username can only contain letters, numbers, underscores, or hyphens');
    // }

    const problem = await getChatStub().addUser(userId, username);
    if (problem) error(409, problem);
});

export const setTyping = command(typingSchema, async ({ userId, typing }) => {
    const found = await getChatStub().setTyping(userId, typing);
    if (!found) error(404, 'user does not exist');
});
