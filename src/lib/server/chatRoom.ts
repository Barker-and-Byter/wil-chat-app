import type { Message } from '$lib/types/types';
import { DurableObject } from 'cloudflare:workers';

export class ChatRoom extends DurableObject {
	messages: Message[] = [];
	maxMessages = 200;
	// version = 0
	isChanged = false;
	usersPresent = new Set<string>();

	acknowledgeChange() {
		this.isChanged = false;
	}

	join(id: string) {
		const isNew = !this.usersPresent.has(id);
		if (isNew) this.usersPresent.add(id);
		return isNew;
	}

	leave(id: string) {
		this.usersPresent.delete(id);
	}

	addMessage(message: Message) {
		this.messages.push(message);
		if (this.messages.length > this.maxMessages) {
			this.messages.shift();
		}
		// this.version++
		this.isChanged = true;
	}

	deleteMessage(id: string) {
		const index = this.messages.findIndex((m) => m.messageId === id);

		if (index !== -1) {
			this.messages.splice(index, 1);
			// this.version++
			this.isChanged = true;
		}
	}

	editMessage(messageId: string, text: string) {
		const index = this.messages.findIndex((m) => m.messageId === messageId)

		if (index !== -1) {
			this.messages[index].text = text
			console.log(this.messages[index])
			this.isChanged = true
		}
	}

	getState() {
		// return { version: this.version, messages: this.messages }
		return { isChanged: this.isChanged, messages: this.messages }; // fixed type
	}
}
