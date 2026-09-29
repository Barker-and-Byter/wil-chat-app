import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { getRoom, getUserList } from '../getSimple';
import type { Message, User } from '$lib/types/types';

const chatArgs = type({ room: 'string', id: 'string', username: 'string' });
const messageArgs = type({ room: 'string', userId: 'string', text: 'string' });
const deleteArgs = type({ room: 'string', id: 'string' });


export const getChat = query.live(chatArgs, async function* ({ room, id, username }) {
    const chatRoom = getRoom(room)
    const userList = getUserList()

    const isNew = await chatRoom.join(id)

    await userList.addUser(id, username);

    if (isNew) {
        await chatRoom.addMessage({
            id: crypto.randomUUID(),
            username,
            text: `${username} joined the chat`,
            system: true
        })
    }

    //   let lastMessageVersion = -1
    //   let lastUserVersion = -1
    let last = { messages: [] as Message[], users: [] as User[] }

    try {
        while (true) {
            await userList.markActive(id)

            const msgState = await chatRoom.getState()
            const userState = await userList.getUsers()

            //   if (msgState.version !== lastMessageVersion || userState.version !== lastUserVersion) {
            //     lastMessageVersion = msgState.version
            //     lastUserVersion = userState.version
            //     last = { messages: msgState.messages, users: userState.users }
            //     yield last
            //   }


            if (msgState.isChanged || userState.isChanged) {
                last = { messages: msgState.message, users: {id, ...userState.users} }
                chatRoom.acknowledgeChange()
                userList.acknowledgeChange()
                yield last
            }
            

            await new Promise((r) => setTimeout(r, 2000))
        }
    } finally {
        await chatRoom.leave(id)
        await userList.removeUser(id)
        await chatRoom.addMessage({
            id: crypto.randomUUID(),
            username,
            text: `${username} left the chat`,
            system: true
        })
    }
})

export const addMessage = command(messageArgs, async ({ room, userId, text }) => {
    const chatRoom = getRoom(room);
    const username = await getUserList().getUserName(userId);

    if (!username) {
        error(400, 'You need to join before sending messages')
    }

    await chatRoom.addMessage({ id: crypto.randomUUID(), username: username, text: text})
})

export const deleteMessage = command(deleteArgs, async ({ room, id }) => {
    await getRoom(room).deleteMessage(id)
})