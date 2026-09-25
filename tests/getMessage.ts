import { expect, test } from 'vitest'
import { getMessages, pushMessage } from '../src/lib/remote/getMessage.remote.ts'

//! Don't work yet

test('push message is returned by get message', () => {
    const messages = getMessages()
    pushMessage({ message: "test", name: "test"})


})