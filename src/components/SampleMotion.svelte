<script>
    import { push } from 'svelte-spa-router'
	import { tweened, spring } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	/**
	 * tweend
	 */
	const progress = tweened(0, {
		duration: 400,
		easing: cubicOut
	});

	/**
	 * spring
	 */
	let coords = spring({ x: 50, y: 50 }, {
		stiffness: 0.1,
		damping: 0.25
	});

	let size = spring(10);

</script>

<!-- HTML部 -->
<div class="container">
	<h2 class="h3 mb-3 title">Sample Motion</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Tweened</p>
			<progress value={$progress}></progress>
			<button on:click="{() => progress.set(0)}">0%</button>
			<button on:click="{() => progress.set(0.25)}">25%</button>
			<button on:click="{() => progress.set(0.5)}">50%</button>
			<button on:click="{() => progress.set(0.75)}">75%</button>
			<button on:click="{() => progress.set(1)}">100%</button>
		</div>
	</div>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Spring</p>
			<div style="border: 2px solid #FF3F00; position:relative;">
				<div style="position: absolute; right: 1em; top: 1rem;">
					<label>
						<h3>stiffness ({coords.stiffness})</h3>
						<input bind:value={coords.stiffness} type="range" min="0" max="1" step="0.01">
					</label>
				
					<label>
						<h3>damping ({coords.damping})</h3>
						<input bind:value={coords.damping} type="range" min="0" max="1" step="0.01">
					</label>
				</div>
				<svg
					on:mousemove="{e => coords.set({ x: e.clientX, y: e.clientY })}"
					on:mousedown="{() => size.set(30)}"
					on:mouseup="{() => size.set(10)}"
				>
					<circle cx={$coords.x} cy={$coords.y} r={$size}/>
				</svg>
			</div>
		</div>
	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>

<style>
	/**
	* tweened
	*/
	progress {
		display: block;
		width: 100%;
	}
	/**
	* Spring
	*/
	svg {
		width: 100%;
		height: 50vh;
		margin: -8px;
	}
	circle {
		fill: #ff3e00
	}
</style>