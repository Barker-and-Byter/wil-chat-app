import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';


// TODO: figure out platform
export function getRoom(roomName: string) {
    const { platform } = getRequestEvent()
    if (!platform) error(500, 'Get Room Name failed')

    return platform.env.CHAT_ROOM.get(platform.env.CHAT_ROOM.idFromName(roomName))
}

export function getUserList() {
    const { platform } = getRequestEvent()
    if (!platform) error(500, 'Get user list failed')
    return platform.env.USER_LIST.get(platform.env.USER_LIST.idFromName('global'))
}

export function getRoomList() {
    const { platform } = getRequestEvent()
    if (!platform) error(500, 'Get room list failed')
    return platform.env.ROOM_LIST.get(platform.env.ROOM_LIST.idFromName('global'))
}