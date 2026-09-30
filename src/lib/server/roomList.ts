import { DurableObject } from 'cloudflare:workers';
import type { Room } from '$lib/types/types';

export class RoomList extends DurableObject {
	rooms: Room[] = [];
	//   version = 0
	isChanged = false;

	addRoom(name: string) {
		const exists = this.rooms.some((r) => r.name === name);

		if (!exists) {
			this.rooms.push({ name, createdAt: Date.now() });
			// this.version++
			this.isChanged = true;
		}
	}

	getRooms() {
		// return { version: this.version, rooms: this.rooms }
		return { isChanged: this.isChanged, rooms: this.rooms };
	}
}
