import type { MessageType } from '$lib/types/types';
import { DurableObject } from 'cloudflare:workers';


export class ChatRoom extends DurableObject {
  messages: MessageType[] = []
  maxMessages = 200
  // version = 0
  isChanged = false
  usersPresent = new Set<string>()

  acknowledgeChange() {
    this.isChanged = false
  }

  join(id: string) {
    const isNew = !this.usersPresent.has(id)
    if (isNew) this.usersPresent.add(id)
    return isNew
  }

  leave(id: string) {
    this.usersPresent.delete(id)
  }

  addMessage(message: MessageType) {
    console.log(message)
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) {
        this.messages.shift()
    }
    // this.version++
    this.isChanged = true
  }

  deleteMessage(id: string) {
     const index = this.messages.findIndex((m) => m.id === id)


    if (index !== -1) {
        this.messages.splice(index, 1)
        // this.version++
        this.isChanged = true
    }
  }

  getState() {
    // return { version: this.version, messages: this.messages }
    return { isChanged: this.isChanged, message: this.messages }
  }
}