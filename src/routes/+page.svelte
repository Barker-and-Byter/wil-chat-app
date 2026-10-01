<script lang="ts">
    import { Button } from '$lib/components/ui/button/index.js';
	import ModeToggle from '$lib/components/ui/modeToggle/modeToggle.svelte';
	import SendButton from '$lib/components/ui/sendButton/send.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	import { Input } from '$lib/components/ui/input';
	import Message from '$lib/components/ui/message/message.svelte';
	import MessageContent from '$lib/components/ui/message/message-content.svelte';
	import MessageHeader from '$lib/components/ui/message/message-header.svelte';
	import Bubble from '$lib/components/ui/bubble/bubble.svelte';
	import BubbleContent from '$lib/components/ui/bubble/bubble-content.svelte';
	import { Marker, MarkerContent } from '$lib/components/ui/marker';
	import LoginForm from '$lib/components/login-form.svelte';

	import { getChat, addMessage, deleteMessage, editMessage, addUser, setTyping } from './all.remote'
	import { onMount, tick } from 'svelte';

	import { PencilIcon, TrashIcon, EllipsisVertical } from '@lucide/svelte';
	import { DropdownMenu } from 'bits-ui';
    import type { User } from '$lib/types/types';

    const roomId = 'main';
	
	let errorMessage = state('');
    let inputField = $state('');
	let chatHistory: HTMLDivElement | null = $state(null);

	let editMessageId = $state('');
	let editInput = $state('');

	let isLoggedIn = $state(false);
	let id = $state('');
	let username = $state('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let loadChat = $state<any>(null);

	let messages = $derived(loadChat?.current?.messages ?? []);

    let typingUsers = $derived((loadChat?.current?.typing ?? []).filter((u: User) => u.id !== id));

    let typingText = $derived.by(() => {
		const names = typingUsers.map((u: User) => u.username);
 
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const messageCount = messages.length
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const typingChange = typingText
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
		errorMessage = '';

		if (thisInput === '') return;

		inputField = ''
		try{

        await addMessage({ roomId: roomId, userId: id, text: thisInput });

		} except (err : any) {
			if (err.status === 400){
				errorMessage = err.body?.message || "an expected error occured";
			} else {
				errorMessage = "an unexpected error occured";
			}
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
	<section class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
		<LoginForm onLogin={completeLogin} />
	</section>
{/if}

<main class="flex min-h-screen flex-col items-center justify-center gap-4">
    <header>
        <div class="fixed top-5 right-10">
            <ModeToggle />
        </div>
        <h1 class="pb-10 text-9xl font-black">Chatty App</h1>
    </header>
	
	<ScrollArea class="h-150 w-1/3 rounded-md border p-4" bind:viewportRef={chatHistory}>
		<div class="h-full">
			{#each messages as msg (msg.messageId)}
				{#if !msg.system}

					<Message align={msg.username === username ? 'end' : 'start'} class="group pt-3">
						<MessageHeader class="mb-1 px-1 text-xs font-medium text-muted-foreground">
							{msg.username}
						</MessageHeader>

						<MessageContent class="relative max-w-[75%] hover:z-50 focus-within:z-50">
							<div class="flex items-center gap-1 {msg.username === username ? 'justify-end' : 'justify-start'}">

                                {#if msg.username === username }
									<DropdownMenu.Root >
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
                                                class="focus:bg-black/60 bg-gray-900/30 px-2 py-1 rounded-md flex flex-row gap-2 items-center cursor-default"
											>
												<PencilIcon size={14} />
												Edit
											</DropdownMenu.Item>
 
											<DropdownMenu.Item 
                                                class="flex flex-row gap-2 px-2 py-1 bg-gray-900/30 rounded-md items-center text-destructive focus:bg-destructive/60 focus:text-white cursor-default z-10" 
                                                onclick={() => delMsg(msg.messageId)}
                                            >
												<TrashIcon size={14} />
												Delete
											</DropdownMenu.Item>

										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}

								<Bubble class={msg.userId === id ? 'rounded-br-sm' : 'rounded-bl-sm'}>
									<BubbleContent class="px-4 py-2.5 text-sm leading-relaxed">
										{#if msg.messageId == editMessageId}
											<input
												class="w-full text-sm min-w-0 bg-transparent outline-none rounded-md"
												bind:value={editInput}
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

	<footer class="grid w-1/3 grid-cols-[1fr_auto] items-center gap-2">
		<Input
			placeholder="Message..."
			type="text"
			bind:value={inputField}
            oninput={handleTyping}
			onkeydown={(e) => { if (e.key === "Enter") handleSend() }} 
			class="max-w-300"
			maxlength="50"
			minlength="1"
		/>
		<SendButton onclick={handleSend} />
	</footer>
	{#if errorMessage}
		<p class="text-sm font-semibold text-destructive mt-1">
			{errorMessage}
		</p>
	{/if}
</main>
