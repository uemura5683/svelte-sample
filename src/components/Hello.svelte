<script>
    import { push } from 'svelte-spa-router'
</script>

<!-- HTML部 -->
<div class="container hello">
	<h2 class="h3 mb-3">HELLO</h2>
	<div on:click={() => push('/')}>TOP</div>
</div>

<style>
	.container.hello {
		margin-bottom: 20px;
	}
</style>