<script>
    import Router from 'svelte-spa-router'
    import Home from "./components/Home.svelte";
    import Hello from "./components/Hello.svelte";
	import Task from "./components/Task.svelte";

    const routes = {
        '/': Home,
        '/hello': Hello,
		'/task': Task
    };
</script>

<Router routes={routes}/>