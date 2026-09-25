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
	import { onMount, tick } from 'svelte';
    let inputField = $state("");
    let chatHistory: HTMLDivElement | null = $state(null);
    let messages = $state([{sender: "Marissa", text: "hello everybody my name is markiplier..."}]);

    async function submit(event: KeyboardEvent){
        if (event.key === 'Enter' && inputField.trim() !== ''){
            event.preventDefault();

            messages = [...messages,{
                sender: "Marrisa",
                text: inputField.trim()
            }];

            inputField = '';
            await tick();
            if (chatHistory) {
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        }
    }
</script>

<h1>hello</h1>
<Button>Click me!</Button>
<div class="flex min-h-screen flex-col items-center justify-center gap-4">
	<div class="fixed top-5 right-10">
		<ModeToggle />
	</div>
	<h1 class="pb-20 text-9xl font-black">Chatty App</h1>
	<ScrollArea class="h-200 w-1/3 rounded-md border p-4">
		<div
            bind:this={chatHistory}
            class="h-full overflow-y"
		>
        {#each messages as msg}
            <Message align="end" class="pt-3">
                <MessageHeader>{msg.sender}</MessageHeader>
                <MessageContent>
                    <Bubble>
                        <BubbleContent>{msg.text}</BubbleContent>
                    </Bubble>
                </MessageContent>
            </Message>
        {/each}
		</div>
	</ScrollArea>
	<div class="grid w-1/3 grid-cols-[1fr_auto] items-center gap-2">
		<Input placeholder="Message..." type="text" bind:value={inputField} onkeydown={submit} class="max-w-300" />
		<SendButton />
	</div>
</div>
