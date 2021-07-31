<script>
    import { push } from 'svelte-spa-router'
</script>

<div class="container hello">
	<h2 class="h3 mb-3">SVELTE</h2>
	<div on:click={() => push('/hello')}>Hello</div>
	<div on:click={() => push('/task')}>Task</div>
</div>

<style>
	.container.hello {
		margin-bottom: 20px;
	}
</style>
