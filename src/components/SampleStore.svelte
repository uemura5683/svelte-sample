<script>
    import { push } from 'svelte-spa-router'
	import { readable, derived, writable } from 'svelte/store';

	/**
	 * Readable stores
	 */
	 export const time = readable(new Date(), function start(set) {
		const interval = setInterval(() => {
			set(new Date());
		}, 1000);

	return function stop() {
			clearInterval(interval);
		};
	});

	 const formatter = new Intl.DateTimeFormat('en', {
		hour12: true,
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit'
	});	 

	/**
	 * Derived stores
	 */
	 export const time2 = readable(new Date(), function start(set) {
		const interval2 = setInterval(() => {
			set(new Date());
		}, 1000);

		return function stop() {
			clearInterval(interval2);
		};
	});

	const start2 = new Date();

	export const elapsed2 = derived(
		time2,
		$time => Math.round(($time2 - start2) / 1000)
	);

	const formatter2 = new Intl.DateTimeFormat('en', {
		hour12: true,
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit'
	});

	/**
	 * Custom stores
	*/
	function createCount() {
		const { subscribe, set, update } = writable(0);

		return {
			subscribe,
			increment: () => update(n => n + 1),
			decrement: () => update(n => n - 1),
			reset: () => set(0)
		};
	}

	export const count = createCount();

	

</script>

<!-- HTML部 -->
<div class="container">
	<h2 class="h3 mb-3 title">Sample Store</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Readable Stores</p>
		</div>
		<h1>The time is {formatter.format($time)}</h1>
	</div>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Derived Stores</p>
		</div>
		<h1>The time is {formatter2.format($time2)}</h1>
		<p>
			This page has been open for
			{$elapsed2} {$elapsed2 === 1 ? 'second' : 'seconds'}
		</p>
	</div>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Custom stores</p>
		</div>
		<h1>The count is {$count}</h1>
		<button on:click={count.increment}>+</button>
		<button on:click={count.decrement}>-</button>
		<button on:click={count.reset}>reset</button>
	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>