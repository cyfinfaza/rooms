<script>
	import { join, connected, room, user, group } from './client'
	// $: console.log($state)
	// join("someroom")
</script>

<main>
	<p>
		{$connected ? 'connected' : 'not connected'}
	</p>
	<input type="text" placeholder="join room" autofocus on:keypress={e=>{
		if(e.key=='Enter'){
			join(e.target.value)
		}
	}}>
	{#if $user.room}
		<h1>
			{$user.id==$room.leader ? 'leader' : 'not leader'}
		</h1>
		<p>
			i am: {$user.id}<br>
			the somecount is {$room.someCount}<br>
			connected users: {$group?.length}<br>
			leader: {$room.leader}<br>
			room: {$user.room}<br>
		</p>
		<h2>Users</h2>
		<ul>
			{#each $group as user}
				<li>
					id: {user.id}<br>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>

</style>