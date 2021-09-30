<script>
    import Router from 'svelte-spa-router'
    import Home from "./components/Home.svelte";
    import Sample from "./components/Sample.svelte";
    import Events from "./components/SampleEvents.svelte";
    import Bindings from "./components/SampleBindings.svelte";
    import Store from "./components/SampleStore.svelte";    
    import Motion from "./components/SampleMotion.svelte";
    import Trantitions from "./components/SampleTrantitions.svelte";    
    import Svg from "./components/SampleSvg.svelte";    
    import Classes from "./components/SampleClasses.svelte";
    import SpecialElements from "./components/SampleSpecialElements.svelte";
    import Task from "./components/Task.svelte";
    const routes = {
        '/': Home,
        '/sample': Sample,
        '/events': Events,
        '/bindings': Bindings,
        '/motion': Motion,
        '/store': Store,
        '/trantitions': Trantitions,
        '/svg': Svg,
        '/specialelements': SpecialElements,
        '/classes': Classes,
        '/task': Task
    };
</script>

<Router routes={routes}/>