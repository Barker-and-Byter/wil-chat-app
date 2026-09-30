<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription
	} from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let { onLogin }: { OnLogin: (username: string) => void } = $props();

	const id = $props.id();

	let username = $state('');

	function handleLogin(event: SubmitEvent) {
		event.preventDefault();
		if (username.trim()) {
			onLogin(username.trim());
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Please enter a username to start chatting!</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleLogin}>
			<FieldGroup>
				<Field>
					<FieldLabel for="username-{id}">Username</FieldLabel>
					<Input
						id="username-{id}"
						placeholder="Username"
						required
						bind:value={username}
						maxlength="20"
						minlength="3"
					/>
				</Field>
				<Field>
					<Button type="submit" class="w-full">Login</Button>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
