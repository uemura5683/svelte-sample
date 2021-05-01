<!-- HTML部 -->
<div class="container">
	<h2 class="h3 mb-3">タスク管理ツール</h2>
	<div class="mb-3">
		<div class="col-12 mb-2">絞り込み:</div>
		<button on:click={() => { condition = null }} class="btn btn-primary col-3 col-lg-1 col-md-2 me-2">すべて</button>
		<button on:click={() => { condition = false }} class="btn btn-primary col-3 col-lg-1 col-md-2 me-2">未完了</button>
		<button on:click={() => { condition = true }} class="btn btn-primary col-3 col-lg-1 col-md-2">完了</button>
	</div>
	<div class="mb-2">
		<input type="text" bind:value={title} bind:this={initFocus} class="col-12 col-lg-4 col-md-6 mb-2">
		<button on:click={() => add(title)} class="btn btn-outline-secondary col-5 col-lg-2 col-md-2 mb-2">タスク追加</button>
		<button on:click={() => del()} class="btn btn-secondary col-5 col-lg-2 col-md-2 mb-2">全て削除</button>
	</div>
	<div class="mb-3">
		<table class="table table-dark table-striped">
			<thead>
				<tr>
					<th>タスク</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredTodoList(todoList, condition)  as todo (todo.id)}
				<tr>
				<td class="mb-1">
					<input class="form-check-input" type="checkbox" bind:checked={todo.done} id="{todo.id}"> 
					<label for="{todo.id}" class="form-check-label">{todo.title}</label>
				</td>
				</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
<script>
	import { onMount } from 'svelte'

	let title = ''
	let initFocus = null
	let condition = null
	let todoList = [
	]

	onMount(() => {
		init()
	})

	function init() {
		title = ''
		initFocus.focus()
	}

	function add(target) {
		if( target !== '' ) {
			todoList = [...todoList,
			{
				id: todoList.length,
				done: false,
				title
			}]
			init()
		} else {
			alert('タスクを入力してください'); 
		}
	}

	function del() {
		todoList = [];
	}

	$: filteredTodoList = (todoList, condition) => {
		return condition === null
						? todoList
						: todoList.filter(t => t.done === condition)
	}
</script>