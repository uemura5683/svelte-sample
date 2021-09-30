<script>
    import { push } from 'svelte-spa-router'
	import { fade, fly } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	/**
	 * The transition directive
	*/
	let visible = true;
	
	/**
	 * Adding parameters
	*/
	let add_visible = true

	/**
	 * in and out
	*/
	let inout_visible = true;

	/**
	 * custom css transitions
	*/
	let css_visible = true;

	function spin(node, { duration }) {
		return {
			duration,
			css: t => {
				const eased = elasticOut(t);

				return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);
					color: hsl(
						${~~(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
					);`
			}
		};
	}

	/**
	 * custom js transitions
	*/
	let js_visible = true;
	function typewriter(node, { speed = 5 }) {
		const valid = (
			node.childNodes.length === 1 &&
			node.childNodes[0].nodeType === Node.TEXT_NODE
		);
		if (!valid) {
			throw new Error(`This transition only works on elements with a single text node child`);
		}
		const text = node.textContent;
		const duration = text.length * speed;
		return {
			duration,
			tick: t => {
				const i = ~~(text.length * t);
				node.textContent = text.slice(0, i);
			}
		};
	}

    /**
	 * Transition events
	*/
	let event_visible = true;
	let status = 'waiting...';

</script>
<div class="container">
	<h2 class="h3 mb-3 title">Sample Transitions</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">The transition directive</p>
			<label>
				<input type="checkbox" bind:checked={visible}>
				visible
			</label>
			{#if visible}
				<p transition:fade>
					Fades in and out
				</p>
			{/if}
		</div>
		<div class="sampleli">
			<p class="sub-title">Adding parameters</p>
			<label>
				<input type="checkbox" bind:checked={add_visible}>
				visible
			</label>
			{#if add_visible}
				<p transition:fly="{{ y: 200, duration: 200}}">
					Fades in and out
				</p>
			{/if}
		</div>
		<div class="sampleli">
			<p class="sub-title">In and Out</p>
			<label>
				<input type="checkbox" bind:checked={inout_visible}>
				visible
			</label>
			{#if inout_visible}
				<p in:fly="{{ y: 200, duration: 2000 }}" out:fade>
					Flies in, fades out
				</p>
			{/if}
		</div>
		<div class="sampleli" style="position: relative;">
			<p class="sub-title">Custom css transitions</p>
			<label>
				<input type="checkbox" bind:checked={css_visible}>
				visible
			</label>
			<div class="centered_content css">
				{#if visible}
				<div class="centered" in:spin="{{duration: 8000}}" out:fade>
					<span>transitions!</span>
				</div>
				{/if}
			</div>
		</div>
		<div class="sampleli" style="position: relative;">
			<p class="sub-title">Custom js transitions</p>
			<label>
				<input type="checkbox" bind:checked={js_visible}>
				visible
			</label>
			<div class="centered_content">
				{#if js_visible}
				<p in:typewriter>
					The quick brown fox jumps over the lazy dog
				</p>
				{/if}
			</div>
		</div>
		<div class="sampleli" style="position: relative;">
			<p class="sub-title">Transition events</p>
			<p>status: {status}</p>
			<label>
				<input type="checkbox" bind:checked={event_visible}>
				visible
			</label>
			{#if visible}
				<p
					transition:fly="{{ y: 200, duration: 2000 }}"
					on:introstart="{() => status = 'intro started'}"
					on:outrostart="{() => status = 'outro started'}"
					on:introend="{() => status = 'intro ended'}"
					on:outroend="{() => status = 'outro ended'}"
				>
					Flies in and out
				</p>
			{/if}
		</div>
	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>
<style>
	.centered_content.css {
		height: 200px;
	}
	.centered_content.css .centered {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%,-50%);
	}
	.centered_content.css span {
		position: absolute;
		transform: translate(-50%,-50%);
		font-size: 4em;
	}
</style>