import { error } from '@sveltejs/kit';
import { DurableObject } from 'cloudflare:workers';
import type { User } from '$lib/types/types';

export class UserList extends DurableObject {
	users: User[] = [];
	// version = 0
	isChanged = false;

	acknowledgeChange() {
		this.isChanged = false;
	}

	addUser(id: string, username: string) {
		const exists = this.users.some((u) => u.id === id);
		const isTaken = this.users.some((u) => u.username === username && u.id !== id);

		// if (taken) error(409, 'Username already taken')

		// Just quietly ignore creation of
		// if (exists) error(409, "Room already exists")

		if (!exists && !isTaken) {
			this.users.push({ id, username, typing: false, lastSeen: Date.now() });
			// this.version++
			this.isChanged = true;
		}
	}

	getUserName(id: string) {
		const user = this.users.find((u) => u.id === id);
		return user?.username;
	}

	markActive(id: string) {
		const user = this.users.find((u) => u.id === id);
		if (user) user.lastSeen = Date.now();
	}

	removeUser(id: string) {
		const index = this.users.findIndex((u) => u.id === id);

		if (index !== -1) {
			this.users.splice(index, 1);
			this.isChanged = true;
		}
	}

	setTyping(id: string, isTyping: boolean) {
		const user = this.users.find((u) => u.id === id);

		if (user) {
			user.typing = isTyping;
			this.isChanged = true;
		}
	}

	getUsers() {
		const cutoff = Date.now() - 10000; // anyone who is quieter for more than 10 (no mark active called) is gone
		// only keep users who have been active since the cutoff
		const active = this.users.filter((u) => u.lastSeen > cutoff);

		// if something in user list changed add new version
		if (active.length !== this.users.length) {
			this.isChanged = true;
		}

		this.users = active;

		// return { version: this.version, users: this.users }
		return { isChanged: this.isChanged, users: this.users }; // typo was user not users
	}
}
