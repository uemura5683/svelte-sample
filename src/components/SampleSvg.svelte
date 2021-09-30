<script>
    import { push } from 'svelte-spa-router'
    import { onMount } from 'svelte';

	/**
	+ clock
	*/
	let time = new Date();

	// these automatically update when `time`
	// changes, because of the `$:` prefix
	$: hours = time.getHours();
	$: minutes = time.getMinutes();
	$: seconds = time.getSeconds();

	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

	/**
	* SVG Transitions
	*/
	import { quintOut } from 'svelte/easing';
	import { fade, draw, fly } from 'svelte/transition';

	export function expand(node, params) {
		const {
			delay = 0,
			duration = 400,
			easing = cubicOut
		} = params;

		const w = parseFloat(getComputedStyle(node).strokeWidth);

		return {
			delay,
			duration,
			easing,
			css: t => `opacity: ${t}; stroke-width: ${t * w}`
		};
	}

	export const inner = `M45.41,108.86A21.81,21.81,0,0,1,22,100.18,20.2,20.2,0,0,1,18.53,84.9a19,19,0,0,1,.65-2.57l.52-1.58,1.41,1a35.32,35.32,0,0,0,10.75,5.37l1,.31-.1,1a6.2,6.2,0,0,0,1.11,4.08A6.57,6.57,0,0,0,41,95.19a6,6,0,0,0,1.68-.74L70.11,76.94a5.76,5.76,0,0,0,2.59-3.83,6.09,6.09,0,0,0-1-4.6,6.58,6.58,0,0,0-7.06-2.62,6.21,6.21,0,0,0-1.69.74L52.43,73.31a19.88,19.88,0,0,1-5.58,2.45,21.82,21.82,0,0,1-23.43-8.68A20.2,20.2,0,0,1,20,51.8a19,19,0,0,1,8.56-12.7L56,21.59a19.88,19.88,0,0,1,5.58-2.45A21.81,21.81,0,0,1,85,27.82,20.2,20.2,0,0,1,88.47,43.1a19,19,0,0,1-.65,2.57l-.52,1.58-1.41-1a35.32,35.32,0,0,0-10.75-5.37l-1-.31.1-1a6.2,6.2,0,0,0-1.11-4.08,6.57,6.57,0,0,0-7.06-2.62,6,6,0,0,0-1.68.74L36.89,51.06a5.71,5.71,0,0,0-2.58,3.83,6,6,0,0,0,1,4.6,6.58,6.58,0,0,0,7.06,2.62,6.21,6.21,0,0,0,1.69-.74l10.48-6.68a19.88,19.88,0,0,1,5.58-2.45,21.82,21.82,0,0,1,23.43,8.68A20.2,20.2,0,0,1,87,76.2a19,19,0,0,1-8.56,12.7L51,106.41a19.88,19.88,0,0,1-5.58,2.45`;
	export const outer = `M65,34 L37,52 A1 1 0 0 0 44 60 L70.5,44.5 A1 1 0 0 0 65,34Z M64,67 L36,85 A1 1 0 0 0 42 94 L68,77.5 A1 1 0 0 0 64,67Z`;

	let visible = true;

</script>
<div class="container">
	<h2 class="h3 mb-3 title">Sample SVG</h2>
	<div class="samplelist">
		<div class="sampleli">
			<p class="sub-title">clock</p>
			<svg class="clock" viewBox='-50 -50 100 100'>
				<circle class='clock-face' r='48'/>
				<!-- markers -->
				{#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
					<line
						class='major'
						y1='35'
						y2='45'
						transform='rotate({30 * minute})'
					/>
					{#each [1, 2, 3, 4] as offset}
						<line
							class='minor'
							y1='42'
							y2='45'
							transform='rotate({6 * (minute + offset)})'
						/>
					{/each}
				{/each}
				<!-- hour hand -->
				<line
					class='hour'
					y1='2'
					y2='-20'
					transform='rotate({30 * hours + minutes / 2})'
				/>
				<!-- minute hand -->
				<line
					class='minute'
					y1='4'
					y2='-30'
					transform='rotate({6 * minutes + seconds / 10})'
				/>
				<!-- second hand -->
				<g transform='rotate({6 * seconds})'>
					<line class='second' y1='10' y2='-38'/>
					<line class='second-counterweight' y1='10' y2='2'/>
				</g>
			</svg>
		</div>
		<div class="sampleli" style="position: relative;">
			<p class="sub-title">SVG Transitions</p>
			<label>
				<input type="checkbox" bind:checked={visible}>
				toggle me
			</label>
			{#if visible}
				<svg class="transitions" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 103 124">
					<g out:fade="{{duration: 200}}" opacity=0.2>
						<path
							in:expand="{{duration: 400, delay: 1000, easing: quintOut}}"
							style="stroke: #ff3e00; fill: #ff3e00; stroke-width: 50;"
							d={outer}
						/>
						<path
							in:draw="{{duration: 1000}}"
							style="stroke:#ff3e00; stroke-width: 1.5"
							d={inner}
						/>
					</g>
				</svg>
			
				<div class="centered" out:fly="{{y: -20, duration: 800}}">
					{#each 'SVELTE' as char, i}
						<span
							in:fade="{{delay: 1000 + i * 150, duration: 800}}"
						>{char}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	<div class="pointer" on:click={() => push('/')}>TOP</div>
</div>
<link href="https://fonts.googleapis.com/css?family=Overpass:100,400" rel="stylesheet">
<style>
/**
* clock
*/
svg.clock {
	width: 100%;
	height: 100%;
}
.clock .clock-face {
	stroke: #333;
	fill: white;
}
.clock .minor {
	stroke: #999;
	stroke-width: 0.5;
}
.clock .major {
	stroke: #333;
	stroke-width: 1;
}
.clock .hour {
	stroke: #333;
}
.clock .minute {
	stroke: #666;
}
.clock .second, .clock .second-counterweight {
	stroke: rgb(180,0,0);
}
.clock .second-counterweight {
	stroke-width: 3;
}
/**
* svg
*/
svg.transitions {
	width: 100%;
	height: 100%;
}
path {
	fill: white;
	opacity: 1;
}
label {
	position: relative;
	top: 0em;
	left: 0em;
}
.centered {
	font-size: 20vw;
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%,-50%);
	font-family: 'Overpass';
	letter-spacing: 0.12em;
	color: #676778;
	font-weight: 400;
}
.centered span {
	will-change: filter;
}
</style>