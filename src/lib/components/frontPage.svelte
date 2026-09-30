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

	import { getChat, addMessage, deleteMessage, editMessage, addUser, setTyping } from '$lib/remote/all.remote'
	import { onMount, tick } from 'svelte';

	import { PencilIcon, TrashIcon, EllipsisVertical } from '@lucide/svelte';
	import { DropdownMenu } from 'bits-ui';

    const roomId = 'main';

    let inputField = $state('');
	let chatHistory: HTMLDivElement | null = $state(null);

	let editMessageId = $state('');
	let editInput = $state('');

	let isLoggedIn = $state(false);
	let id = $state('');
	let username = $state('');
	let loadChat = $state<any>(null);

	let messages = $derived(loadChat?.current?.messages ?? []);

    let typingUsers = $derived((loadChat?.current?.typing ?? []).filter((u: any) => u.id !== id));

    let typingText = $derived.by(() => {
		const names = typingUsers.map((u: any) => u.username);
 
		if (names.length === 0) return ''
		if (names.length === 1) return `${names[0]} is typing...`
		if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
		return 'Several people are typing...'
	});

    let isTyping = false;

    let typingTimeout: ReturnType<typeof setTimeout>

    const scrollToBottom = async () => {
        await tick()
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight
        }
    }

    $effect(() => {
        messages.length;
        typingText;
        scrollToBottom();
    })

    function handleTyping() {
		if (!isTyping) {
			isTyping = true
			setTyping({ userId: id, typing: true })
		}
 
		clearTimeout(typingTimeout)
		typingTimeout = setTimeout(stopTyping, 2000)
	}
 
	function stopTyping() {
		clearTimeout(typingTimeout)
 
		if (!isTyping) return
 
		isTyping = false
		setTyping({ userId: id, typing: false })
	}

	async function completeLogin(submittedUsername: string) {
		username = submittedUsername;
        await addUser({ userId: id, username: username })
		isLoggedIn = true;
		loadChat = getChat({ roomId: roomId, userId: id });
	}

	async function handleSend() {
        const thisInput = inputField.trim()

		if (thisInput === '') return;

		await addMessage({ roomId: roomId, userId: id, text: thisInput })

		inputField = ''
		await tick()
		if (chatHistory) {
			chatHistory.scrollTop = chatHistory.scrollHeight;
		}
	}

	onMount(() => {
		id = crypto.randomUUID();
	});

	async function editApply() {
		await editMessage({ roomId: roomId, messageId: editMessageId, text: editInput })
        editMessageId = '';
		editInput = '';
	}

    function cancelEdit() {
		editMessageId = '';
		editInput = '';
	}

	async function delMsg(messageId: string) {
		await deleteMessage({ roomId: roomId, messageId: messageId })
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
	<h1 class="pb-10 text-9xl font-black">Chatty App</h1>
    
	<ScrollArea class="h-150 w-1/3 rounded-md border p-4" bind:viewportRef={chatHistory}>
		<div class="h-full">
			{#each messages as msg (msg.messageId)}
				{#if !msg.system}

					<Message align={msg.username === username ? 'end' : 'start'} class="group pt-3">
						<MessageHeader class="mb-1 px-1 text-xs font-medium text-muted-foreground">
							{msg.username}
						</MessageHeader>

						<MessageContent class="relative max-w-[75%]">
							<div class="flex items-center gap-1 {msg.username === username ? 'justify-end' : 'justify-start'}">

                                {#if msg.username === username }
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon"
													class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
												>
													<EllipsisVertical class="h-4 w-4 text-muted-foreground" />
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
 
										<DropdownMenu.Content align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
											<DropdownMenu.Item
												onclick={() => {
													editMessageId = msg.messageId;
													editInput = msg.text;
												}}
											>
												<PencilIcon />
												Edit
											</DropdownMenu.Item>
 
											<DropdownMenu.Item class="text-destructive focus:bg-destructive/10 focus:text-destructive" onclick={() => delMsg(msg.messageId)}>
												<TrashIcon />
												Delete
											</DropdownMenu.Item>

										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}

								<Bubble class={msg.userId === id ? 'rounded-br-sm' : 'rounded-bl-sm'}>
									<BubbleContent class="px-4 py-2.5 text-sm leading-relaxed">
										{#if msg.messageId == editMessageId}
											<input
												class="w-full min-w-0 bg-transparent outline-none"
												bind:value={editInput}
												{@attach (node) => node.focus()}
												onkeydown={(e) => {
													if (e.key === 'Enter') editApply();
													if (e.key === 'Escape') cancelEdit();
												}}
												onblur={cancelEdit}
											/>
										{:else}
											{msg.text}
										{/if}
									</BubbleContent>
								</Bubble>
 

							</div>
						</MessageContent>
					</Message>
				{:else}
					<Marker variant="separator" class="pt-3">
						<MarkerContent>{msg.text}</MarkerContent>
					</Marker>
				{/if}
			{/each}

            {#if typingText}
				<Marker role="status" class="pt-3">
					<MarkerContent class="shimmer">{typingText}</MarkerContent>
				</Marker>
			{/if}

		</div>
	</ScrollArea>
	<div class="grid w-1/3 grid-cols-[1fr_auto] items-center gap-2">
		<Input
			placeholder="Message..."
			type="text"
			bind:value={inputField}
            oninput={handleTyping}
			onkeydown={(e) => { if (e.key === "Enter") handleSend() }} 
			class="max-w-300"
		/>
		<SendButton onclick={handleSend} />
	</div>
</div>
