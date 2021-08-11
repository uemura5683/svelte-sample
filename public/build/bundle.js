
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function get_binding_group_value(group, __value, checked) {
        const value = new Set();
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.add(group[i].__value);
        }
        if (!checked) {
            value.delete(__value);
        }
        return Array.from(value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function select_multiple_value(select) {
        return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.42.1 */

    const { Error: Error_1$1, Object: Object_1, console: console_1$1 } = globals;

    // (251:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get routes() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Home.svelte generated by Svelte v3.42.1 */
    const file$a = "src/components/Home.svelte";

    function create_fragment$b(ctx) {
    	let div8;
    	let h2;
    	let t1;
    	let div7;
    	let div0;
    	let t3;
    	let div1;
    	let t5;
    	let div2;
    	let t7;
    	let div3;
    	let t9;
    	let div4;
    	let t11;
    	let div5;
    	let t13;
    	let div6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			h2 = element("h2");
    			h2.textContent = "SVELTE";
    			t1 = space();
    			div7 = element("div");
    			div0 = element("div");
    			div0.textContent = "Sample";
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "SampleEvents";
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "SampleBindings";
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "SampleMotion";
    			t9 = space();
    			div4 = element("div");
    			div4.textContent = "SampleStore";
    			t11 = space();
    			div5 = element("div");
    			div5.textContent = "SampleTrantitions";
    			t13 = space();
    			div6 = element("div");
    			div6.textContent = "Task";
    			attr_dev(h2, "class", "h3 mb-3 title");
    			add_location(h2, file$a, 5, 1, 96);
    			attr_dev(div0, "class", "col-4 mb-2 pointer");
    			add_location(div0, file$a, 7, 2, 155);
    			attr_dev(div1, "class", "col-4 mb-2 pointer");
    			add_location(div1, file$a, 8, 2, 235);
    			attr_dev(div2, "class", "col-4 mb-2 pointer");
    			add_location(div2, file$a, 9, 2, 327);
    			attr_dev(div3, "class", "col-4 mb-2 pointer");
    			add_location(div3, file$a, 10, 2, 423);
    			attr_dev(div4, "class", "col-4 mb-2 pointer");
    			add_location(div4, file$a, 11, 2, 515);
    			attr_dev(div5, "class", "col-4 mb-2 pointer");
    			add_location(div5, file$a, 12, 2, 605);
    			attr_dev(div6, "class", "col-4 mb-2 pointer");
    			add_location(div6, file$a, 13, 2, 709);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$a, 6, 1, 135);
    			attr_dev(div8, "class", "container hello");
    			add_location(div8, file$a, 4, 0, 65);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, h2);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div7, t3);
    			append_dev(div7, div1);
    			append_dev(div7, t5);
    			append_dev(div7, div2);
    			append_dev(div7, t7);
    			append_dev(div7, div3);
    			append_dev(div7, t9);
    			append_dev(div7, div4);
    			append_dev(div7, t11);
    			append_dev(div7, div5);
    			append_dev(div7, t13);
    			append_dev(div7, div6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[1], false, false, false),
    					listen_dev(div2, "click", /*click_handler_2*/ ctx[2], false, false, false),
    					listen_dev(div3, "click", /*click_handler_3*/ ctx[3], false, false, false),
    					listen_dev(div4, "click", /*click_handler_4*/ ctx[4], false, false, false),
    					listen_dev(div5, "click", /*click_handler_5*/ ctx[5], false, false, false),
    					listen_dev(div6, "click", /*click_handler_6*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/sample');
    	const click_handler_1 = () => push('/sampleevents');
    	const click_handler_2 = () => push('/samplebindings');
    	const click_handler_3 = () => push('/saaplemotion');
    	const click_handler_4 = () => push('/samplestore');
    	const click_handler_5 = () => push('/sampletrantitions');
    	const click_handler_6 = () => push('/task');
    	$$self.$capture_state = () => ({ push });

    	return [
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Thing.svelte generated by Svelte v3.42.1 */

    const file$9 = "src/components/Thing.svelte";

    function create_fragment$a(ctx) {
    	let p;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span0 = element("span");
    			t0 = text("initial");
    			t1 = space();
    			span1 = element("span");
    			t2 = text("current");
    			set_style(span0, "background-color", /*initial*/ ctx[1]);
    			attr_dev(span0, "class", "svelte-dgndg6");
    			add_location(span0, file$9, 9, 1, 183);
    			set_style(span1, "background-color", /*current*/ ctx[0]);
    			attr_dev(span1, "class", "svelte-dgndg6");
    			add_location(span1, file$9, 10, 1, 241);
    			add_location(p, file$9, 8, 0, 178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span0);
    			append_dev(span0, t0);
    			append_dev(p, t1);
    			append_dev(p, span1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*current*/ 1) {
    				set_style(span1, "background-color", /*current*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Thing', slots, []);
    	let { current } = $$props;

    	// ...but `initial` is fixed upon initialisation
    	const initial = current;

    	const writable_props = ['current'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Thing> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('current' in $$props) $$invalidate(0, current = $$props.current);
    	};

    	$$self.$capture_state = () => ({ current, initial });

    	$$self.$inject_state = $$props => {
    		if ('current' in $$props) $$invalidate(0, current = $$props.current);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [current, initial];
    }

    class Thing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { current: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Thing",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*current*/ ctx[0] === undefined && !('current' in props)) {
    			console.warn("<Thing> was created without expected prop 'current'");
    		}
    	}

    	get current() {
    		throw new Error("<Thing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set current(value) {
    		throw new Error("<Thing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Sample.svelte generated by Svelte v3.42.1 */

    const { Error: Error_1 } = globals;
    const file$8 = "src/components/Sample.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (143:3) {#if user.loggedIn}
    function create_if_block_3$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Log out";
    			add_location(button, file$8, 143, 3, 2714);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggle*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(143:3) {#if user.loggedIn}",
    		ctx
    	});

    	return block;
    }

    // (149:3) {#if !user.loggedIn}
    function create_if_block_2$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Log in";
    			add_location(button, file$8, 149, 4, 2809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggle*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(149:3) {#if !user.loggedIn}",
    		ctx
    	});

    	return block;
    }

    // (161:3) {:else}
    function create_else_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `${/*leix*/ ctx[14]} is between 5 and 10`;
    			add_location(p, file$8, 161, 4, 3070);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(161:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (159:22) 
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `${/*leix*/ ctx[14]} is less than 5`;
    			add_location(p, file$8, 159, 4, 3026);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(159:22) ",
    		ctx
    	});

    	return block;
    }

    // (157:3) {#if leix > 10}
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `${/*leix*/ ctx[14]} is greater than 10`;
    			add_location(p, file$8, 157, 4, 2966);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(157:3) {#if leix > 10}",
    		ctx
    	});

    	return block;
    }

    // (173:5) {#each things as thing (thing.id)}
    function create_each_block_1$1(key_1, ctx) {
    	let first;
    	let thing;
    	let current;

    	thing = new Thing({
    			props: { current: /*thing*/ ctx[21].color },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(thing.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(thing, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const thing_changes = {};
    			if (dirty & /*things*/ 32) thing_changes.current = /*thing*/ ctx[21].color;
    			thing.$set(thing_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(thing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(173:5) {#each things as thing (thing.id)}",
    		ctx
    	});

    	return block;
    }

    // (179:5) {#each things as thing}
    function create_each_block$2(ctx) {
    	let thing;
    	let current;

    	thing = new Thing({
    			props: { current: /*thing*/ ctx[21].color },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(thing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(thing, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const thing_changes = {};
    			if (dirty & /*things*/ 32) thing_changes.current = /*thing*/ ctx[21].color;
    			thing.$set(thing_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(thing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(thing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(thing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(179:5) {#each things as thing}",
    		ctx
    	});

    	return block;
    }

    // (194:3) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[20].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$8, 194, 4, 3874);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 64 && t_value !== (t_value = /*error*/ ctx[20].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(194:3) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (192:3) {:then number}
    function create_then_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*number*/ ctx[19] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("The number is ");
    			t1 = text(t1_value);
    			add_location(p, file$8, 192, 4, 3822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 64 && t1_value !== (t1_value = /*number*/ ctx[19] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(192:3) {:then number}",
    		ctx
    	});

    	return block;
    }

    // (190:19)      <p>...waiting</p>    {:then number}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "...waiting";
    			add_location(p, file$8, 190, 4, 3782);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(190:19)      <p>...waiting</p>    {:then number}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div14;
    	let h20;
    	let t1;
    	let div12;
    	let div0;
    	let p0;
    	let t3;
    	let h1;
    	let t7;
    	let div1;
    	let p1;
    	let t9;
    	let p2;
    	let t10;
    	let div2;
    	let p3;
    	let t12;
    	let button0;
    	let t13;
    	let t14;
    	let t15;
    	let t16_value = (/*count*/ ctx[3] === 1 ? 'time' : 'times') + "";
    	let t16;
    	let t17;
    	let div3;
    	let p4;
    	let t19;
    	let button1;
    	let t20;
    	let t21;
    	let t22;
    	let p5;
    	let t23;
    	let t24;
    	let t25;
    	let t26;
    	let p6;
    	let t27;
    	let t28;
    	let t29;
    	let t30;
    	let div4;
    	let p7;
    	let t32;
    	let button2;
    	let t33;
    	let t34;
    	let t35;
    	let t36_value = (/*count3*/ ctx[1] === 1 ? 'time' : 'times') + "";
    	let t36;
    	let t37;
    	let h21;
    	let t39;
    	let div5;
    	let p8;
    	let t41;
    	let t42;
    	let t43;
    	let div6;
    	let p9;
    	let t45;
    	let t46;
    	let div10;
    	let p10;
    	let t48;
    	let button3;
    	let t50;
    	let div9;
    	let div7;
    	let h40;
    	let t52;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t53;
    	let div8;
    	let h41;
    	let t55;
    	let t56;
    	let div11;
    	let p11;
    	let t58;
    	let button4;
    	let t60;
    	let promise_1;
    	let t61;
    	let div13;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*user*/ ctx[4].loggedIn && create_if_block_3$1(ctx);
    	let if_block1 = !/*user*/ ctx[4].loggedIn && create_if_block_2$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*leix*/ ctx[14] > 10) return create_if_block$1;
    		if (5 > /*leix*/ ctx[14]) return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block2 = current_block_type(ctx);
    	let each_value_1 = /*things*/ ctx[5];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*thing*/ ctx[21].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$1(key, child_ctx));
    	}

    	let each_value = /*things*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 19,
    		error: 20
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[6], info);

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Sample";
    			t1 = space();
    			div12 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Hello World";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = `Hello ${/*name*/ ctx[8]}!`;
    			t7 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "HTML tags";
    			t9 = space();
    			p2 = element("p");
    			t10 = space();
    			div2 = element("div");
    			p3 = element("p");
    			p3.textContent = "Reactive assignments";
    			t12 = space();
    			button0 = element("button");
    			t13 = text("Clicked ");
    			t14 = text(/*count*/ ctx[3]);
    			t15 = space();
    			t16 = text(t16_value);
    			t17 = space();
    			div3 = element("div");
    			p4 = element("p");
    			p4.textContent = "Reactive declarations";
    			t19 = space();
    			button1 = element("button");
    			t20 = text("Count: ");
    			t21 = text(/*count2*/ ctx[0]);
    			t22 = space();
    			p5 = element("p");
    			t23 = text(/*count2*/ ctx[0]);
    			t24 = text(" * 2 = ");
    			t25 = text(/*doubled*/ ctx[2]);
    			t26 = space();
    			p6 = element("p");
    			t27 = text(/*doubled*/ ctx[2]);
    			t28 = text(" * 2 = ");
    			t29 = text(/*quadrupled*/ ctx[7]);
    			t30 = space();
    			div4 = element("div");
    			p7 = element("p");
    			p7.textContent = "Reactive statements";
    			t32 = space();
    			button2 = element("button");
    			t33 = text("Clicked ");
    			t34 = text(/*count3*/ ctx[1]);
    			t35 = space();
    			t36 = text(t36_value);
    			t37 = space();
    			h21 = element("h2");
    			h21.textContent = "LOGIC";
    			t39 = space();
    			div5 = element("div");
    			p8 = element("p");
    			p8.textContent = "If blocks";
    			t41 = space();
    			if (if_block0) if_block0.c();
    			t42 = space();
    			if (if_block1) if_block1.c();
    			t43 = space();
    			div6 = element("div");
    			p9 = element("p");
    			p9.textContent = "If blocks";
    			t45 = space();
    			if_block2.c();
    			t46 = space();
    			div10 = element("div");
    			p10 = element("p");
    			p10.textContent = "Keyed each blocks";
    			t48 = space();
    			button3 = element("button");
    			button3.textContent = "Remove first thing";
    			t50 = space();
    			div9 = element("div");
    			div7 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Keyed";
    			t52 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t53 = space();
    			div8 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Unkeyed";
    			t55 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t56 = space();
    			div11 = element("div");
    			p11 = element("p");
    			p11.textContent = "Await blocks";
    			t58 = space();
    			button4 = element("button");
    			button4.textContent = "generate random number";
    			t60 = space();
    			info.block.c();
    			t61 = space();
    			div13 = element("div");
    			div13.textContent = "TOP";
    			attr_dev(h20, "class", "h3 mb-3 title");
    			add_location(h20, file$8, 108, 1, 1745);
    			attr_dev(p0, "class", "sub-title");
    			add_location(p0, file$8, 111, 3, 1837);
    			add_location(h1, file$8, 112, 3, 1877);
    			attr_dev(div0, "class", "sampleli");
    			add_location(div0, file$8, 110, 2, 1811);
    			attr_dev(p1, "class", "sub-title");
    			add_location(p1, file$8, 115, 3, 1938);
    			add_location(p2, file$8, 116, 3, 1976);
    			attr_dev(div1, "class", "sampleli");
    			add_location(div1, file$8, 114, 2, 1912);
    			attr_dev(p3, "class", "sub-title");
    			add_location(p3, file$8, 119, 3, 2035);
    			add_location(button0, file$8, 120, 3, 2084);
    			attr_dev(div2, "class", "sampleli");
    			add_location(div2, file$8, 118, 2, 2009);
    			attr_dev(p4, "class", "sub-title");
    			add_location(p4, file$8, 125, 3, 2219);
    			add_location(button1, file$8, 126, 3, 2269);
    			add_location(p5, file$8, 130, 3, 2342);
    			add_location(p6, file$8, 131, 3, 2377);
    			attr_dev(div3, "class", "sampleli");
    			add_location(div3, file$8, 124, 2, 2193);
    			attr_dev(p7, "class", "sub-title");
    			add_location(p7, file$8, 134, 3, 2450);
    			add_location(button2, file$8, 135, 3, 2498);
    			attr_dev(div4, "class", "sampleli");
    			add_location(div4, file$8, 133, 2, 2424);
    			add_location(h21, file$8, 139, 2, 2610);
    			attr_dev(p8, "class", "sub-title");
    			add_location(p8, file$8, 141, 3, 2653);
    			attr_dev(div5, "class", "sampleli");
    			add_location(div5, file$8, 140, 2, 2627);
    			attr_dev(p9, "class", "sub-title");
    			add_location(p9, file$8, 155, 3, 2908);
    			attr_dev(div6, "class", "sampleli");
    			add_location(div6, file$8, 154, 2, 2882);
    			attr_dev(p10, "class", "sub-title");
    			add_location(p10, file$8, 165, 3, 3150);
    			add_location(button3, file$8, 166, 3, 3196);
    			add_location(h40, file$8, 171, 5, 3360);
    			add_location(div7, file$8, 170, 4, 3349);
    			add_location(h41, file$8, 177, 5, 3491);
    			add_location(div8, file$8, 176, 4, 3480);
    			set_style(div9, "display", "grid");
    			set_style(div9, "grid-template-columns", "1fr 1fr");
    			set_style(div9, "grid-gap", "1em");
    			add_location(div9, file$8, 169, 3, 3270);
    			attr_dev(div10, "class", "sampleli");
    			add_location(div10, file$8, 164, 2, 3124);
    			attr_dev(p11, "class", "sub-title");
    			add_location(p11, file$8, 185, 3, 3645);
    			add_location(button4, file$8, 186, 3, 3686);
    			attr_dev(div11, "class", "sampleli");
    			add_location(div11, file$8, 184, 2, 3619);
    			attr_dev(div12, "class", "samplelist");
    			add_location(div12, file$8, 109, 1, 1784);
    			attr_dev(div13, "class", "pointer");
    			add_location(div13, file$8, 198, 1, 3946);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file$8, 107, 0, 1720);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, h20);
    			append_dev(div14, t1);
    			append_dev(div14, div12);
    			append_dev(div12, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, h1);
    			append_dev(div12, t7);
    			append_dev(div12, div1);
    			append_dev(div1, p1);
    			append_dev(div1, t9);
    			append_dev(div1, p2);
    			p2.innerHTML = /*string*/ ctx[9];
    			append_dev(div12, t10);
    			append_dev(div12, div2);
    			append_dev(div2, p3);
    			append_dev(div2, t12);
    			append_dev(div2, button0);
    			append_dev(button0, t13);
    			append_dev(button0, t14);
    			append_dev(button0, t15);
    			append_dev(button0, t16);
    			append_dev(div12, t17);
    			append_dev(div12, div3);
    			append_dev(div3, p4);
    			append_dev(div3, t19);
    			append_dev(div3, button1);
    			append_dev(button1, t20);
    			append_dev(button1, t21);
    			append_dev(div3, t22);
    			append_dev(div3, p5);
    			append_dev(p5, t23);
    			append_dev(p5, t24);
    			append_dev(p5, t25);
    			append_dev(div3, t26);
    			append_dev(div3, p6);
    			append_dev(p6, t27);
    			append_dev(p6, t28);
    			append_dev(p6, t29);
    			append_dev(div12, t30);
    			append_dev(div12, div4);
    			append_dev(div4, p7);
    			append_dev(div4, t32);
    			append_dev(div4, button2);
    			append_dev(button2, t33);
    			append_dev(button2, t34);
    			append_dev(button2, t35);
    			append_dev(button2, t36);
    			append_dev(div12, t37);
    			append_dev(div12, h21);
    			append_dev(div12, t39);
    			append_dev(div12, div5);
    			append_dev(div5, p8);
    			append_dev(div5, t41);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t42);
    			if (if_block1) if_block1.m(div5, null);
    			append_dev(div12, t43);
    			append_dev(div12, div6);
    			append_dev(div6, p9);
    			append_dev(div6, t45);
    			if_block2.m(div6, null);
    			append_dev(div12, t46);
    			append_dev(div12, div10);
    			append_dev(div10, p10);
    			append_dev(div10, t48);
    			append_dev(div10, button3);
    			append_dev(div10, t50);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			append_dev(div7, h40);
    			append_dev(div7, t52);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div7, null);
    			}

    			append_dev(div9, t53);
    			append_dev(div9, div8);
    			append_dev(div8, h41);
    			append_dev(div8, t55);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div8, null);
    			}

    			append_dev(div12, t56);
    			append_dev(div12, div11);
    			append_dev(div11, p11);
    			append_dev(div11, t58);
    			append_dev(div11, button4);
    			append_dev(div11, t60);
    			info.block.m(div11, info.anchor = null);
    			info.mount = () => div11;
    			info.anchor = null;
    			append_dev(div14, t61);
    			append_dev(div14, div13);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleClick*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*handleClick2*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*handleClick3*/ ctx[12], false, false, false),
    					listen_dev(button3, "click", /*handleClick*/ ctx[10], false, false, false),
    					listen_dev(button4, "click", /*handleClick*/ ctx[10], false, false, false),
    					listen_dev(div13, "click", /*click_handler*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (!current || dirty & /*count*/ 8) set_data_dev(t14, /*count*/ ctx[3]);
    			if ((!current || dirty & /*count*/ 8) && t16_value !== (t16_value = (/*count*/ ctx[3] === 1 ? 'time' : 'times') + "")) set_data_dev(t16, t16_value);
    			if (!current || dirty & /*count2*/ 1) set_data_dev(t21, /*count2*/ ctx[0]);
    			if (!current || dirty & /*count2*/ 1) set_data_dev(t23, /*count2*/ ctx[0]);
    			if (!current || dirty & /*doubled*/ 4) set_data_dev(t25, /*doubled*/ ctx[2]);
    			if (!current || dirty & /*doubled*/ 4) set_data_dev(t27, /*doubled*/ ctx[2]);
    			if (!current || dirty & /*quadrupled*/ 128) set_data_dev(t29, /*quadrupled*/ ctx[7]);
    			if (!current || dirty & /*count3*/ 2) set_data_dev(t34, /*count3*/ ctx[1]);
    			if ((!current || dirty & /*count3*/ 2) && t36_value !== (t36_value = (/*count3*/ ctx[1] === 1 ? 'time' : 'times') + "")) set_data_dev(t36, t36_value);

    			if (/*user*/ ctx[4].loggedIn) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(div5, t42);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*user*/ ctx[4].loggedIn) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(div5, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if_block2.p(ctx, dirty);

    			if (dirty & /*things*/ 32) {
    				each_value_1 = /*things*/ ctx[5];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div7, outro_and_destroy_block, create_each_block_1$1, null, get_each_context_1$1);
    				check_outros();
    			}

    			if (dirty & /*things*/ 32) {
    				each_value = /*things*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div8, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			info.ctx = ctx;

    			if (dirty & /*promise*/ 64 && promise_1 !== (promise_1 = /*promise*/ ctx[6]) && handle_promise(promise_1, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			destroy_each(each_blocks, detaching);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function getRandomNumber() {
    	const res = await fetch(`tutorial/number.txt`);
    	const text = await res.text();

    	if (res.ok) {
    		return text;
    	} else {
    		throw new Error(text);
    	}
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let doubled;
    	let quadrupled;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sample', slots, []);
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
    		$$invalidate(3, count += 1);
    	}

    	/**
     * Reactive declarations
    */
    	let count2 = 1;

    	function handleClick2() {
    		$$invalidate(0, count2 += 1);
    	}

    	/**
     * Reactive statements
    */
    	let count3 = 0;

    	function handleClick3() {
    		$$invalidate(1, count3 += 1);
    	}

    	/********************
    * LOGIC
    ********************/
    	/**
     * If blocks
     */
    	let user = { loggedIn: false };

    	function toggle() {
    		$$invalidate(4, user.loggedIn = !user.loggedIn, user);
    	}

    	/**
     * Else-If blocks
    */
    	let leix = 7;

    	/**
     * Each blocks
    */
    	let EachBlockcats = [
    		{ id: 'J---aiyznGQ', name: 'Keyboard Cat' },
    		{ id: 'z_AbfPXTKms', name: 'Maru' },
    		{
    			id: 'OUtn3pvWmpg',
    			name: 'Henri The Existential Cat'
    		}
    	];

    	/**
     * Keyed each blocks
    */
    	let things = [
    		{ id: 1, color: 'darkblue' },
    		{ id: 2, color: 'indigo' },
    		{ id: 3, color: 'deeppink' },
    		{ id: 4, color: 'salmon' },
    		{ id: 5, color: 'gold' }
    	];

    	function handleClick4() {
    		$$invalidate(5, things = things.slice(1));
    	}

    	/**
     * Await blocks
    */
    	let promise = getRandomNumber();

    	function handleClick5() {
    		$$invalidate(6, promise = getRandomNumber());
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sample> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/');

    	$$self.$capture_state = () => ({
    		push,
    		Thing,
    		name,
    		string,
    		count,
    		handleClick,
    		count2,
    		handleClick2,
    		count3,
    		handleClick3,
    		user,
    		toggle,
    		leix,
    		EachBlockcats,
    		things,
    		handleClick4,
    		promise,
    		getRandomNumber,
    		handleClick5,
    		doubled,
    		quadrupled
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(8, name = $$props.name);
    		if ('string' in $$props) $$invalidate(9, string = $$props.string);
    		if ('count' in $$props) $$invalidate(3, count = $$props.count);
    		if ('count2' in $$props) $$invalidate(0, count2 = $$props.count2);
    		if ('count3' in $$props) $$invalidate(1, count3 = $$props.count3);
    		if ('user' in $$props) $$invalidate(4, user = $$props.user);
    		if ('leix' in $$props) $$invalidate(14, leix = $$props.leix);
    		if ('EachBlockcats' in $$props) EachBlockcats = $$props.EachBlockcats;
    		if ('things' in $$props) $$invalidate(5, things = $$props.things);
    		if ('promise' in $$props) $$invalidate(6, promise = $$props.promise);
    		if ('doubled' in $$props) $$invalidate(2, doubled = $$props.doubled);
    		if ('quadrupled' in $$props) $$invalidate(7, quadrupled = $$props.quadrupled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*count2*/ 1) {
    			// the `$:` means 're-run whenever these values change'
    			$$invalidate(2, doubled = count2 * 2);
    		}

    		if ($$self.$$.dirty & /*doubled*/ 4) {
    			$$invalidate(7, quadrupled = doubled * 2);
    		}

    		if ($$self.$$.dirty & /*count3*/ 2) {
    			if (count3 >= 10) {
    				alert(`count is dangerously high!`);
    				$$invalidate(1, count3 = 9);
    			}
    		}
    	};

    	return [
    		count2,
    		count3,
    		doubled,
    		count,
    		user,
    		things,
    		promise,
    		quadrupled,
    		name,
    		string,
    		handleClick,
    		handleClick2,
    		handleClick3,
    		toggle,
    		leix,
    		click_handler
    	];
    }

    class Sample extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sample",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/Inner.svelte generated by Svelte v3.42.1 */
    const file$7 = "src/components/Inner.svelte";

    function create_fragment$8(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Click to say hello";
    			add_location(button, file$7, 12, 0, 188);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*sayHello*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Inner', slots, []);
    	const dispatch = createEventDispatcher();

    	function sayHello() {
    		dispatch('message', { text: 'Hello!' });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Inner> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		sayHello
    	});

    	return [sayHello];
    }

    class Inner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Inner",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/CustomButton.svelte generated by Svelte v3.42.1 */

    const file$6 = "src/components/CustomButton.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Click me";
    			attr_dev(button, "class", "svelte-hg07jm");
    			add_location(button, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CustomButton', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CustomButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	return [click_handler];
    }

    class CustomButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CustomButton",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/SampleEvents.svelte generated by Svelte v3.42.1 */

    const file$5 = "src/components/SampleEvents.svelte";

    function create_fragment$6(ctx) {
    	let div9;
    	let h2;
    	let t1;
    	let div7;
    	let div1;
    	let p0;
    	let t3;
    	let div0;
    	let t4;
    	let t5_value = /*m*/ ctx[0].x + "";
    	let t5;
    	let t6;
    	let t7_value = /*m*/ ctx[0].y + "";
    	let t7;
    	let t8;
    	let div3;
    	let p1;
    	let t10;
    	let div2;
    	let t11;
    	let t12_value = /*m*/ ctx[0].x + "";
    	let t12;
    	let t13;
    	let t14_value = /*m*/ ctx[0].y + "";
    	let t14;
    	let t15;
    	let div4;
    	let p2;
    	let t17;
    	let button;
    	let t19;
    	let div5;
    	let p3;
    	let t21;
    	let inner;
    	let t22;
    	let div6;
    	let p4;
    	let t24;
    	let custombutton;
    	let t25;
    	let div8;
    	let current;
    	let mounted;
    	let dispose;
    	inner = new Inner({ $$inline: true });
    	inner.$on("message", handleMessage);
    	custombutton = new CustomButton({ $$inline: true });
    	custombutton.$on("click", handleClick3);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sample Events";
    			t1 = space();
    			div7 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "DOM events";
    			t3 = space();
    			div0 = element("div");
    			t4 = text("The mouse position is ");
    			t5 = text(t5_value);
    			t6 = text(" x ");
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			p1 = element("p");
    			p1.textContent = "Inline handlers";
    			t10 = space();
    			div2 = element("div");
    			t11 = text("The mouse position is ");
    			t12 = text(t12_value);
    			t13 = text(" x ");
    			t14 = text(t14_value);
    			t15 = space();
    			div4 = element("div");
    			p2 = element("p");
    			p2.textContent = "Events modifiers";
    			t17 = space();
    			button = element("button");
    			button.textContent = "click here";
    			t19 = space();
    			div5 = element("div");
    			p3 = element("p");
    			p3.textContent = "Component modifiers";
    			t21 = space();
    			create_component(inner.$$.fragment);
    			t22 = space();
    			div6 = element("div");
    			p4 = element("p");
    			p4.textContent = "DOM event forwarding";
    			t24 = space();
    			create_component(custombutton.$$.fragment);
    			t25 = space();
    			div8 = element("div");
    			div8.textContent = "TOP";
    			attr_dev(h2, "class", "h3 mb-3 title");
    			add_location(h2, file$5, 46, 1, 644);
    			attr_dev(p0, "class", "sub-title");
    			add_location(p0, file$5, 49, 3, 743);
    			attr_dev(div0, "class", "domevents svelte-o7p6o6");
    			add_location(div0, file$5, 50, 3, 782);
    			attr_dev(div1, "class", "sampleli");
    			add_location(div1, file$5, 48, 2, 717);
    			attr_dev(p1, "class", "sub-title");
    			add_location(p1, file$5, 56, 3, 925);
    			attr_dev(div2, "class", "domevents svelte-o7p6o6");
    			add_location(div2, file$5, 57, 3, 969);
    			attr_dev(div3, "class", "sampleli");
    			add_location(div3, file$5, 55, 2, 899);
    			attr_dev(p2, "class", "sub-title");
    			add_location(p2, file$5, 63, 3, 1135);
    			add_location(button, file$5, 64, 3, 1180);
    			attr_dev(div4, "class", "sampleli");
    			add_location(div4, file$5, 62, 2, 1109);
    			attr_dev(p3, "class", "sub-title");
    			add_location(p3, file$5, 70, 3, 1283);
    			attr_dev(div5, "class", "sampleli");
    			add_location(div5, file$5, 69, 2, 1257);
    			attr_dev(p4, "class", "sub-title");
    			add_location(p4, file$5, 75, 3, 1405);
    			attr_dev(div6, "class", "sampleli");
    			add_location(div6, file$5, 74, 2, 1379);
    			attr_dev(div7, "class", "samplelist");
    			add_location(div7, file$5, 47, 1, 690);
    			attr_dev(div8, "class", "pointer");
    			add_location(div8, file$5, 80, 1, 1513);
    			attr_dev(div9, "class", "container");
    			add_location(div9, file$5, 45, 0, 619);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, h2);
    			append_dev(div9, t1);
    			append_dev(div9, div7);
    			append_dev(div7, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, t6);
    			append_dev(div0, t7);
    			append_dev(div7, t8);
    			append_dev(div7, div3);
    			append_dev(div3, p1);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, t11);
    			append_dev(div2, t12);
    			append_dev(div2, t13);
    			append_dev(div2, t14);
    			append_dev(div7, t15);
    			append_dev(div7, div4);
    			append_dev(div4, p2);
    			append_dev(div4, t17);
    			append_dev(div4, button);
    			append_dev(div7, t19);
    			append_dev(div7, div5);
    			append_dev(div5, p3);
    			append_dev(div5, t21);
    			mount_component(inner, div5, null);
    			append_dev(div7, t22);
    			append_dev(div7, div6);
    			append_dev(div6, p4);
    			append_dev(div6, t24);
    			mount_component(custombutton, div6, null);
    			append_dev(div9, t25);
    			append_dev(div9, div8);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "mousemove", /*handleMousemove*/ ctx[2], false, false, false),
    					listen_dev(div2, "mousemove", /*mousemove_handler*/ ctx[3], false, false, false),
    					listen_dev(button, "click", handleslick, { once: true }, false, false),
    					listen_dev(div8, "click", /*click_handler*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*m*/ 1) && t5_value !== (t5_value = /*m*/ ctx[0].x + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*m*/ 1) && t7_value !== (t7_value = /*m*/ ctx[0].y + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty & /*m*/ 1) && t12_value !== (t12_value = /*m*/ ctx[0].x + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty & /*m*/ 1) && t14_value !== (t14_value = /*m*/ ctx[0].y + "")) set_data_dev(t14, t14_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inner.$$.fragment, local);
    			transition_in(custombutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inner.$$.fragment, local);
    			transition_out(custombutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_component(inner);
    			destroy_component(custombutton);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleslick() {
    	alert('hello alerts');
    }

    function handleMessage(event) {
    	alert(event.detail.text);
    }

    function handleClick3() {
    	alert('clicked');
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SampleEvents', slots, []);
    	let m = { x: 0, y: 0 };

    	function handleMousemove(event) {
    		$$invalidate(0, m.x = event.clientX, m);
    		$$invalidate(0, m.y = event.clientY, m);
    	}

    	/**
     * Inliune handlers
    */
    	let m2 = { x: 0, y: 0 };

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SampleEvents> was created with unknown prop '${key}'`);
    	});

    	const mousemove_handler = e => $$invalidate(1, m2 = { x: e.clinentX, y: e.cilentY });
    	const click_handler = () => push('/');

    	$$self.$capture_state = () => ({
    		push,
    		m,
    		handleMousemove,
    		m2,
    		handleslick,
    		Inner,
    		handleMessage,
    		CustomButton,
    		handleClick3
    	});

    	$$self.$inject_state = $$props => {
    		if ('m' in $$props) $$invalidate(0, m = $$props.m);
    		if ('m2' in $$props) $$invalidate(1, m2 = $$props.m2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [m, m2, handleMousemove, mousemove_handler, click_handler];
    }

    class SampleEvents extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SampleEvents",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/SampleBindings.svelte generated by Svelte v3.42.1 */

    const { console: console_1 } = globals;
    const file$4 = "src/components/SampleBindings.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	child_ctx[44] = list;
    	child_ctx[45] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[49] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[52] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	return child_ctx;
    }

    // (142:12) {:else}
    function create_else_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You must opt in to continue. If you're not paying, you're the product.";
    			add_location(p, file$4, 142, 16, 3600);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(142:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (140:12) {#if yes}
    function create_if_block_5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Thank you. We will bombard your inbox and sell your personal details.";
    			add_location(p, file$4, 140, 16, 3487);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(140:12) {#if yes}",
    		ctx
    	});

    	return block;
    }

    // (171:12) {#each menu as flavour}
    function create_each_block_4(ctx) {
    	let label;
    	let input;
    	let t0;
    	let t1_value = /*flavour*/ ctx[46] + "";
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(input, "type", "checkbox");
    			input.__value = /*flavour*/ ctx[46];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[27][0].push(input);
    			add_location(input, file$4, 172, 20, 4462);
    			add_location(label, file$4, 171, 16, 4434);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = ~/*flavours*/ ctx[6].indexOf(input.__value);
    			append_dev(label, t0);
    			append_dev(label, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[30]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*flavours*/ 64) {
    				input.checked = ~/*flavours*/ ctx[6].indexOf(input.__value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[27][0].splice(/*$$binding_groups*/ ctx[27][0].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(171:12) {#each menu as flavour}",
    		ctx
    	});

    	return block;
    }

    // (182:12) {:else}
    function create_else_block_1(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = (/*scoops*/ ctx[12] === 1 ? 'scoop' : 'scoops') + "";
    	let t3;
    	let t4;
    	let t5_value = join2(/*flavours*/ ctx[6]) + "";
    	let t5;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("You ordered ");
    			t1 = text(/*scoops*/ ctx[12]);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = text("\n                    of ");
    			t5 = text(t5_value);
    			add_location(p, file$4, 182, 16, 4854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*flavours*/ 64 && t5_value !== (t5_value = join2(/*flavours*/ ctx[6]) + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(182:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (180:47) 
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Can't order more flavours than scoops!";
    			add_location(p, file$4, 180, 16, 4772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(180:47) ",
    		ctx
    	});

    	return block;
    }

    // (178:12) {#if flavours.length === 0}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please select at least one flavour";
    			add_location(p, file$4, 178, 16, 4666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(178:12) {#if flavours.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (217:12) {#if files}
    function create_if_block_2(ctx) {
    	let h4;
    	let t1;
    	let each_1_anchor;
    	let each_value_3 = Array.from(/*files*/ ctx[0]);
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Selected files:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(h4, "class", "mt-2");
    			add_location(h4, file$4, 217, 16, 5822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*files*/ 1) {
    				each_value_3 = Array.from(/*files*/ ctx[0]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(217:12) {#if files}",
    		ctx
    	});

    	return block;
    }

    // (219:16) {#each Array.from(files) as file}
    function create_each_block_3(ctx) {
    	let p;
    	let t0_value = /*file*/ ctx[52].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*file*/ ctx[52].size + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(" bytes) ");
    			add_location(p, file$4, 219, 20, 5930);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*files*/ 1 && t0_value !== (t0_value = /*file*/ ctx[52].name + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*files*/ 1 && t2_value !== (t2_value = /*file*/ ctx[52].size + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(219:16) {#each Array.from(files) as file}",
    		ctx
    	});

    	return block;
    }

    // (230:20) {#each questions as question}
    function create_each_block_2(ctx) {
    	let option;
    	let t0_value = /*question*/ ctx[49].text + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*question*/ ctx[49];
    			option.value = option.__value;
    			add_location(option, file$4, 230, 24, 6333);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(230:20) {#each questions as question}",
    		ctx
    	});

    	return block;
    }

    // (263:16) {#each menu2 as flavour}
    function create_each_block_1(ctx) {
    	let option;
    	let t0_value = /*flavour*/ ctx[46] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*flavour*/ ctx[46];
    			option.value = option.__value;
    			add_location(option, file$4, 263, 20, 7356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(263:16) {#each menu2 as flavour}",
    		ctx
    	});

    	return block;
    }

    // (274:12) {:else}
    function create_else_block(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3_value = (/*scoops2*/ ctx[9] === 1 ? 'scoop' : 'scoops') + "";
    	let t3;
    	let t4;
    	let t5_value = /*join*/ ctx[17](/*flavours2*/ ctx[10]) + "";
    	let t5;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("You ordered ");
    			t1 = text(/*scoops2*/ ctx[9]);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = text("\n                    of ");
    			t5 = text(t5_value);
    			add_location(p, file$4, 274, 16, 7751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*scoops2*/ 512) set_data_dev(t1, /*scoops2*/ ctx[9]);
    			if (dirty[0] & /*scoops2*/ 512 && t3_value !== (t3_value = (/*scoops2*/ ctx[9] === 1 ? 'scoop' : 'scoops') + "")) set_data_dev(t3, t3_value);
    			if (dirty[0] & /*flavours2*/ 1024 && t5_value !== (t5_value = /*join*/ ctx[17](/*flavours2*/ ctx[10]) + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(274:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (272:49) 
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Can't order more flavours than scoops!";
    			add_location(p, file$4, 272, 16, 7669);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(272:49) ",
    		ctx
    	});

    	return block;
    }

    // (270:12) {#if flavours2.length === 0}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please select at least one flavour";
    			add_location(p, file$4, 270, 16, 7561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(270:12) {#if flavours2.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (285:12) {#each todos_bind as todo_bind}
    function create_each_block$1(ctx) {
    	let div;
    	let input0;
    	let t;
    	let input1;
    	let input1_disabled_value;
    	let mounted;
    	let dispose;

    	function input0_change_handler() {
    		/*input0_change_handler*/ ctx[40].call(input0, /*each_value*/ ctx[44], /*todo_bind_index*/ ctx[45]);
    	}

    	function input1_input_handler_1() {
    		/*input1_input_handler_1*/ ctx[41].call(input1, /*each_value*/ ctx[44], /*todo_bind_index*/ ctx[45]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t = space();
    			input1 = element("input");
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$4, 286, 20, 8082);
    			attr_dev(input1, "placeholder", "What needs to be done?");
    			input1.disabled = input1_disabled_value = /*todo_bind*/ ctx[43].done_bind;
    			add_location(input1, file$4, 291, 20, 8241);
    			add_location(div, file$4, 285, 16, 8056);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			input0.checked = /*todo_bind*/ ctx[43].done_bind;
    			append_dev(div, t);
    			append_dev(div, input1);
    			set_input_value(input1, /*todo_bind*/ ctx[43].text_bind);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", input0_change_handler),
    					listen_dev(input1, "input", input1_input_handler_1)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*todos_bind*/ 2) {
    				input0.checked = /*todo_bind*/ ctx[43].done_bind;
    			}

    			if (dirty[0] & /*todos_bind*/ 2 && input1_disabled_value !== (input1_disabled_value = /*todo_bind*/ ctx[43].done_bind)) {
    				prop_dev(input1, "disabled", input1_disabled_value);
    			}

    			if (dirty[0] & /*todos_bind*/ 2 && input1.value !== /*todo_bind*/ ctx[43].text_bind) {
    				set_input_value(input1, /*todo_bind*/ ctx[43].text_bind);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(285:12) {#each todos_bind as todo_bind}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div11;
    	let h2;
    	let t1;
    	let div9;
    	let div0;
    	let p0;
    	let t3;
    	let input0;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = (/*name*/ ctx[2] || 'user') + "";
    	let t6;
    	let t7;
    	let div2;
    	let div1;
    	let p2;
    	let t9;
    	let label0;
    	let input1;
    	let t10;
    	let input2;
    	let t11;
    	let label1;
    	let input3;
    	let t12;
    	let input4;
    	let t13;
    	let p3;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18_value = /*a*/ ctx[3] + /*b*/ ctx[4] + "";
    	let t18;
    	let t19;
    	let div3;
    	let p4;
    	let t21;
    	let label2;
    	let input5;
    	let t22;
    	let t23;
    	let t24;
    	let button0;
    	let t25;
    	let button0_disabled_value;
    	let t26;
    	let div4;
    	let p5;
    	let t28;
    	let h40;
    	let t30;
    	let label3;
    	let input6;
    	let t31;
    	let t32;
    	let label4;
    	let input7;
    	let t33;
    	let t34;
    	let label5;
    	let input8;
    	let t35;
    	let t36;
    	let h41;
    	let t38;
    	let t39;
    	let t40;
    	let div5;
    	let p6;
    	let t42;
    	let label6;
    	let t44;
    	let input9;
    	let t45;
    	let label7;
    	let t47;
    	let input10;
    	let t48;
    	let t49;
    	let div6;
    	let p7;
    	let t51;
    	let form;
    	let select0;
    	let t52;
    	let input11;
    	let t53;
    	let button1;
    	let t54;
    	let button1_disabled_value;
    	let t55;
    	let div7;
    	let p8;
    	let t57;
    	let label8;
    	let input12;
    	let t58;
    	let t59;
    	let label9;
    	let input13;
    	let t60;
    	let t61;
    	let label10;
    	let input14;
    	let t62;
    	let t63;
    	let h42;
    	let t65;
    	let select1;
    	let t66;
    	let t67;
    	let div8;
    	let p9;
    	let t69;
    	let t70;
    	let p10;
    	let t71;
    	let t72;
    	let t73;
    	let button2;
    	let t75;
    	let button3;
    	let t77;
    	let div10;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*yes*/ ctx[5]) return create_if_block_5;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let each_value_4 = /*menu*/ ctx[13];
    	validate_each_argument(each_value_4);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_3[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*flavours*/ ctx[6].length === 0) return create_if_block_3;
    		if (/*flavours*/ ctx[6].length > /*scoops*/ ctx[12]) return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*files*/ ctx[0] && create_if_block_2(ctx);
    	let each_value_2 = /*questions*/ ctx[14];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*menu2*/ ctx[16];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function select_block_type_2(ctx, dirty) {
    		if (/*flavours2*/ ctx[10].length === 0) return create_if_block;
    		if (/*flavours2*/ ctx[10].length > /*scoops2*/ ctx[9]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block3 = current_block_type_2(ctx);
    	let each_value = /*todos_bind*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sample BIGINGS";
    			t1 = space();
    			div9 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Text inputs";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Hello ");
    			t6 = text(t6_value);
    			t7 = space();
    			div2 = element("div");
    			div1 = element("div");
    			p2 = element("p");
    			p2.textContent = "Numeric inputs";
    			t9 = space();
    			label0 = element("label");
    			input1 = element("input");
    			t10 = space();
    			input2 = element("input");
    			t11 = space();
    			label1 = element("label");
    			input3 = element("input");
    			t12 = space();
    			input4 = element("input");
    			t13 = space();
    			p3 = element("p");
    			t14 = text(/*a*/ ctx[3]);
    			t15 = text(" + ");
    			t16 = text(/*b*/ ctx[4]);
    			t17 = text(" = ");
    			t18 = text(t18_value);
    			t19 = space();
    			div3 = element("div");
    			p4 = element("p");
    			p4.textContent = "Checkbox Inputs";
    			t21 = space();
    			label2 = element("label");
    			input5 = element("input");
    			t22 = text("\n                Yes! Send me regular email spam");
    			t23 = space();
    			if_block0.c();
    			t24 = space();
    			button0 = element("button");
    			t25 = text("Subscribe");
    			t26 = space();
    			div4 = element("div");
    			p5 = element("p");
    			p5.textContent = "Group Inputs";
    			t28 = space();
    			h40 = element("h4");
    			h40.textContent = "Size";
    			t30 = space();
    			label3 = element("label");
    			input6 = element("input");
    			t31 = text("\n                One scoop");
    			t32 = space();
    			label4 = element("label");
    			input7 = element("input");
    			t33 = text("\n                Two scoops");
    			t34 = space();
    			label5 = element("label");
    			input8 = element("input");
    			t35 = text("\n                Three scoops");
    			t36 = space();
    			h41 = element("h4");
    			h41.textContent = "Flavours";
    			t38 = space();

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t39 = space();
    			if_block1.c();
    			t40 = space();
    			div5 = element("div");
    			p6 = element("p");
    			p6.textContent = "File Inputs";
    			t42 = space();
    			label6 = element("label");
    			label6.textContent = "Upload a picture:";
    			t44 = space();
    			input9 = element("input");
    			t45 = space();
    			label7 = element("label");
    			label7.textContent = "Upload multiple files of any type:";
    			t47 = space();
    			input10 = element("input");
    			t48 = space();
    			if (if_block2) if_block2.c();
    			t49 = space();
    			div6 = element("div");
    			p7 = element("p");
    			p7.textContent = "Insecurity questions";
    			t51 = space();
    			form = element("form");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t52 = space();
    			input11 = element("input");
    			t53 = space();
    			button1 = element("button");
    			t54 = text("Submit");
    			t55 = space();
    			div7 = element("div");
    			p8 = element("p");
    			p8.textContent = "Size";
    			t57 = space();
    			label8 = element("label");
    			input12 = element("input");
    			t58 = text("\n                One scoop");
    			t59 = space();
    			label9 = element("label");
    			input13 = element("input");
    			t60 = text("\n                Two scoops");
    			t61 = space();
    			label10 = element("label");
    			input14 = element("input");
    			t62 = text("\n                Three scoops");
    			t63 = space();
    			h42 = element("h4");
    			h42.textContent = "Flavours";
    			t65 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t66 = space();
    			if_block3.c();
    			t67 = space();
    			div8 = element("div");
    			p9 = element("p");
    			p9.textContent = "Todos";
    			t69 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t70 = space();
    			p10 = element("p");
    			t71 = text(/*remaining_bind*/ ctx[11]);
    			t72 = text(" remaining");
    			t73 = space();
    			button2 = element("button");
    			button2.textContent = "Add new";
    			t75 = space();
    			button3 = element("button");
    			button3.textContent = "Clear completed";
    			t77 = space();
    			div10 = element("div");
    			div10.textContent = "TOP";
    			attr_dev(h2, "class", "h3 mb-3 title");
    			add_location(h2, file$4, 110, 1, 2396);
    			attr_dev(p0, "class", "sub-title");
    			add_location(p0, file$4, 113, 3, 2496);
    			attr_dev(input0, "placeholder", "enter your name");
    			add_location(input0, file$4, 114, 12, 2545);
    			add_location(p1, file$4, 115, 12, 2613);
    			attr_dev(div0, "class", "sampleli");
    			add_location(div0, file$4, 112, 2, 2470);
    			attr_dev(p2, "class", "sub-title");
    			add_location(p2, file$4, 120, 16, 2737);
    			attr_dev(input1, "type", "nubmber");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "10");
    			add_location(input1, file$4, 122, 20, 2821);
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", "10");
    			add_location(input2, file$4, 123, 20, 2892);
    			add_location(label0, file$4, 121, 16, 2793);
    			attr_dev(input3, "type", "nubmber");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", "10");
    			add_location(input3, file$4, 126, 20, 3010);
    			attr_dev(input4, "type", "range");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", "10");
    			add_location(input4, file$4, 127, 20, 3081);
    			add_location(label1, file$4, 125, 16, 2982);
    			add_location(p3, file$4, 129, 16, 3171);
    			attr_dev(div1, "class", "sampleli");
    			add_location(div1, file$4, 119, 12, 2698);
    			attr_dev(div2, "class", "samplelist");
    			add_location(div2, file$4, 118, 8, 2661);
    			attr_dev(p4, "class", "sub-title");
    			add_location(p4, file$4, 134, 3, 3262);
    			attr_dev(input5, "type", "checkbox");
    			add_location(input5, file$4, 136, 16, 3339);
    			add_location(label2, file$4, 135, 12, 3315);
    			button0.disabled = button0_disabled_value = !/*yes*/ ctx[5];
    			add_location(button0, file$4, 144, 12, 3708);
    			attr_dev(div3, "class", "sampleli");
    			add_location(div3, file$4, 133, 2, 3236);
    			attr_dev(p5, "class", "sub-title");
    			add_location(p5, file$4, 150, 3, 3819);
    			add_location(h40, file$4, 151, 12, 3869);
    			attr_dev(input6, "type", "radio");
    			input6.__value = 1;
    			input6.value = input6.__value;
    			/*$$binding_groups*/ ctx[27][1].push(input6);
    			add_location(input6, file$4, 154, 16, 3920);
    			add_location(label3, file$4, 153, 12, 3896);
    			attr_dev(input7, "type", "radio");
    			input7.__value = 2;
    			input7.value = input7.__value;
    			/*$$binding_groups*/ ctx[27][1].push(input7);
    			add_location(input7, file$4, 159, 16, 4066);
    			add_location(label4, file$4, 158, 12, 4042);
    			attr_dev(input8, "type", "radio");
    			input8.__value = 3;
    			input8.value = input8.__value;
    			/*$$binding_groups*/ ctx[27][1].push(input8);
    			add_location(input8, file$4, 164, 16, 4213);
    			add_location(label5, file$4, 163, 12, 4189);
    			attr_dev(h41, "class", "mt-2");
    			add_location(h41, file$4, 168, 12, 4338);
    			attr_dev(div4, "class", "sampleli");
    			add_location(div4, file$4, 149, 2, 3793);
    			attr_dev(p6, "class", "sub-title");
    			add_location(p6, file$4, 198, 3, 5254);
    			attr_dev(label6, "for", "avatar");
    			add_location(label6, file$4, 199, 12, 5303);
    			attr_dev(input9, "accept", "image/png, image/jpeg");
    			attr_dev(input9, "id", "avatar");
    			attr_dev(input9, "name", "avatar");
    			attr_dev(input9, "type", "file");
    			add_location(input9, file$4, 200, 12, 5361);
    			attr_dev(label7, "for", "many");
    			add_location(label7, file$4, 208, 12, 5568);
    			attr_dev(input10, "id", "many");
    			input10.multiple = true;
    			attr_dev(input10, "type", "file");
    			add_location(input10, file$4, 209, 12, 5641);
    			attr_dev(div5, "class", "sampleli");
    			add_location(div5, file$4, 197, 2, 5228);
    			attr_dev(p7, "class", "sub-title");
    			add_location(p7, file$4, 226, 3, 6075);
    			if (/*selected*/ ctx[7] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[33].call(select0));
    			add_location(select0, file$4, 228, 16, 6196);
    			add_location(input11, file$4, 235, 16, 6507);
    			button1.disabled = button1_disabled_value = !/*answer*/ ctx[8];
    			attr_dev(button1, "type", "submit");
    			add_location(button1, file$4, 236, 16, 6551);
    			add_location(form, file$4, 227, 12, 6133);
    			attr_dev(div6, "class", "sampleli");
    			add_location(div6, file$4, 225, 8, 6049);
    			attr_dev(p8, "class", "sub-title");
    			add_location(p8, file$4, 243, 3, 6714);
    			attr_dev(input12, "type", "radio");
    			input12.__value = 1;
    			input12.value = input12.__value;
    			/*$$binding_groups*/ ctx[27][1].push(input12);
    			add_location(input12, file$4, 245, 16, 6780);
    			add_location(label8, file$4, 244, 12, 6756);
    			attr_dev(input13, "type", "radio");
    			input13.__value = 2;
    			input13.value = input13.__value;
    			/*$$binding_groups*/ ctx[27][1].push(input13);
    			add_location(input13, file$4, 250, 16, 6926);
    			add_location(label9, file$4, 249, 12, 6902);
    			attr_dev(input14, "type", "radio");
    			input14.__value = 3;
    			input14.value = input14.__value;
    			/*$$binding_groups*/ ctx[27][1].push(input14);
    			add_location(input14, file$4, 255, 16, 7073);
    			add_location(label10, file$4, 254, 12, 7049);
    			attr_dev(h42, "class", "mt-2");
    			add_location(h42, file$4, 259, 12, 7198);
    			select1.multiple = true;
    			if (/*flavours2*/ ctx[10] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[39].call(select1));
    			add_location(select1, file$4, 261, 12, 7254);
    			attr_dev(div7, "class", "sampleli");
    			add_location(div7, file$4, 242, 8, 6688);
    			attr_dev(p9, "class", "sub-title");
    			add_location(p9, file$4, 282, 3, 7964);
    			add_location(p10, file$4, 299, 12, 8511);
    			add_location(button2, file$4, 301, 12, 8570);
    			add_location(button3, file$4, 305, 12, 8670);
    			attr_dev(div8, "class", "sampleli");
    			add_location(div8, file$4, 281, 8, 7938);
    			attr_dev(div9, "class", "samplelist");
    			add_location(div9, file$4, 111, 1, 2443);
    			attr_dev(div10, "class", "pointer");
    			add_location(div10, file$4, 311, 1, 8783);
    			attr_dev(div11, "class", "container");
    			add_location(div11, file$4, 109, 0, 2371);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, h2);
    			append_dev(div11, t1);
    			append_dev(div11, div9);
    			append_dev(div9, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*name*/ ctx[2]);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div9, t7);
    			append_dev(div9, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p2);
    			append_dev(div1, t9);
    			append_dev(div1, label0);
    			append_dev(label0, input1);
    			set_input_value(input1, /*a*/ ctx[3]);
    			append_dev(label0, t10);
    			append_dev(label0, input2);
    			set_input_value(input2, /*a*/ ctx[3]);
    			append_dev(div1, t11);
    			append_dev(div1, label1);
    			append_dev(label1, input3);
    			set_input_value(input3, /*b*/ ctx[4]);
    			append_dev(label1, t12);
    			append_dev(label1, input4);
    			set_input_value(input4, /*b*/ ctx[4]);
    			append_dev(div1, t13);
    			append_dev(div1, p3);
    			append_dev(p3, t14);
    			append_dev(p3, t15);
    			append_dev(p3, t16);
    			append_dev(p3, t17);
    			append_dev(p3, t18);
    			append_dev(div9, t19);
    			append_dev(div9, div3);
    			append_dev(div3, p4);
    			append_dev(div3, t21);
    			append_dev(div3, label2);
    			append_dev(label2, input5);
    			input5.checked = /*yes*/ ctx[5];
    			append_dev(label2, t22);
    			append_dev(div3, t23);
    			if_block0.m(div3, null);
    			append_dev(div3, t24);
    			append_dev(div3, button0);
    			append_dev(button0, t25);
    			append_dev(div9, t26);
    			append_dev(div9, div4);
    			append_dev(div4, p5);
    			append_dev(div4, t28);
    			append_dev(div4, h40);
    			append_dev(div4, t30);
    			append_dev(div4, label3);
    			append_dev(label3, input6);
    			input6.checked = input6.__value === /*scoops2*/ ctx[9];
    			append_dev(label3, t31);
    			append_dev(div4, t32);
    			append_dev(div4, label4);
    			append_dev(label4, input7);
    			input7.checked = input7.__value === /*scoops2*/ ctx[9];
    			append_dev(label4, t33);
    			append_dev(div4, t34);
    			append_dev(div4, label5);
    			append_dev(label5, input8);
    			input8.checked = input8.__value === /*scoops2*/ ctx[9];
    			append_dev(label5, t35);
    			append_dev(div4, t36);
    			append_dev(div4, h41);
    			append_dev(div4, t38);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div4, null);
    			}

    			append_dev(div4, t39);
    			if_block1.m(div4, null);
    			append_dev(div9, t40);
    			append_dev(div9, div5);
    			append_dev(div5, p6);
    			append_dev(div5, t42);
    			append_dev(div5, label6);
    			append_dev(div5, t44);
    			append_dev(div5, input9);
    			append_dev(div5, t45);
    			append_dev(div5, label7);
    			append_dev(div5, t47);
    			append_dev(div5, input10);
    			append_dev(div5, t48);
    			if (if_block2) if_block2.m(div5, null);
    			append_dev(div9, t49);
    			append_dev(div9, div6);
    			append_dev(div6, p7);
    			append_dev(div6, t51);
    			append_dev(div6, form);
    			append_dev(form, select0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			select_option(select0, /*selected*/ ctx[7]);
    			append_dev(form, t52);
    			append_dev(form, input11);
    			set_input_value(input11, /*answer*/ ctx[8]);
    			append_dev(form, t53);
    			append_dev(form, button1);
    			append_dev(button1, t54);
    			append_dev(div9, t55);
    			append_dev(div9, div7);
    			append_dev(div7, p8);
    			append_dev(div7, t57);
    			append_dev(div7, label8);
    			append_dev(label8, input12);
    			input12.checked = input12.__value === /*scoops2*/ ctx[9];
    			append_dev(label8, t58);
    			append_dev(div7, t59);
    			append_dev(div7, label9);
    			append_dev(label9, input13);
    			input13.checked = input13.__value === /*scoops2*/ ctx[9];
    			append_dev(label9, t60);
    			append_dev(div7, t61);
    			append_dev(div7, label10);
    			append_dev(label10, input14);
    			input14.checked = input14.__value === /*scoops2*/ ctx[9];
    			append_dev(label10, t62);
    			append_dev(div7, t63);
    			append_dev(div7, h42);
    			append_dev(div7, t65);
    			append_dev(div7, select1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select_options(select1, /*flavours2*/ ctx[10]);
    			append_dev(div7, t66);
    			if_block3.m(div7, null);
    			append_dev(div9, t67);
    			append_dev(div9, div8);
    			append_dev(div8, p9);
    			append_dev(div8, t69);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div8, null);
    			}

    			append_dev(div8, t70);
    			append_dev(div8, p10);
    			append_dev(p10, t71);
    			append_dev(p10, t72);
    			append_dev(div8, t73);
    			append_dev(div8, button2);
    			append_dev(div8, t75);
    			append_dev(div8, button3);
    			append_dev(div11, t77);
    			append_dev(div11, div10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[20]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[21]),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[22]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[22]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[23]),
    					listen_dev(input4, "change", /*input4_change_input_handler*/ ctx[24]),
    					listen_dev(input4, "input", /*input4_change_input_handler*/ ctx[24]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[25]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[26]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[28]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[29]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[31]),
    					listen_dev(input10, "change", /*input10_change_handler*/ ctx[32]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[33]),
    					listen_dev(select0, "change", /*change_handler*/ ctx[34], false, false, false),
    					listen_dev(input11, "input", /*input11_input_handler*/ ctx[35]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[15]), false, true, false),
    					listen_dev(input12, "change", /*input12_change_handler*/ ctx[36]),
    					listen_dev(input13, "change", /*input13_change_handler*/ ctx[37]),
    					listen_dev(input14, "change", /*input14_change_handler*/ ctx[38]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[39]),
    					listen_dev(button2, "click", /*add_bind*/ ctx[18], false, false, false),
    					listen_dev(button3, "click", /*clear_bind*/ ctx[19], false, false, false),
    					listen_dev(div10, "click", /*click_handler*/ ctx[42], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*name*/ 4 && input0.value !== /*name*/ ctx[2]) {
    				set_input_value(input0, /*name*/ ctx[2]);
    			}

    			if (dirty[0] & /*name*/ 4 && t6_value !== (t6_value = (/*name*/ ctx[2] || 'user') + "")) set_data_dev(t6, t6_value);

    			if (dirty[0] & /*a*/ 8) {
    				set_input_value(input1, /*a*/ ctx[3]);
    			}

    			if (dirty[0] & /*a*/ 8) {
    				set_input_value(input2, /*a*/ ctx[3]);
    			}

    			if (dirty[0] & /*b*/ 16) {
    				set_input_value(input3, /*b*/ ctx[4]);
    			}

    			if (dirty[0] & /*b*/ 16) {
    				set_input_value(input4, /*b*/ ctx[4]);
    			}

    			if (dirty[0] & /*a*/ 8) set_data_dev(t14, /*a*/ ctx[3]);
    			if (dirty[0] & /*b*/ 16) set_data_dev(t16, /*b*/ ctx[4]);
    			if (dirty[0] & /*a, b*/ 24 && t18_value !== (t18_value = /*a*/ ctx[3] + /*b*/ ctx[4] + "")) set_data_dev(t18, t18_value);

    			if (dirty[0] & /*yes*/ 32) {
    				input5.checked = /*yes*/ ctx[5];
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div3, t24);
    				}
    			}

    			if (dirty[0] & /*yes*/ 32 && button0_disabled_value !== (button0_disabled_value = !/*yes*/ ctx[5])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty[0] & /*scoops2*/ 512) {
    				input6.checked = input6.__value === /*scoops2*/ ctx[9];
    			}

    			if (dirty[0] & /*scoops2*/ 512) {
    				input7.checked = input7.__value === /*scoops2*/ ctx[9];
    			}

    			if (dirty[0] & /*scoops2*/ 512) {
    				input8.checked = input8.__value === /*scoops2*/ ctx[9];
    			}

    			if (dirty[0] & /*menu, flavours*/ 8256) {
    				each_value_4 = /*menu*/ ctx[13];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_4(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div4, t39);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_4.length;
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div4, null);
    				}
    			}

    			if (/*files*/ ctx[0]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(div5, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*questions*/ 16384) {
    				each_value_2 = /*questions*/ ctx[14];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*selected, questions*/ 16512) {
    				select_option(select0, /*selected*/ ctx[7]);
    			}

    			if (dirty[0] & /*answer*/ 256 && input11.value !== /*answer*/ ctx[8]) {
    				set_input_value(input11, /*answer*/ ctx[8]);
    			}

    			if (dirty[0] & /*answer*/ 256 && button1_disabled_value !== (button1_disabled_value = !/*answer*/ ctx[8])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty[0] & /*scoops2*/ 512) {
    				input12.checked = input12.__value === /*scoops2*/ ctx[9];
    			}

    			if (dirty[0] & /*scoops2*/ 512) {
    				input13.checked = input13.__value === /*scoops2*/ ctx[9];
    			}

    			if (dirty[0] & /*scoops2*/ 512) {
    				input14.checked = input14.__value === /*scoops2*/ ctx[9];
    			}

    			if (dirty[0] & /*menu2*/ 65536) {
    				each_value_1 = /*menu2*/ ctx[16];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*flavours2, menu2*/ 66560) {
    				select_options(select1, /*flavours2*/ ctx[10]);
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type_2(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div7, null);
    				}
    			}

    			if (dirty[0] & /*todos_bind*/ 2) {
    				each_value = /*todos_bind*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div8, t70);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*remaining_bind*/ 2048) set_data_dev(t71, /*remaining_bind*/ ctx[11]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			if_block0.d();
    			/*$$binding_groups*/ ctx[27][1].splice(/*$$binding_groups*/ ctx[27][1].indexOf(input6), 1);
    			/*$$binding_groups*/ ctx[27][1].splice(/*$$binding_groups*/ ctx[27][1].indexOf(input7), 1);
    			/*$$binding_groups*/ ctx[27][1].splice(/*$$binding_groups*/ ctx[27][1].indexOf(input8), 1);
    			destroy_each(each_blocks_3, detaching);
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks_2, detaching);
    			/*$$binding_groups*/ ctx[27][1].splice(/*$$binding_groups*/ ctx[27][1].indexOf(input12), 1);
    			/*$$binding_groups*/ ctx[27][1].splice(/*$$binding_groups*/ ctx[27][1].indexOf(input13), 1);
    			/*$$binding_groups*/ ctx[27][1].splice(/*$$binding_groups*/ ctx[27][1].indexOf(input14), 1);
    			destroy_each(each_blocks_1, detaching);
    			if_block3.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function join2(flavours) {
    	if (flavours.length === 1) return flavours[0];
    	return `${flavours.slice(0, -1).join2(', ')} and ${flavours[flavours.length - 1]}`;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let remaining_bind;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SampleBindings', slots, []);
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
    	let scoops = 1,
    		flavours = ['Mint choc chip'],
    		menu = ['Cookies and cream', 'Mint choc chip', 'Raspberry ripple'];

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

    	/**
     * Select bindings
    */
    	let questions = [
    		{
    			id: 1,
    			text: `Where did you go to school?`
    		},
    		{
    			id: 2,
    			text: `What is your mother's name?`
    		},
    		{
    			id: 3,
    			text: `What is another personal fact that an attacker could easily find with Google?`
    		}
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
    	let menu2 = ['Cookies and cream', 'Mint choc chip', 'Raspberry ripple'];

    	function join(flavours2) {
    		if (flavours.length === 1) return flavours2[0];
    		return `${flavours2.slice(0, -1).join(', ')} and ${flavours2[flavours2.length - 1]}`;
    	}

    	/**
     * Each block bindings
    */
    	let todos_bind = [
    		{
    			done_bind: false,
    			text_bind: 'finish Svelte tutorial'
    		},
    		{
    			done_bind: false,
    			text_bind: 'build an app'
    		},
    		{
    			done_bind: false,
    			text_bind: 'world domination'
    		}
    	];

    	function add_bind() {
    		$$invalidate(1, todos_bind = todos_bind.concat({ done_bind: false, text_bind: '' }));
    	}

    	function clear_bind() {
    		$$invalidate(1, todos_bind = todos_bind.filter(t => !t.done_bind));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<SampleBindings> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[], []];

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(2, name);
    	}

    	function input1_input_handler() {
    		a = this.value;
    		$$invalidate(3, a);
    	}

    	function input2_change_input_handler() {
    		a = to_number(this.value);
    		$$invalidate(3, a);
    	}

    	function input3_input_handler() {
    		b = this.value;
    		$$invalidate(4, b);
    	}

    	function input4_change_input_handler() {
    		b = to_number(this.value);
    		$$invalidate(4, b);
    	}

    	function input5_change_handler() {
    		yes = this.checked;
    		$$invalidate(5, yes);
    	}

    	function input6_change_handler() {
    		scoops2 = this.__value;
    		$$invalidate(9, scoops2);
    	}

    	function input7_change_handler() {
    		scoops2 = this.__value;
    		$$invalidate(9, scoops2);
    	}

    	function input8_change_handler() {
    		scoops2 = this.__value;
    		$$invalidate(9, scoops2);
    	}

    	function input_change_handler() {
    		flavours = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(6, flavours);
    	}

    	function input9_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	function input10_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	function select0_change_handler() {
    		selected = select_value(this);
    		$$invalidate(7, selected);
    		$$invalidate(14, questions);
    	}

    	const change_handler = () => $$invalidate(8, answer = '');

    	function input11_input_handler() {
    		answer = this.value;
    		$$invalidate(8, answer);
    	}

    	function input12_change_handler() {
    		scoops2 = this.__value;
    		$$invalidate(9, scoops2);
    	}

    	function input13_change_handler() {
    		scoops2 = this.__value;
    		$$invalidate(9, scoops2);
    	}

    	function input14_change_handler() {
    		scoops2 = this.__value;
    		$$invalidate(9, scoops2);
    	}

    	function select1_change_handler() {
    		flavours2 = select_multiple_value(this);
    		$$invalidate(10, flavours2);
    		$$invalidate(16, menu2);
    	}

    	function input0_change_handler(each_value, todo_bind_index) {
    		each_value[todo_bind_index].done_bind = this.checked;
    		$$invalidate(1, todos_bind);
    	}

    	function input1_input_handler_1(each_value, todo_bind_index) {
    		each_value[todo_bind_index].text_bind = this.value;
    		$$invalidate(1, todos_bind);
    	}

    	const click_handler = () => push('/');

    	$$self.$capture_state = () => ({
    		push,
    		name,
    		a,
    		b,
    		yes,
    		scoops,
    		flavours,
    		menu,
    		join2,
    		files,
    		questions,
    		selected,
    		answer,
    		handleSubmit,
    		scoops2,
    		flavours2,
    		menu2,
    		join,
    		todos_bind,
    		add_bind,
    		clear_bind,
    		remaining_bind
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(2, name = $$props.name);
    		if ('a' in $$props) $$invalidate(3, a = $$props.a);
    		if ('b' in $$props) $$invalidate(4, b = $$props.b);
    		if ('yes' in $$props) $$invalidate(5, yes = $$props.yes);
    		if ('scoops' in $$props) $$invalidate(12, scoops = $$props.scoops);
    		if ('flavours' in $$props) $$invalidate(6, flavours = $$props.flavours);
    		if ('menu' in $$props) $$invalidate(13, menu = $$props.menu);
    		if ('files' in $$props) $$invalidate(0, files = $$props.files);
    		if ('questions' in $$props) $$invalidate(14, questions = $$props.questions);
    		if ('selected' in $$props) $$invalidate(7, selected = $$props.selected);
    		if ('answer' in $$props) $$invalidate(8, answer = $$props.answer);
    		if ('scoops2' in $$props) $$invalidate(9, scoops2 = $$props.scoops2);
    		if ('flavours2' in $$props) $$invalidate(10, flavours2 = $$props.flavours2);
    		if ('menu2' in $$props) $$invalidate(16, menu2 = $$props.menu2);
    		if ('todos_bind' in $$props) $$invalidate(1, todos_bind = $$props.todos_bind);
    		if ('remaining_bind' in $$props) $$invalidate(11, remaining_bind = $$props.remaining_bind);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*files*/ 1) {
    			if (files) {
    				// Note that `files` is of type `FileList`, not an Array:
    				// https://developer.mozilla.org/en-US/docs/Web/API/FileList
    				console.log(files);

    				for (const file of files) {
    					console.log(`${file.name}: ${file.size} bytes`);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*todos_bind*/ 2) {
    			$$invalidate(11, remaining_bind = todos_bind.filter(t => !t.done_bind).length);
    		}
    	};

    	return [
    		files,
    		todos_bind,
    		name,
    		a,
    		b,
    		yes,
    		flavours,
    		selected,
    		answer,
    		scoops2,
    		flavours2,
    		remaining_bind,
    		scoops,
    		menu,
    		questions,
    		handleSubmit,
    		menu2,
    		join,
    		add_bind,
    		clear_bind,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_input_handler,
    		input3_input_handler,
    		input4_change_input_handler,
    		input5_change_handler,
    		input6_change_handler,
    		$$binding_groups,
    		input7_change_handler,
    		input8_change_handler,
    		input_change_handler,
    		input9_change_handler,
    		input10_change_handler,
    		select0_change_handler,
    		change_handler,
    		input11_input_handler,
    		input12_change_handler,
    		input13_change_handler,
    		input14_change_handler,
    		select1_change_handler,
    		input0_change_handler,
    		input1_input_handler_1,
    		click_handler
    	];
    }

    class SampleBindings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SampleBindings",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/SampleStore.svelte generated by Svelte v3.42.1 */
    const file$3 = "src/components/SampleStore.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let p;
    	let t2;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sample Store";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "TOP";
    			attr_dev(h2, "class", "h3 mb-3 title");
    			add_location(h2, file$3, 7, 1, 107);
    			attr_dev(p, "class", "sub-title");
    			add_location(p, file$3, 10, 3, 205);
    			attr_dev(div0, "class", "sampleli");
    			add_location(div0, file$3, 9, 2, 179);
    			attr_dev(div1, "class", "samplelist");
    			add_location(div1, file$3, 8, 1, 152);
    			attr_dev(div2, "class", "pointer");
    			add_location(div2, file$3, 13, 1, 249);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$3, 6, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SampleStore', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SampleStore> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/');
    	$$self.$capture_state = () => ({ push });
    	return [click_handler];
    }

    class SampleStore extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SampleStore",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/SampleMotion.svelte generated by Svelte v3.42.1 */
    const file$2 = "src/components/SampleMotion.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let p;
    	let t2;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sample Motion";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "TOP";
    			attr_dev(h2, "class", "h3 mb-3 title");
    			add_location(h2, file$2, 7, 1, 107);
    			attr_dev(p, "class", "sub-title");
    			add_location(p, file$2, 10, 3, 206);
    			attr_dev(div0, "class", "sampleli");
    			add_location(div0, file$2, 9, 2, 180);
    			attr_dev(div1, "class", "samplelist");
    			add_location(div1, file$2, 8, 1, 153);
    			attr_dev(div2, "class", "pointer");
    			add_location(div2, file$2, 14, 1, 251);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$2, 6, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SampleMotion', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SampleMotion> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/');
    	$$self.$capture_state = () => ({ push });
    	return [click_handler];
    }

    class SampleMotion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SampleMotion",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/SampleTrantitions.svelte generated by Svelte v3.42.1 */
    const file$1 = "src/components/SampleTrantitions.svelte";

    function create_fragment$2(ctx) {
    	let div3;
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let p;
    	let t2;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sample Transitions";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "TOP";
    			attr_dev(h2, "class", "h3 mb-3 title");
    			add_location(h2, file$1, 7, 1, 107);
    			attr_dev(p, "class", "sub-title");
    			add_location(p, file$1, 10, 3, 211);
    			attr_dev(div0, "class", "sampleli");
    			add_location(div0, file$1, 9, 2, 185);
    			attr_dev(div1, "class", "samplelist");
    			add_location(div1, file$1, 8, 1, 158);
    			attr_dev(div2, "class", "pointer");
    			add_location(div2, file$1, 14, 1, 256);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$1, 6, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SampleTrantitions', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SampleTrantitions> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push('/');
    	$$self.$capture_state = () => ({ push });
    	return [click_handler];
    }

    class SampleTrantitions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SampleTrantitions",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Task.svelte generated by Svelte v3.42.1 */
    const file = "src/components/Task.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[21] = list;
    	child_ctx[22] = i;
    	return child_ctx;
    }

    // (100:4) {#each filteredTodoList(todoList, condition) as todo (todo.id)}
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*todo*/ ctx[20].id + 1 + "";
    	let t0;
    	let t1;
    	let td1;
    	let input;
    	let input_id_value;
    	let t2;
    	let label;
    	let t3_value = /*todo*/ ctx[20].title + "";
    	let t3;
    	let label_for_value;
    	let t4;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[16].call(input, /*each_value*/ ctx[21], /*todo_index*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			input = element("input");
    			t2 = space();
    			label = element("label");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(td0, "class", "col-2 col-lg-1");
    			add_location(td0, file, 101, 5, 2835);
    			attr_dev(input, "class", "form-check-input me-2");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = /*todo*/ ctx[20].id);
    			add_location(input, file, 105, 6, 2932);
    			attr_dev(label, "for", label_for_value = /*todo*/ ctx[20].id);
    			attr_dev(label, "class", "form-check-label");
    			add_location(label, file, 106, 6, 3033);
    			attr_dev(td1, "class", "col-10 col-12");
    			add_location(td1, file, 104, 5, 2899);
    			add_location(tr, file, 100, 5, 2825);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, input);
    			input.checked = /*todo*/ ctx[20].done;
    			append_dev(td1, t2);
    			append_dev(td1, label);
    			append_dev(label, t3);
    			append_dev(tr, t4);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && t0_value !== (t0_value = /*todo*/ ctx[20].id + 1 + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && input_id_value !== (input_id_value = /*todo*/ ctx[20].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19) {
    				input.checked = /*todo*/ ctx[20].done;
    			}

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && t3_value !== (t3_value = /*todo*/ ctx[20].title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && label_for_value !== (label_for_value = /*todo*/ ctx[20].id)) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(100:4) {#each filteredTodoList(todoList, condition) as todo (todo.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let t3;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let t9;
    	let button3;
    	let t11;
    	let div2;
    	let input;
    	let t12;
    	let button4;
    	let t14;
    	let button5;
    	let t16;
    	let div3;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t18;
    	let th1;
    	let t20;
    	let tbody;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t21;
    	let div4;
    	let mounted;
    	let dispose;
    	let each_value = /*filteredTodoList*/ ctx[4](/*todoList*/ ctx[1], /*condition*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*todo*/ ctx[20].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "タスク管理ツール";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "絞り込み:";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "すべて";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "未完了";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "完了";
    			t9 = space();
    			button3 = element("button");
    			button3.textContent = "保存";
    			t11 = space();
    			div2 = element("div");
    			input = element("input");
    			t12 = space();
    			button4 = element("button");
    			button4.textContent = "タスク追加";
    			t14 = space();
    			button5 = element("button");
    			button5.textContent = "全て削除";
    			t16 = space();
    			div3 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "連番";
    			t18 = space();
    			th1 = element("th");
    			th1.textContent = "タスク";
    			t20 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t21 = space();
    			div4 = element("div");
    			div4.textContent = "TOP";
    			attr_dev(h2, "class", "h3 mb-3");
    			add_location(h2, file, 77, 1, 1567);
    			attr_dev(div0, "class", "col-12 mb-2 svelte-11trf7i");
    			add_location(div0, file, 79, 2, 1632);
    			attr_dev(button0, "class", "all-btn btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2 svelte-11trf7i");
    			add_location(button0, file, 80, 2, 1671);
    			attr_dev(button1, "class", "incomplete btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2 svelte-11trf7i");
    			add_location(button1, file, 81, 2, 1798);
    			attr_dev(button2, "class", "complete btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2 svelte-11trf7i");
    			add_location(button2, file, 82, 2, 1929);
    			attr_dev(button3, "class", "btn btn-primary col-6 col-lg-1 col-md-2 mb-2 svelte-11trf7i");
    			add_location(button3, file, 83, 2, 2056);
    			attr_dev(div1, "class", "mb-3 c-filter svelte-11trf7i");
    			add_location(div1, file, 78, 1, 1602);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "col-12 col-lg-4 col-md-6 mb-2 me-2 svelte-11trf7i");
    			add_location(input, file, 86, 2, 2210);
    			attr_dev(button4, "class", "btn btn-outline-secondary col-6 col-lg-2 col-md-2 me-2 mb-2 svelte-11trf7i");
    			add_location(button4, file, 87, 2, 2316);
    			attr_dev(button5, "class", "btn btn-secondary col-6 col-lg-2 col-md-2 me-2 mb-2 svelte-11trf7i");
    			add_location(button5, file, 88, 2, 2437);
    			attr_dev(div2, "class", "mb-2 c-search d-block d-lg-flex svelte-11trf7i");
    			add_location(div2, file, 85, 1, 2162);
    			attr_dev(th0, "class", "col-2 col-lg-1");
    			add_location(th0, file, 94, 5, 2644);
    			attr_dev(th1, "class", "col-10 col-12");
    			add_location(th1, file, 95, 5, 2684);
    			add_location(tr, file, 93, 4, 2634);
    			add_location(thead, file, 92, 3, 2622);
    			add_location(tbody, file, 98, 3, 2744);
    			attr_dev(table, "class", "table table-dark table-striped");
    			add_location(table, file, 91, 2, 2572);
    			attr_dev(div3, "class", "mb-3");
    			add_location(div3, file, 90, 1, 2551);
    			attr_dev(div4, "class", "pointer");
    			add_location(div4, file, 113, 1, 3172);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file, 76, 0, 1542);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h2);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(div1, t7);
    			append_dev(div1, button2);
    			append_dev(div1, t9);
    			append_dev(div1, button3);
    			append_dev(div5, t11);
    			append_dev(div5, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*title*/ ctx[2]);
    			/*input_binding*/ ctx[13](input);
    			append_dev(div2, t12);
    			append_dev(div2, button4);
    			append_dev(div2, t14);
    			append_dev(div2, button5);
    			append_dev(div5, t16);
    			append_dev(div5, div3);
    			append_dev(div3, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t18);
    			append_dev(tr, th1);
    			append_dev(table, t20);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(div5, t21);
    			append_dev(div5, div4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[10], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[11], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[12]),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[14], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[15], false, false, false),
    					listen_dev(div4, "click", /*click_handler_6*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 4 && input.value !== /*title*/ ctx[2]) {
    				set_input_value(input, /*title*/ ctx[2]);
    			}

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19) {
    				each_value = /*filteredTodoList*/ ctx[4](/*todoList*/ ctx[1], /*condition*/ ctx[0]);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			/*input_binding*/ ctx[13](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function GetCookie(name) {
    	let result = null,
    		cookieName = name + '=',
    		allcookies = document.cookie,
    		position = allcookies.indexOf(cookieName);

    	if (position != -1) {
    		let startIndex = position + cookieName.length,
    			endIndex = allcookies.indexOf(';', startIndex);

    		if (endIndex == -1) {
    			endIndex = allcookies.length;
    		}

    		result = decodeURIComponent(allcookies.substring(startIndex, endIndex));
    	}

    	return result;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let filteredTodoList;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Task', slots, []);

    	let title = '',
    		initFocus = null,
    		condition = null,
    		todoList = [],
    		jsondata = GetCookie('data');

    	if (!(jsondata === '' || jsondata === null)) {
    		todoList = JSON.parse(jsondata);
    	}

    	onMount(() => {
    		init();
    	});

    	function init() {
    		$$invalidate(2, title = '');
    		initFocus.focus();
    	}

    	function save() {
    		let expire = new Date();
    		expire.setTime(expire.getTime() + 1000 * 3600 * 24);
    		document.cookie = 'data=' + JSON.stringify(todoList) + ';expires=' + expire.toUTCString();
    		alert('保存しました');
    	}

    	function add(target) {
    		if (target !== '') {
    			$$invalidate(1, todoList = [...todoList, { id: todoList.length, done: false, title }]);
    			init();
    		} else {
    			alert('タスクを入力してください');
    		}
    	}

    	function del() {
    		if (!(jsondata === '' || jsondata === null)) {
    			$$invalidate(1, todoList = []);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Task> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, condition = null);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, condition = false);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, condition = true);
    	};

    	const click_handler_3 = () => save();

    	function input_input_handler() {
    		title = this.value;
    		$$invalidate(2, title);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			initFocus = $$value;
    			$$invalidate(3, initFocus);
    		});
    	}

    	const click_handler_4 = () => add(title);
    	const click_handler_5 = () => del();

    	function input_change_handler(each_value, todo_index) {
    		each_value[todo_index].done = this.checked;
    		$$invalidate(4, filteredTodoList);
    		$$invalidate(1, todoList);
    		$$invalidate(0, condition);
    	}

    	const click_handler_6 = () => push('/');

    	$$self.$capture_state = () => ({
    		push,
    		onMount,
    		title,
    		initFocus,
    		condition,
    		todoList,
    		jsondata,
    		init,
    		save,
    		add,
    		GetCookie,
    		del,
    		filteredTodoList
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('initFocus' in $$props) $$invalidate(3, initFocus = $$props.initFocus);
    		if ('condition' in $$props) $$invalidate(0, condition = $$props.condition);
    		if ('todoList' in $$props) $$invalidate(1, todoList = $$props.todoList);
    		if ('jsondata' in $$props) jsondata = $$props.jsondata;
    		if ('filteredTodoList' in $$props) $$invalidate(4, filteredTodoList = $$props.filteredTodoList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(4, filteredTodoList = (todoList, condition) => {
    		return condition === null
    		? todoList
    		: todoList.filter(t => t.done === condition);
    	});

    	return [
    		condition,
    		todoList,
    		title,
    		initFocus,
    		filteredTodoList,
    		save,
    		add,
    		del,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		input_input_handler,
    		input_binding,
    		click_handler_4,
    		click_handler_5,
    		input_change_handler,
    		click_handler_6
    	];
    }

    class Task extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Task",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.1 */

    function create_fragment(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	const routes = {
    		'/': Home,
    		'/sample': Sample,
    		'/sampleevents': SampleEvents,
    		'/samplebindings': SampleBindings,
    		'/saaplemotion': SampleMotion,
    		'/samplestore': SampleStore,
    		'/sampletrantitions': SampleTrantitions,
    		'/task': Task
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Router,
    		Home,
    		Sample,
    		SampleEvents,
    		SampleBindings,
    		SampleStore,
    		SampleMotion,
    		SampleTrantitions,
    		Task,
    		routes
    	});

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
