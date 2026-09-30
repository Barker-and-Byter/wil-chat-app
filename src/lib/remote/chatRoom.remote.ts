import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { getRoom, getUserList } from '../getSimple';
import type { Message, User } from '$lib/types/types';

const chatArgs = type({ room: 'string', id: 'string', username: 'string' });
const messageArgs = type({ room: 'string', userId: 'string', text: 'string' });
const deleteArgs = type({ room: 'string', id: 'string' });
const editArgs = type({ room: 'string', messageId: "string", text: "string"})


export const getChat = query.live(chatArgs, async function* ({ room, id, username }) {
	const chatRoom = getRoom(room);
	const userList = getUserList();



	const isNew = await chatRoom.join(id);
	

	if (isNew) {
		await chatRoom.addMessage({
			messageId: crypto.randomUUID(),
            userId: id,
			username,
			text: `${username} joined the chat`,
			system: true
		});
	}

	//   let lastMessageVersion = -1
	//   let lastUserVersion = -1
	// let last = { messages: [] as Message[], users: [] as User[] };

    let last: { messages: Message[], users: User[] }

	try {
		while (true) {
			await userList.markActive(id);

			const msgState = await chatRoom.getState();
			const userState = await userList.getUsers();

			//   if (msgState.version !== lastMessageVersion || userState.version !== lastUserVersion) {
			//     lastMessageVersion = msgState.version
			//     lastUserVersion = userState.version
			//     last = { messages: msgState.messages, users: userState.users }
			//     yield last
			//   }

			if (msgState.isChanged || userState.isChanged) {
				last = { messages: msgState.messages, users: userState.users  };
				chatRoom.acknowledgeChange();
				userList.acknowledgeChange();
				yield last;
			}

			await new Promise((r) => setTimeout(r, 2000));
		}
	} finally {
		await chatRoom.leave(id);
		await userList.removeUser(id);
		await chatRoom.addMessage({
			messageId: crypto.randomUUID(),
            userId: id, 
			username,
			text: `${username} left the chat`,
			system: true
		});
	}
});

export const addMessage = command(messageArgs, async ({ room, userId, text }) => {
	const chatRoom = getRoom(room);
	const username = await getUserList().getUserName(userId);

	if (!username) {
		error(400, 'You need to join before sending messages');
	}

	const result = await chatRoom.addMessage({ messageId: crypto.randomUUID(), userId: userId, username: username, text: text });

    console.log(result)
});

// Need to add some validation
export const deleteMessage = command(deleteArgs, async ({ room, id }) => {
	await getRoom(room).deleteMessage(id);
});

// need to add some validation, non users can't change id
export const editMessage = command(editArgs, async ({ room, messageId, text }) => {
    await getRoom(room).editMessage(messageId, text)
})
