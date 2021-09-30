<script>
    import { push } from 'svelte-spa-router'
	import Thing from './Thing.svelte';
	/**
	 * hello world
	 */
	let name = 'world';

	/**
	 * HTML tags
	*/
	let string = `here's some <strong>HTML!!!</strong>`;

	/**
	 * Reactive assignments
	*/
	let count = 0;

	function handleClick() {
		count += 1;
	}
	
	/**
	 * Reactive declarations
	*/
	let count2 = 1;

	// the `$:` means 're-run whenever these values change'
	$: doubled = count2 * 2;
	$: quadrupled = doubled * 2;

	function handleClick2() {
		count2 += 1;
	}

	/**
	 * Reactive statements
	*/
	let count3 = 0;

	$: if (count3 >= 10) {
		alert(`count is dangerously high!`);
		count3 = 9;
	}

	function handleClick3() {
		count3 += 1;
	}

	/********************
	* LOGIC
	********************/
	/**
	 * If blocks
	 */
	let user = { loggedIn: false };

	function toggle() {
		user.loggedIn = !user.loggedIn;
	}
	/**
	 * Else-If blocks
	*/
	let leix = 7;
	/**
	 * Each blocks
	*/
	let EachBlockcats = [
		{ id: 'J---aiyznGQ', name: 'Keyboard Cat' },
		{ id: 'z_AbfPXTKms', name: 'Maru' },
		{ id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat' }
	];
	/**
	 * Keyed each blocks
	*/
	let things = [
		{ id: 1, color: 'darkblue' },
		{ id: 2, color: 'indigo' },
		{ id: 3, color: 'deeppink' },
		{ id: 4, color: 'salmon' },
		{ id: 5, color: 'gold' }
	];
	function handleClick4() {
		things = things.slice(1);
	}
	/**
	 * Await blocks
	*/
	let promise = getRandomNumber();

	async function getRandomNumber() {
		const res = await fetch(`tutorial/number.txt`);
		const text = await res.text();

		if (res.ok) {
			return text;
		} else {
			throw new Error(text);
		}
	}
	function handleClick5() {
		promise = getRandomNumber();
	}

</script>
<div class="container">
	<h2 class="h3 mb-3 title">Sample</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Hello World</p>
			<h1 >Hello {name}!</h1>
		</div>
		<div class="sampleli">
			<p class="sub-title">HTML tags</p>
			<p>{@html string}</p>
		</div>
		<div class="sampleli">
			<p class="sub-title">Reactive assignments</p>
			<button on:click={handleClick}>
				Clicked {count} {count === 1 ? 'time' : 'times'}
			</button>
		</div>
		<div class="sampleli">
			<p class="sub-title">Reactive declarations</p>
			<button on:click={handleClick2}>
				Count: {count2}
			</button>
			
			<p>{count2} * 2 = {doubled}</p>
			<p>{doubled} * 2 = {quadrupled}</p>
		</div>
		<div class="sampleli">
			<p class="sub-title">Reactive statements</p>
			<button on:click={handleClick3}>
				Clicked {count3} {count3 === 1 ? 'time' : 'times'}
			</button>
		</div>
		<h2>LOGIC</h2>
		<div class="sampleli">
			<p class="sub-title">If blocks</p>
			{#if user.loggedIn}
			<button on:click={toggle}>
					Log out
				</button>
			{/if}
			
			{#if !user.loggedIn}
				<button on:click={toggle}>
					Log in
				</button>
			{/if}
		</div>
		<div class="sampleli">
			<p class="sub-title">If blocks</p>
			{#if leix > 10}
				<p>{leix} is greater than 10</p>
			{:else if 5 > leix}
				<p>{leix} is less than 5</p>
			{:else}
				<p>{leix} is between 5 and 10</p>
			{/if}
		</div>
		<div class="sampleli">
			<p class="sub-title">Keyed each blocks</p>
			<button on:click={handleClick}>
				Remove first thing
			</button>			
			<div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 1em">
				<div>
					<h4>Keyed</h4>
					{#each things as thing (thing.id)}
						<Thing current={thing.color}/>
					{/each}
				</div>
				<div>
					<h4>Unkeyed</h4>
					{#each things as thing}
						<Thing current={thing.color}/>
					{/each}
				</div>
			</div>
		</div>
		<div class="sampleli">
			<p class="sub-title">Await blocks</p>
			<button on:click={handleClick}>
				generate random number
			</button>
			{#await promise}
				<p>...waiting</p>
			{:then number}
				<p>The number is {number}</p>
			{:catch error}
				<p style="color: red">{error.message}</p>
			{/await}
		</div>
	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>