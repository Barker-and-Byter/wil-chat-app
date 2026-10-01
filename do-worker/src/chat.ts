import { DurableObject } from 'cloudflare:workers'

type User = { id: string, username: string, lastSeen: Date, typing: boolean };

type Message = { messageId: string, userId: string, username: string, text: string, system?: boolean}



export class Chat extends DurableObject {
    messages: Message[] = []
    users: User[] = []
    listeners = new Set<() => void>()

    notify() {
        for (const resolve of this.listeners) {
            resolve();
        }
        this.listeners.clear();
    }

    pushMessage(user: User, text: string, system = false) {
        this.messages.push({
            messageId: crypto.randomUUID(),
            userId: user.id,
            username: user.username,
            text: text,
            system: system
        });
        this.notify();
    }

    getTypingUsers() {
        const cutoff = new Date(Date.now() - 7000);
        return this.users
            .filter((u) => u.typing && u.lastSeen > cutoff)
            .map((u) => ({ id: u.id, username: u.username }));
    }

    disconnectUsers() {
        const cutoff = new Date(Date.now() - 10000);
        const disconnectedUsers = this.users.filter((u) => u.lastSeen < cutoff);

        for (const user of disconnectedUsers) {
            const index = this.users.findIndex((u) => u.id === user.id);
            if (index !== -1) this.users.splice(index, 1);

            this.pushMessage(user, `${user.username} left the chat`, true);
        }
    }

    waitForChange() {
        return new Promise<void>((resolve) => {
            this.listeners.add(resolve);
            setTimeout(() => {
                this.listeners.delete(resolve);
                resolve();
            }, 5000);
        });
    }

    addUser(userId: string, username: string) {
        if (this.users.length > 200) return 'Chat is full';

        const taken = this.users.some(
            (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== userId
        );
        if (taken) return 'Username taken';

        const existingUser = this.users.find((u) => u.id === userId);

        if (existingUser) {
            existingUser.username = username;
            existingUser.lastSeen = new Date();
        } else {
            this.users.push({ id: userId, username: username, lastSeen: new Date(), typing: false });
        }

        return null;
    }

    joinChat(userId: string) {
        const user = this.users.find((u) => u.id === userId);
        if (!user) return false;

        this.pushMessage(user, `${user.username} joined the chat`, true);
        return true;
    }

    getState(userId: string) {
        const user = this.users.find((u) => u.id === userId);
        if (user) user.lastSeen = new Date();

        this.disconnectUsers();

        return { messages: this.messages, typing: this.getTypingUsers() };
    }

    addMessage(userId: string, text: string) {
        const user = this.users.find((u) => u.id === userId);
        if (!user) return 'You need to join before sending messages';

        this.pushMessage(user, text);
        if (this.messages.length > 200) this.messages.shift();

        return null;
    }

    setTyping(userId: string, typing: boolean) {
        const user = this.users.find((u) => u.id === userId);
        if (!user) return false;

        user.typing = typing;
        this.notify();
        return true;
    }
}
