<script>
    import { push } from 'svelte-spa-router'
	
	/**
	 * DOM events
	*/
	let m = {x: 0, y:0}
	function handleMousemove(event) {
		m.x = event.clientX;
		m.y = event.clientY;
	}

	/**
	 * Inliune handlers
	*/
	let m2 = {x:0, y:0}

	/**
	 * Event modifiers
	*/
	function handleslick() {
		alert('hello alerts');
	}

	/**
	 * Components events
	*/
	import Inner from './parts/Inner.svelte';

	function handleMessage(event) {
		alert(event.detail.text);
	}

	/**
	 * DOM event forwarding
	*/
	import CustomButton from './parts/CustomButton.svelte';

	function handleClick3() {
		alert('clicked');
	}

</script>

<!-- HTML部 -->
<div class="container">
	<h2 class="h3 mb-3 title">Sample Events</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">DOM events</p>
			<div class="domevents" on:mousemove={handleMousemove}>
				The mouse position is {m.x} x {m.y}
			</div>
		</div>

		<div class="sampleli">
			<p class="sub-title">Inline handlers</p>
			<div class="domevents" on:mousemove={e => m2 = {x: e.clinentX, y:e.cilentY}}>
				The mouse position is {m.x} x {m.y}
			</div>
		</div>

		<div class="sampleli">
			<p class="sub-title">Events modifiers</p>
			<button on:click|once={handleslick}>
				click here
			</button>
		</div>

		<div class="sampleli">
			<p class="sub-title">Component modifiers</p>
			<Inner on:message={handleMessage}/>
		</div>

		<div class="sampleli">
			<p class="sub-title">DOM event forwarding</p>
			<CustomButton on:click={handleClick3}/>
		</div>

	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>

<style>
	.domevents { width: 100%; height: 100%; }
</style>