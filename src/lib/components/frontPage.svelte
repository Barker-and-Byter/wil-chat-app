<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ModeToggle from '$lib/components/ui/modeToggle/modeToggle.svelte';
	import SendButton from '$lib/components/ui/sendButton/send.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { Scrollbar } from '$lib/components/ui/scroll-area';
	import { Input } from '$lib/components/ui/input';
	import Message from './ui/message/message.svelte';
	import MessageContent from './ui/message/message-content.svelte';
	import MessageHeader from './ui/message/message-header.svelte';
	import Bubble from './ui/bubble/bubble.svelte';
	import BubbleContent from './ui/bubble/bubble-content.svelte';
	import { Marker, MarkerContent, MarkerIcon } from '$lib/components/ui/marker';
	import LoginForm from './login-form.svelte';

	import { getChat, addMessage, deleteMessage, editMessage } from '$lib/remote/chatRoom.remote';
	import { addUser } from '$lib/remote/users.remote';
	import { onMount, tick } from 'svelte';
	import { createRoom } from '$lib/remote/roomList.remote';

	import { PencilIcon, TrashIcon, EllipsisVertical } from '@lucide/svelte';
	import { DropdownMenu } from 'bits-ui';

	let inputField = $state('');
	let chatHistory: HTMLDivElement | null = $state(null);

	let editMessageId = $state('');
	let editInput = $state('');

	let isLoggedIn = $state(false);
	let id = $state('');
	let username = $state('');
	let loadChat = $state<any>(null);

	let messages = $derived(loadChat?.current?.messages ?? []);
	let users = $derived(loadChat?.current?.users ?? []);

	async function completeLogin(submittedUsername: string) {
		username = submittedUsername;
		isLoggedIn = true;

		loadChat = getChat({ room: 'global', id: id, username: username });
	}

	async function handleSend() {
		if (inputField.trim() === '') return;

		await addMessage({ room: 'global', userId: id, text: inputField.trim() });

		inputField = '';
		await tick();
		if (chatHistory) {
			chatHistory.scrollTop = chatHistory.scrollHeight;
		}
	}

	async function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSend();
		}
	}

	onMount(() => {
		id = crypto.randomUUID();
		createRoom({ name: 'global' });
		// const username = 'jared'; // This was added in merge, may change
		addUser({ id: id, username: username }); // Same with this
		loadChat = getChat({ room: 'global', id: id, username: username });
	});

	async function editApply() {
		await editMessage({ room: 'global', messageId: editMessageId, text: editInput });
	}

	async function delMsg(id: string) {
		await deleteMessage({ room: 'global', id: id });
	}
</script>

{#if !isLoggedIn}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
		<LoginForm onLogin={completeLogin} />
	</div>
{/if}

<div class="flex min-h-screen flex-col items-center justify-center gap-4">
	<div class="fixed top-5 right-10">
		<ModeToggle />
	</div>
	<h1 class="pb-10 text-9xl font-black">Chatty App 89</h1>
	<ScrollArea class="h-200 w-1/3 rounded-md border p-4">
		<div bind:this={chatHistory} class="overflow-y h-full">
			{#each messages as msg (msg.messageId)}
				{#if !msg.system}
					<Message align={msg.username === username ? 'end' : 'start'} class="group pt-3">
						<MessageHeader class="mb-1 px-1 text-xs font-medium text-muted-foreground">
							{msg.username}
						</MessageHeader>

						<MessageContent class="relative max-w-[75%]">
							<div class="flex items-end gap-1">
								<Bubble class=" {msg.username == username ? 'rounded-br-sm' : 'rounded-bl-sm'}">
									<BubbleContent class="px-4 py-2.5 text-sm leading-relaxed">
										{#if msg.messageId == editMessageId}
											<input
												bind:value={editInput}
												onkeydown={(e) => {
													if (e.key === 'Enter') {
														editApply();
													}
												}}
												onblur={() => {
													editMessageId = '';
													editInput = '';
												}}
											/>
										{:else}
											{msg.text}
										{/if}
									</BubbleContent>
								</Bubble>

								{#if msg.userId == id}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon"
													class="h-7 w-7 shrink-0"
													aria-label="Message options"
												>
													<EllipsisVertical class="h-4 w-4 text-muted-foreground" />
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>

										<DropdownMenu.Content
											align={msg.username === username ? 'end' : 'start'}
											class="w-30"
										>
											<DropdownMenu.Item
												onclick={() => {
													editMessageId = msg.messageId;
													editInput = msg.text;
												}}
												class="items-center p-2 align-middle focus:bg-white/5"
											>
												<div class="flex flex-row gap-x-4">
													<PencilIcon class="mr-2 h-4 w-4" />
													<span>Edit</span>
												</div>
											</DropdownMenu.Item>

											<DropdownMenu.Item
												class="items-center p-2 align-middle text-destructive  focus:bg-destructive/10 focus:text-destructive"
												onclick={() => delMsg(msg.messageId)}
											>
												<div class="flex flex-row gap-x-4">
													<TrashIcon class="mr-2 h-4 w-4" />
													<span>Delete</span>
												</div>
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}
							</div>
						</MessageContent>
					</Message>
				{:else}
					<Marker variant="separator" class="pt-3">
						<MarkerContent>{msg.text}</MarkerContent>
					</Marker>
				{/if}
			{/each}
		</div>
	</ScrollArea>
	<div class="grid w-1/3 grid-cols-[1fr_auto] items-center gap-2">
		<Input
			placeholder="Message..."
			type="text"
			bind:value={inputField}
			onkeydown={handleKeyDown}
			class="max-w-300"
		/>
		<SendButton onclick={handleSend} />
	</div>
</div>
