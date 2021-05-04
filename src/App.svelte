<!-- HTML部 -->
<div class="container">
	<h2 class="h3 mb-3">タスク管理ツール</h2>
	<div class="mb-3 c-filter">
		<div class="col-12 mb-2">絞り込み:</div>
		<button on:click={() => { condition = null }} class="all-btn btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2">すべて</button>
		<button on:click={() => { condition = false }} class="incomplete btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2">未完了</button>
		<button on:click={() => { condition = true }} class="complete btn btn-primary col-6 col-lg-1 col-md-2 me-2 mb-2">完了</button>
		<button on:click={() => save()} class="btn btn-primary col-6 col-lg-1 col-md-2 mb-2">保存</button>
	</div>
	<div class="mb-2 c-search">
		<input type="text" bind:value={title} bind:this={initFocus} class="col-12 col-lg-4 col-md-6 mb-2">
		<button on:click={() => add(title)} class="btn btn-outline-secondary col-6 col-lg-2 col-md-2 me-2 mb-2">タスク追加</button>
		<button on:click={() => del()} class="btn btn-secondary col-6 col-lg-2 col-md-2 me-2 mb-2">全て削除</button>
	</div>
	<div class="mb-3">
		<table class="table table-dark table-striped">
			<thead>
				<tr>
					<th class="col-2 col-lg-1">連番</th>
					<th class="col-10 col-12">タスク</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredTodoList(todoList, condition)  as todo (todo.id)}
				<tr>
				<td class="col-2 col-lg-1">
					{todo.id + 1}
				</td>
				<td class="col-10 col-12">
					<input class="form-check-input me-2" type="checkbox" bind:checked={todo.done} id="{todo.id}"> 
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
	let todoList = []
	let jsondata = GetCookie('data');

	if( jsondata !== '' ) {
		console.log(jsondata);
		todoList = [
			{ id: 0, done: false, title: 'レストランを予約する'},
			// { id: 1, done: false, title: 'サプライズ用の指輪を買う'},
			// { id: 2, done: false, title: 'フラッシュモブダンスを練習する'},
		]
	} else {
		todoList = []
	}

	
	onMount(() => {
		init()
	})

	function init() {
		title = ''
		initFocus.focus()
	}

	function save () {
		let expire   = new Date()

  	    expire.setTime( expire.getTime() + 1000 * 3600 * 24 );
		let todolists = "id=0&done=false&title=レストランを予約する,id=1&done=false&title=サプライズ用の指輪を買う,id=2&done=true&title=フラッシュモブダンスを練習する";

		document.cookie = 'data=' + todolists + ';expires=' + expire.toUTCString();
	}

	function GetCookie( name ){
		var result = null;

		var cookieName = name + '=';
		var allcookies = document.cookie;

		var position = allcookies.indexOf( cookieName );
		if( position != -1 )
		{
			var startIndex = position + cookieName.length;

			var endIndex = allcookies.indexOf( ';', startIndex );
			if( endIndex == -1 )
			{
				endIndex = allcookies.length;
			}

			result = decodeURIComponent(
				allcookies.substring( startIndex, endIndex ) );
		}
		return result;
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

		let   all_btn    = document.querySelector('.all-btn')
		    , incomp_btn = document.querySelector('.incomplete')
			, comp_btn   = document.querySelector('.complete');

		return condition === null
						? todoList
						: todoList.filter(t => t.done === condition)


	// switch (condition){
	// 	case true:
	// 		all_btn.classList.add('is_active');
	// 	break;
	// 	case false:
	// 		incomp_btn.classList.add('is_active');
	// 	break;
	// 	default:
	// 		comp_btn.classList.add('is_active');
	// 	break;
	// }

}
</script>
<style>
	@media (max-width: 767px) {
		.c-search,
		.c-filter {
			font-size: 0;
		}
		.c-search input,
		.c-filter div {
			font-size: 1rem;
		}
		.c-search .btn,
		.c-filter .btn {
			width: calc(50% - .25rem);
		}
		.c-search .btn:nth-child(2n + 1),
		.c-filter .btn:nth-child(2n + 1){
			margin-right: 0 !important;
		}
	}
</style>