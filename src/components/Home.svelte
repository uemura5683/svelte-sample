<script>
    import { push } from 'svelte-spa-router'
</script>

<div class="container hello">
	<h2 class="h3 mb-3 title">SVELTE</h2>
	<div class="row">
		<div 
			on:click={() => push('/sample')}
			class="col-4 mb-2 pointer">
				Sample
		</div>
		<div 
			on:click={() => push('/events')}
			class="col-4 mb-2 pointer">
				SampleEvents
		</div>
		<div 
			on:click={() => push('/bindings')}
			class="col-4 mb-2 pointer">
				SampleBindings
		</div>
		<div 
			on:click={() => push('/saaplemotion')}
			class="col-4 mb-2 pointer">
				SampleMotion
		</div>
		<div 
			on:click={() => push('/store')}
			class="col-4 mb-2 pointer">
				SampleStore
		</div>
		<div 
			on:click={() => push('/trantitions')}
			class="col-4 mb-2 pointer">
				SampleTrantitions
		</div>		
		<div 
			on:click={() => push('/svg')}
			class="col-4 mb-2 pointer">
				SampleSVG
		</div>
		<div 
			on:click={() => push('/classes')}
			class="col-4 mb-2 pointer">
				SampleSlasses
		</div>
		<div 
			on:click={() => push('/task')}
			class="col-4 mb-2 pointer">
				Task
		</div>
		<a
			href="https://svelte.dev/examples"
			target="_blank"
			class="pointer">
			Tutorial
		</a>
	</div>
</div>