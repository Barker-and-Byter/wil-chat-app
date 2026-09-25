import { query, command } from '$app/server';
import { type } from 'arktype'
// import { EventEmitter } from "events";


const mSchema = type({
    message: "string",
    name: "string"
})

type Message = typeof mSchema.infer

const store: Message[] = []

// const mEvent = new EventEmitter()


export const getMessages = query.live(async function* () {


    yield store;

    // while (true) {
    //     await new Promise((resolve) => mEvent.once("update", resolve));
    //     yield store;
    // }
})

export const pushMessage = command(mSchema, async (message) => {
    store.push(message)

    // mEvent.emit("update")
})

