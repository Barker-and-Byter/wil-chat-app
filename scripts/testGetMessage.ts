
import { getMessages, pushMessage } from '../src/lib/remote/getMessage.remote.ts'

const messages = getMessages()

console.log(messages)

pushMessage({ message: "is test", name: "is test name"})

console.log(messages)