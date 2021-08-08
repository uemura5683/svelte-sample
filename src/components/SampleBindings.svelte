<script>
    import { push } from 'svelte-spa-router'
	
	/**
	 * Text inputs
	*/
	let name = '';

    /**
     * Nemueric inputs
    */
   let a = 1, b = 2;

    /**
     * Checkbox inputs
    */
   let yes = false;

    /**
     * Group inputs
    */
   let scoops = 1, flavours = ['Mint choc chip'], menu = ['Cookies and cream', 'Mint choc chip', 'Raspberry ripple'];
   function join(flavours) {
		if (flavours.length === 1) return flavours[0];
		return `${flavours.slice(0, -1).join(', ')} and ${flavours[flavours.length - 1]}`;
	}

    /**
     * Textarea inputs
    */
    /*
	import marked from 'marked';
	let text = `Some words are *italic*, some are **bold**`;
    */

    /**
     * file inputs
    */
	let files;

	$: if (files) {
		// Note that `files` is of type `FileList`, not an Array:
		// https://developer.mozilla.org/en-US/docs/Web/API/FileList
		console.log(files);

		for (const file of files) {
			console.log(`${file.name}: ${file.size} bytes`);
		}
	}

</script>

<!-- HTML部 -->
<div class="container">
	<h2 class="h3 mb-3 title">Sample BIGINGS</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">Text inputs</p>
            <input bind:value={name} placeholder="enter your name">
            <p>Hello {name || 'user'}</p>
		</div>

        <div class="samplelist">
            <div class="sampleli">
                <p class="sub-title">Numeric inputs</p>
                <label>
                    <input type=nubmber bind:value={a} min=0 max=10 />
                    <input type=range bind:value={a} min=0 max=10 />
                </label>
                <label>
                    <input type=nubmber bind:value={b} min=0 max=10 />
                    <input type=range bind:value={b} min=0 max=10 />
                </label>
                <p> {a} + {b} = {a + b}</p>
            </div>
        </div>

		<div class="sampleli">
			<p class="sub-title">Checkbox Inputs</p>
            <label>
                <input type=checkbox bind:checked={yes}>
                Yes! Send me regular email spam
            </label>
            {#if yes}
                <p>Thank you. We will bombard your inbox and sell your personal details.</p>
            {:else}
                <p>You must opt in to continue. If you're not paying, you're the product.</p>
            {/if}
            <button disabled={!yes}>
                Subscribe
            </button>
		</div>

		<div class="sampleli">
			<p class="sub-title">Group Inputs</p>
            <h4>Size</h4>

            <label>
                <input type=radio bind:group={scoops} value={1}>
                One scoop
            </label>
            
            <label>
                <input type=radio bind:group={scoops} value={2}>
                Two scoops
            </label>
            
            <label>
                <input type=radio bind:group={scoops} value={3}>
                Three scoops
            </label>
            
            <h4 class="mt-2">Flavours</h4>
            
            {#each menu as flavour}
                <label>
                    <input type=checkbox bind:group={flavours} value={flavour}>
                    {flavour}
                </label>
            {/each}
            
            {#if flavours.length === 0}
                <p>Please select at least one flavour</p>
            {:else if flavours.length > scoops}
                <p>Can't order more flavours than scoops!</p>
            {:else}
                <p>
                    You ordered {scoops} {scoops === 1 ? 'scoop' : 'scoops'}
                    of {join(flavours)}
                </p>
            {/if}
        </div>

        <!--
		<div class="sampleli">
			<p class="sub-title">Textarea Inputs</p>
            <textarea bind:value={text}></textarea>
            {@html marked(text)}
        </div>
        -->

		<div class="sampleli">
			<p class="sub-title">File Inputs</p>
            <label for="avatar">Upload a picture:</label>
            <input
                accept="image/png, image/jpeg"
                bind:files
                id="avatar"
                name="avatar"
                type="file"
            />
            
            <label for="many">Upload multiple files of any type:</label>
            <input
                bind:files
                id="many"
                multiple
                type="file"
            />
            
            {#if files}
                <h4 class="mt-2">Selected files:</h4>
                {#each Array.from(files) as file}
                    <p>{file.name} ({file.size} bytes) </p>
                {/each}
            {/if}
        </div>

    </div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>

<style>
	.domevents { width: 100%; height: 100%; }
    textarea { width: 100%; height: 200px; }
</style>