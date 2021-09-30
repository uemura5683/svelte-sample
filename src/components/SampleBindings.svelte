<script>
    import { push } from 'svelte-spa-router'
	
    /**
     * no learn
     * Media elements, Dimensions, Dimensions, bind:this={canvas}, Component bindings
     */

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
   function join2(flavours) {
		if (flavours.length === 1) return flavours[0];
		return `${flavours.slice(0, -1).join2(', ')} and ${flavours[flavours.length - 1]}`;
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

    /**
     * Select bindings
    */
	let questions = [
		{ id: 1, text: `Where did you go to school?` },
		{ id: 2, text: `What is your mother's name?` },
		{ id: 3, text: `What is another personal fact that an attacker could easily find with Google?` }
	];
    let selected;
    let answer = '';

	function handleSubmit() {
		console.log(`answered question ${selected.id} (${selected.text}) with "${answer}"`);
	}

    /**
     * Select multiple
    */
	let scoops2 = 1;
	let flavours2 = ['Mint choc chip'];

	let menu2 = [
		'Cookies and cream',
		'Mint choc chip',
		'Raspberry ripple'
	];

	function join(flavours2) {
		if (flavours.length === 1) return flavours2[0];
		return `${flavours2.slice(0, -1).join(', ')} and ${flavours2[flavours2.length - 1]}`;
	}

    /**
     * Each block bindings
    */
	let todos_bind = [
		{ done_bind: false, text_bind: 'finish Svelte tutorial' },
		{ done_bind: false, text_bind: 'build an app' },
		{ done_bind: false, text_bind: 'world domination' }
	];

	function add_bind() {
		todos_bind = todos_bind.concat({ done_bind: false, text_bind: '' });
	}

	function clear_bind() {
		todos_bind = todos_bind.filter(t => !t.done_bind);
	}

	$: remaining_bind = todos_bind.filter(t => !t.done_bind).length;

</script>
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
                <input type=radio bind:group={scoops2} value={1}>
                One scoop
            </label>
            <label>
                <input type=radio bind:group={scoops2} value={2}>
                Two scoops
            </label>
            <label>
                <input type=radio bind:group={scoops2} value={3}>
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
                    of {join2(flavours)}
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
        <div class="sampleli">
			<p class="sub-title">Insecurity questions</p>
            <form on:submit|preventDefault={handleSubmit}>
                <select bind:value={selected} on:change="{() => answer = ''}">
                    {#each questions as question}
                        <option value={question}>
                            {question.text}
                        </option>
                    {/each}
                </select>
                <input bind:value={answer}>
                <button disabled={!answer} type=submit>
                    Submit
                </button>
            </form>
        </div>
        <div class="sampleli">
			<p class="sub-title">Size</p>
            <label>
                <input type=radio bind:group={scoops2} value={1}>
                One scoop
            </label>
            
            <label>
                <input type=radio bind:group={scoops2} value={2}>
                Two scoops
            </label>
            
            <label>
                <input type=radio bind:group={scoops2} value={3}>
                Three scoops
            </label>
            <h4 class="mt-2">Flavours</h4>
            <select multiple bind:value={flavours2}>
                {#each menu2 as flavour}
                    <option value={flavour}>
                        {flavour}
                    </option>
                {/each}
            </select>
            {#if flavours2.length === 0}
                <p>Please select at least one flavour</p>
            {:else if flavours2.length > scoops2}
                <p>Can't order more flavours than scoops!</p>
            {:else}
                <p>
                    You ordered {scoops2} {scoops2 === 1 ? 'scoop' : 'scoops'}
                    of {join(flavours2)}
                </p>
            {/if}
        </div>
        <div class="sampleli">
			<p class="sub-title">Todos</p>
            {#each todos_bind as todo_bind}
                <div>
                    <input
                        type=checkbox
                        bind:checked={todo_bind.done_bind}
                    >
                    <input
                        placeholder="What needs to be done?"
                        bind:value={todo_bind.text_bind}
                        disabled={todo_bind.done_bind}
                    >
                </div>
            {/each}
            <p>{remaining_bind} remaining</p>
            <button on:click={add_bind}>
                Add new
            </button>
            <button on:click={clear_bind}>
                Clear completed
            </button>
        </div>
    </div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>
<style>
	.domevents {
        width: 100%;
        height: 100%;
    }
    textarea {
        width: 100%;
        height: 200px;
    }
</style>