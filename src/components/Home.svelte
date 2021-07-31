<script>
    import { push } from 'svelte-spa-router'
</script>

<div class="container hello">
	<h2 class="h3 mb-3 title">SVELTE</h2>
	<div class="row">
		<div on:click={() => push('/sample')} class="col-4">Sample</div>
		<div on:click={() => push('/task')} class="col-4">Task</div>
	</div>
</div>