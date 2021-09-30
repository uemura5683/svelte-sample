<script>
    import { push } from 'svelte-spa-router'
</script>
<div class="container">
	<h2 class="h3 mb-3 title">Sample SVG</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title"></p>
		</div>
	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>