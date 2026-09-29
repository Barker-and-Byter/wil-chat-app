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

	import { getChat, addMessage, deleteMessage } from '$lib/remote/chatRoom.remote';
	import { addUser } from '$lib/remote/users.remote';
	import { onMount, tick } from 'svelte';
	import { createRoom } from '$lib/remote/roomList.remote';

	let inputField = $state('');
	let chatHistory: HTMLDivElement | null = $state(null);

	let isLoggedIn = $state(false);
	let id = $state('');
	let username = $state('');
	let loadChat = $state<any>(null);

	let messages = $derived(loadChat?.current?.messages ?? []);
	let users = $derived(loadChat?.current?.users ?? []);

    async function completeLogin(submittedUsername: string){
        username = submittedUsername;
        isLoggedIn = true;

		loadChat = await getChat({ room: 'global', id: id, username: username });
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
	});
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
	<h1 class="pb-20 text-9xl font-black">Chatty App</h1>
	<ScrollArea class="h-200 w-1/3 rounded-md border p-4">
		<div bind:this={chatHistory} class="overflow-y h-full">
			{#each messages as msg}
				{#if !msg.system}
					<Message
						align={msg.username === username ? 'start' : 'end'}
						// aligns at the end when its you aligns at start when it isnt...
						class="pt-3"
					>
						<MessageHeader>{msg.username}</MessageHeader>
						<MessageContent>
							<Bubble>
								<BubbleContent>{msg.text}</BubbleContent>
							</Bubble>
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
		<SendButton onclick={handleSend}/>
	</div>
</div>
