<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Send from '@lucide/svelte/icons/send';

	let { onclick, ...restProps } = $props();
</script>

<Button variant="outline" size="icon" {onclick} {...restProps}>
	<Send />
</Button>
