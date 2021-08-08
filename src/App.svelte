<script>
    import Router from 'svelte-spa-router'
    import Home from "./components/Home.svelte";
    import Sample from "./components/Sample.svelte";
    import SampleEvents from "./components/SampleEvents.svelte";
    import SampleBindings from "./components/SampleBindings.svelte";
    import Task from "./components/Task.svelte";

    const routes = {
        '/': Home,
        '/sample': Sample,
        '/sampleevents': SampleEvents,
        '/samplebindings': SampleBindings,
        '/task': Task
    };
</script>

<Router routes={routes}/>