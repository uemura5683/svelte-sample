<script>
    import { push } from 'svelte-spa-router'
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
</script>

<!-- HTML部 -->
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
	</div>
	<div on:click={() => push('/')}>TOP</div>
</div>