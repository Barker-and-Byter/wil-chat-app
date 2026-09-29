import { type } from 'arktype';
import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { getRoomList } from '../getSimple';
import type { Room } from '$lib/types/types';

const createRoomArgs = type({ name: 'string' })

// Should be a query.live
export const getRooms = query(async () => {
  return await getRoomList().getRooms()
})

export const createRoom = command(createRoomArgs, async ({ name }) => {
  const roomList = getRoomList()
  const { rooms } = await roomList.getRooms()

  // Type define r
  const taken = rooms.some((r: Room) => r.name === name)

  if (taken) {
    error(409, 'Room already exists')
  }

  await roomList.addRoom(name)
});