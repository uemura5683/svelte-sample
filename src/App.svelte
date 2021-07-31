<script>
    import Router from 'svelte-spa-router'
    import Home from "./components/Home.svelte";
    import Sample from "./components/Sample.svelte";
	import Task from "./components/Task.svelte";

    const routes = {
        '/': Home,
        '/sample': Sample,
		'/task': Task
    };
</script>

<Router routes={routes}/>