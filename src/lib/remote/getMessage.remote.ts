import { query, command } from '$app/server';
import { type } from 'arktype';
import { error } from '@sveltejs/kit';
// import { EventEmitter } from "events";

// TODO: I think implementing a store of messages, but then also a store of users. That way we can see

const uSchema = type({
	// id: "string.uuid", // * make user name unique so people can't have the same username
	username: 'string',
	typing: 'boolean'
});

const mSchema = type({
	id: 'string.uuid',
	message: 'string',
	name: 'string'
});

type User = typeof uSchema.infer;
type Message = typeof mSchema.infer;

// * Sets make it so
const userStore: User[] = [];
const messageStore: Message[] = [];

// const mEvent = new EventEmitter()

export const getMessages = query.live(async function* () {
	yield messageStore;

	// while (true) {
	//     await new Promise((resolve) => mEvent.once("update", resolve));
	//     yield messageStore;
	// }
});

export const pushMessage = command(mSchema, async (message) => {
	messageStore.push(message);

	// mEvent.emit("update")
});

const idSchema = type({ id: 'string.uuid' });
export const deleteMessage = command(idSchema, async (data) => {
	const index = messageStore.findIndex((message) => message.id === data.id);

	// * How I would do error handling
	// if (thisIndex == -1) error(404, "Message failed to delete")
	// messageStore.splice(thisIndex, 1)

	if (index !== -1) messageStore.splice(index, 1);
});

const userNameSchema = type('string');
export const onConnect = command(userNameSchema, async (inputUsername) => {
	const exists = userStore.find((user) => user.username === inputUsername);

	if (!exists) return;

	userStore.push({ username: inputUsername, typing: false });
});

// export const onDisconnet = command(userNameSchema, async (inputUsername) => {
//     const index = userStore.findIndex(user => user.username ==)
// })
