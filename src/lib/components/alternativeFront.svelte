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
    import { addUser, setTyping } from '$lib/remote/users.remote';
    import { getChat, addMessage } from '$lib/remote/chatRoom.remote';


    

    const myId = crypto.randomUUID()

    let text = $state('');

    let chat = $state<any>()

    // const chat = getChat({ room: "main", id: myId, username: "pall" })


    async function send() {
        await addMessage({ room: "main", userId: myId, text });
        text = '';
    }
</script>

<!-- <h1>hello</h1>
<Button>Click me!</Button> -->
<main class="flex min-h-screen flex-col items-center gap-4 p-10">
    {#if chat?.current}

    <!-- {#if !joined}
        <input bind:value={username} placeholder="pick a name" />
        <button onclick={join}>Join</button>
    {:else} -->
        <ul>
            {#each chat.current?.users ?? [] as user}
                <li>{user.username}{user.typing ? ' (typing)' : ''}</li>
            {/each}
        </ul>

        {#each chat.current?.messages ?? [] as m}
            {#if m.system}
                <p class="text-gray-500 italic">{m.text}</p>
            {:else}
                <p><b>{m.username}:</b> {m.text}</p>
            {/if}
        {/each}

        <input bind:value={text} onblur={() => send()}>

    <!-- {/if} -->

        <input
            bind:value={text}
            oninput={() => setTyping({ id: myId, typing: text.length > 0 })}
            onkeydown={(e) => e.key === 'Enter' && send()}
        />
        <button onclick={send}>Send</button>
    <!-- {/if} -->
    <header class="flex pt-4">
        <div class="fixed top-5 right-10">
            <ModeToggle />
        </div>
        <h1 class="pb-10 text-9xl font-black">Chatty App</h1>
    </header>
	
    <ScrollArea class="h-150 w-full rounded-md border p-4">
        <div

            class="h-full overflow-y"
        >
        <!-- {#each messages as msg}
            <Message align="end" class="pt-3">
                <MessageHeader>{msg.sender}</MessageHeader>
                <MessageContent>
                    <Bubble>
                        <BubbleContent>{msg.text}</BubbleContent>
                    </Bubble>
                </MessageContent>
            </Message>
        {/each} -->
        </div>
    </ScrollArea>


	<!-- <div class="grid w-full grid-cols-[1fr_auto] items-center gap-2">
		<Input placeholder="Message..." type="text" bind:value={inputField} onkeydown={submit} class="max-w-300" />
		<SendButton onkeydown />
	</div> -->
    {/if}
</main>
