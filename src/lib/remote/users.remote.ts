import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { command } from '$app/server';
import { getUserList } from '../getSimple';
import type { User } from '$lib/types/types';

const userArgs = type({ id: 'string', username: 'string' });
const typingArgs = type({ id: 'string', typing: 'boolean' });

export const addUser = command(userArgs, async ({ id, username }) => {
	const userList = getUserList();
	const { users } = await userList.getUsers();

	// Define u
	const taken = users.some((u: User) => u.username === username && u.id !== id);

	if (taken) {
		error(409, 'Username taken');
	}

	await userList.addUser(id, username);
});

export const setTyping = command(typingArgs, async ({ id, typing }) => {
	await getUserList().setTyping(id, typing);
});
