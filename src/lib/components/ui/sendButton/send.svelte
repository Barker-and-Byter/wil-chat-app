<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Send from '@lucide/svelte/icons/Send';

	let { onclick, ...restProps } = $props();
</script>

<Button variant="outline" size="icon" {onclick} {...restProps}>
	<Send />
</Button>
z
