<script>
    import Router from 'svelte-spa-router'
    import Home from "./components/Home.svelte";
    import Sample from "./components/Sample.svelte";
    import SampleEvents from "./components/SampleEvents.svelte";
    import SampleBindings from "./components/SampleBindings.svelte";
    import SampleStore from "./components/SampleStore.svelte";    
    import SampleMotion from "./components/SampleMotion.svelte";
    import SampleTrantitions from "./components/SampleTrantitions.svelte";    
    import SampleSvg from "./components/SampleSvg.svelte";    
    import SampleClasses from "./components/SampleClasses.svelte";
    import SampleSpecialElements from "./components/SampleSpecialElements.svelte";
    import Task from "./components/Task.svelte";

    const routes = {
        '/': Home,
        '/sample': Sample,
        '/sampleevents': SampleEvents,
        '/samplebindings': SampleBindings,
        '/saaplemotion': SampleMotion,
        '/samplestore': SampleStore,
        '/sampletrantitions': SampleTrantitions,
        '/samplesvg': SampleSvg,
        '/samplespecialelements': SampleSpecialElements,
        '/sampleclasses': SampleClasses,
        '/task': Task
    };
</script>

<Router routes={routes}/>