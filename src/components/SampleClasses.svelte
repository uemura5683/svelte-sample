<script>
    import { push } from 'svelte-spa-router'

    /**
     * The class directive
    */
    let current = 'foo';

	/**
	 * Shorthand class directive
	*/
    let big = false;

</script>
<div class="container">
    <h2 class="h3 mb-3 title">Sample CLASSES</h2>
    <div class="samplelist">
        <div class="sampleli">
            <p class="sub-title">The class directive</p>
            <button
                class:active="{current === 'foo'}"
                on:click="{() => current = 'foo'}"
            >
                foo
            </button>
            <button
                class:active="{current === 'bar'}"
                on:click="{() => current = 'bar'}"
            >
                bar
            </button>
            <button
                class:active="{current === 'baz'}"
                on:click="{() => current = 'baz'}"
            >
                baz
            </button>
        </div>
        <div class="sampleli">
            <p class="sub-title">Shorthand class directive</p>
			<label>
				<input type=checkbox bind:checked={big}>
				big
			</label>
			
			<div class:big>
				some {big ? 'big' : 'small'} text
			</div>
        </div>
	</div>
    <div class="pointer" on:click={() => push('/')}>TOP</div>
</div>
<style>
    /**
     * The class directive
    */
	.active {
		background-color: #ff3e00;
		color: white;
	}
	/**
	 * Shorthand class directive
	*/
	.big {
		font-size: 4em;
	}
</style>