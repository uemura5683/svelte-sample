
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    const nodes_to_detach = new Set();
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
        for (const node of nodes_to_detach) {
            node.parentNode.removeChild(node);
        }
        nodes_to_detach.clear();
    }
    function append(target, node) {
        if (is_hydrating) {
            nodes_to_detach.delete(node);
        }
        if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating) {
            nodes_to_detach.delete(node);
        }
        if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        if (is_hydrating) {
            nodes_to_detach.add(node);
        }
        else if (node.parentNode) {
            node.parentNode.removeChild(node);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            skip_bound: false
        };
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
                start_hydrating();
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
            end_hydrating();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.0' }, detail)));
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

    /* src/App.svelte generated by Svelte v3.38.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[20] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (25:4) {#each filteredTodoList(todoList, condition)  as todo (todo.id)}
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*todo*/ ctx[19].id + 1 + "";
    	let t0;
    	let t1;
    	let td1;
    	let input;
    	let input_id_value;
    	let t2;
    	let label;
    	let t3_value = /*todo*/ ctx[19].title + "";
    	let t3;
    	let label_for_value;
    	let t4;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[16].call(input, /*each_value*/ ctx[20], /*todo_index*/ ctx[21]);
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
    			add_location(td0, file, 26, 4, 1284);
    			attr_dev(input, "class", "form-check-input me-2");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = /*todo*/ ctx[19].id);
    			add_location(input, file, 30, 5, 1377);
    			attr_dev(label, "for", label_for_value = /*todo*/ ctx[19].id);
    			attr_dev(label, "class", "form-check-label");
    			add_location(label, file, 31, 5, 1477);
    			attr_dev(td1, "class", "col-10 col-12");
    			add_location(td1, file, 29, 4, 1345);
    			add_location(tr, file, 25, 4, 1275);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, input);
    			input.checked = /*todo*/ ctx[19].done;
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
    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && t0_value !== (t0_value = /*todo*/ ctx[19].id + 1 + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && input_id_value !== (input_id_value = /*todo*/ ctx[19].id)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19) {
    				input.checked = /*todo*/ ctx[19].done;
    			}

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && t3_value !== (t3_value = /*todo*/ ctx[19].title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*filteredTodoList, todoList, condition*/ 19 && label_for_value !== (label_for_value = /*todo*/ ctx[19].id)) {
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
    		source: "(25:4) {#each filteredTodoList(todoList, condition)  as todo (todo.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div4;
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
    	let mounted;
    	let dispose;
    	let each_value = /*filteredTodoList*/ ctx[4](/*todoList*/ ctx[1], /*condition*/ ctx[0]);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*todo*/ ctx[19].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
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

    			attr_dev(h2, "class", "h3 mb-3");
    			add_location(h2, file, 2, 1, 40);
    			attr_dev(div0, "class", "col-12 mb-2 svelte-1hcy0v1");
    			add_location(div0, file, 4, 2, 105);
    			attr_dev(button0, "class", "all-btn btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2 svelte-1hcy0v1");
    			add_location(button0, file, 5, 2, 144);
    			attr_dev(button1, "class", "incomplete btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2 svelte-1hcy0v1");
    			add_location(button1, file, 6, 2, 271);
    			attr_dev(button2, "class", "complete btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2 svelte-1hcy0v1");
    			add_location(button2, file, 7, 2, 402);
    			attr_dev(button3, "class", "btn btn-primary col-6 col-lg-1 col-md-2 mb-2 svelte-1hcy0v1");
    			add_location(button3, file, 8, 2, 529);
    			attr_dev(div1, "class", "mb-3 c-filter svelte-1hcy0v1");
    			add_location(div1, file, 3, 1, 75);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "col-12 col-lg-4 col-md-6 mb-2 svelte-1hcy0v1");
    			add_location(input, file, 11, 2, 665);
    			attr_dev(button4, "class", "btn btn-outline-secondary col-6 col-lg-2 col-md-2 me-2 mb-2 svelte-1hcy0v1");
    			add_location(button4, file, 12, 2, 766);
    			attr_dev(button5, "class", "btn btn-secondary col-6 col-lg-2 col-md-2 me-2 mb-2 svelte-1hcy0v1");
    			add_location(button5, file, 13, 2, 887);
    			attr_dev(div2, "class", "mb-2 c-search svelte-1hcy0v1");
    			add_location(div2, file, 10, 1, 635);
    			attr_dev(th0, "class", "col-2 col-lg-1");
    			add_location(th0, file, 19, 5, 1094);
    			attr_dev(th1, "class", "col-10 col-12");
    			add_location(th1, file, 20, 5, 1134);
    			add_location(tr, file, 18, 4, 1084);
    			add_location(thead, file, 17, 3, 1072);
    			add_location(tbody, file, 23, 3, 1194);
    			attr_dev(table, "class", "table table-dark table-striped");
    			add_location(table, file, 16, 2, 1022);
    			attr_dev(div3, "class", "mb-3");
    			add_location(div3, file, 15, 1, 1001);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file, 1, 0, 15);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h2);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(div1, t7);
    			append_dev(div1, button2);
    			append_dev(div1, t9);
    			append_dev(div1, button3);
    			append_dev(div4, t11);
    			append_dev(div4, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*title*/ ctx[2]);
    			/*input_binding*/ ctx[13](input);
    			append_dev(div2, t12);
    			append_dev(div2, button4);
    			append_dev(div2, t14);
    			append_dev(div2, button5);
    			append_dev(div4, t16);
    			append_dev(div4, div3);
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

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[10], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[11], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[12]),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[14], false, false, false),
    					listen_dev(button5, "click", /*click_handler_5*/ ctx[15], false, false, false)
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
    			if (detaching) detach_dev(div4);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function GetCookie(name) {
    	let result = null,
    		cookieName = name + "=",
    		allcookies = document.cookie,
    		position = allcookies.indexOf(cookieName);

    	if (position != -1) {
    		let startIndex = position + cookieName.length,
    			endIndex = allcookies.indexOf(";", startIndex);

    		if (endIndex == -1) {
    			endIndex = allcookies.length;
    		}

    		result = decodeURIComponent(allcookies.substring(startIndex, endIndex));
    	}

    	return result;
    }

    function instance($$self, $$props, $$invalidate) {
    	let filteredTodoList;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	let title = "",
    		initFocus = null,
    		condition = null,
    		todoList = [],
    		jsondata = GetCookie("data");

    	if (jsondata !== "") {
    		todoList = JSON.parse(jsondata);
    	} else {
    		todoList = [];
    	}

    	onMount(() => {
    		init();
    	});

    	function init() {
    		$$invalidate(2, title = "");
    		initFocus.focus();
    	}

    	function save() {
    		let expire = new Date();
    		expire.setTime(expire.getTime() + 1000 * 3600 * 24);
    		document.cookie = "data=" + JSON.stringify(todoList) + ";expires=" + expire.toUTCString();
    		alert("保存しました");
    	}

    	function add(target) {
    		if (target !== "") {
    			$$invalidate(1, todoList = [...todoList, { id: todoList.length, done: false, title }]);
    			init();
    		} else {
    			alert("タスクを入力してください");
    		}
    	}

    	function del() {
    		$$invalidate(1, todoList = []);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
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
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
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

    	$$self.$capture_state = () => ({
    		onMount,
    		title,
    		initFocus,
    		condition,
    		todoList,
    		jsondata,
    		init,
    		save,
    		GetCookie,
    		add,
    		del,
    		filteredTodoList
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("initFocus" in $$props) $$invalidate(3, initFocus = $$props.initFocus);
    		if ("condition" in $$props) $$invalidate(0, condition = $$props.condition);
    		if ("todoList" in $$props) $$invalidate(1, todoList = $$props.todoList);
    		if ("jsondata" in $$props) jsondata = $$props.jsondata;
    		if ("filteredTodoList" in $$props) $$invalidate(4, filteredTodoList = $$props.filteredTodoList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(4, filteredTodoList = (todoList, condition) => {
    		document.querySelector(".all-btn");
    			document.querySelector(".incomplete");
    			document.querySelector(".complete");

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
    		input_change_handler
    	];
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
