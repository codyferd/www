<script lang="ts">
	import { onMount, tick } from 'svelte';

	// 1. Pull strict module level typings without hard-importing it at root
	type PeerModule = typeof import('peerjs');
	type PeerClass = PeerModule['Peer'];
	type RealPeerInstance = InstanceType<PeerClass>;

	type BaseConnection = ReturnType<RealPeerInstance['connect']>;
	type PeerConnection = BaseConnection & {
		username?: string;
		metadata?: { username?: string };
	};

	interface ChatMessage {
		id: number | string;
		sender: string;
		text?: string;
		image?: string;
		self?: boolean;
	}

	interface InboundPayload {
		type: 'msg' | 'image' | 'name-announcement';
		username?: string;
		payload?: ChatMessage;
	}

	// State Variables (Svelte 5 Runes)
	let roomId = $state('');
	let username = $state(`User_${Math.floor(Math.random() * 999)}`);
	let inputMessage = $state('');
	let messages = $state<ChatMessage[]>([]);
	let onlineUsers = $state<string[]>([]);
	let isJoined = $state(false);

	// Synchronize local user identity inside the online node listing pool
	$effect(() => {
		if (onlineUsers.length === 0 && username) {
			onlineUsers = [username];
		}
	});

	// Non-reactive orchestration structures
	let peer: RealPeerInstance | null = null;
	let connections = $state<PeerConnection[]>([]);
	let currentIdIndex = 0;
	let roomBaseName = '';
	let messageContainer: HTMLDivElement | null = $state(null);

	let PeerConstructor: PeerClass | null = null;

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const module = await import('peerjs');
			PeerConstructor = module.Peer || module.default;
		}
	});

	async function scrollToBottom() {
		await tick();
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	function initConnection() {
		if (!PeerConstructor) return alert('PeerJS loading... try again in a moment.');
		if (!roomId.trim()) return alert('Please enter a valid Room ID');

		roomBaseName = roomId.trim().toLowerCase();
		currentIdIndex = 0;
		trySequentialConnect();
	}

	function trySequentialConnect() {
		if (!PeerConstructor) return;

		const targetId = `${roomBaseName}_${currentIdIndex}`;

		peer = new PeerConstructor(targetId) as unknown as RealPeerInstance;

		peer.on('open', () => {
			isJoined = true;
			onlineUsers = [username];

			peer?.on('connection', (conn: unknown) => {
				handleInboundConnection(conn as PeerConnection);
			});

			// Attempt connecting to preceding mesh nodes
			for (let i = 0; i < currentIdIndex; i++) {
				const checkId = `${roomBaseName}_${i}`;
				const conn = peer?.connect(checkId, {
					metadata: { username }
				});
				if (conn) {
					handleInboundConnection(conn);
				}
			}
		});

		peer.on('error', (err: unknown) => {
			const errorPayload = err as { type: string };
			if (errorPayload.type === 'unavailable-id') {
				peer?.destroy();
				currentIdIndex++;
				trySequentialConnect();
			} else if (errorPayload.type === 'peer-unavailable') {
				// Peer index isn't occupied, normal during discovery
			} else {
				console.error('Avero Network Error:', err);
			}
		});
	}

	function handleInboundConnection(conn: PeerConnection) {
		if (connections.some((x) => x.peer === conn.peer)) return;

		conn.on('open', () => {
			connections = [...connections, conn];
			conn.username = conn.metadata?.username || `Guest_${conn.peer.split('_').pop()}`;

			conn.send({ type: 'name-announcement', username });
			refreshActiveUserList();

			conn.on('data', (data: unknown) => {
				const inbound = data as InboundPayload;
				if ((inbound.type === 'msg' || inbound.type === 'image') && inbound.payload) {
					messages = [...messages, { ...inbound.payload, self: false }];
					scrollToBottom();
				} else if (inbound.type === 'name-announcement' && inbound.username) {
					conn.username = inbound.username;
					refreshActiveUserList();
				}
			});

			conn.on('close', () => removeClosedConnection(conn.peer));
		});

		conn.on('error', () => removeClosedConnection(conn.peer));
	}

	function removeClosedConnection(peerId: string) {
		connections = connections.filter((x) => x.peer !== peerId);
		refreshActiveUserList();
	}

	function refreshActiveUserList() {
		const names = connections.filter((c) => c.open).map((c) => c.username || 'Unknown Guest');
		onlineUsers = Array.from(new Set([username, ...names]));
	}

	function updateUsernameProfile() {
		refreshActiveUserList();
		if (!isJoined) return;
		connections.forEach((c) => {
			if (c.open) c.send({ type: 'name-announcement', username });
		});
	}

	function handleSendMessage(
		payloadData: { text?: string; image?: string; type: string } | null = null
	) {
		if (!payloadData) {
			if (!inputMessage.trim()) return;
			payloadData = { text: inputMessage, type: 'msg' };
		}

		const standardMessage: ChatMessage = {
			sender: username,
			id: Date.now() + Math.random(),
			...payloadData
		};

		messages = [...messages, { ...standardMessage, self: true }];
		scrollToBottom();

		connections.forEach((c) => {
			if (c.open) {
				c.send({ type: payloadData!.type, payload: standardMessage });
			}
		});

		inputMessage = '';
	}

	function handleImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			handleSendMessage({ image: ev.target?.result as string, type: 'image' });
		};
		reader.readAsDataURL(file);
	}

	function triggerChatImport(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const imported = JSON.parse(ev.target?.result as string);
				messages = [...messages, ...imported];
				scrollToBottom();
			} catch {
				alert('Malformed chat manifest file.');
			}
		};
		reader.readAsText(file);
	}

	function triggerChatExport() {
		const textOnly = messages
			.filter((m) => !m.image)
			.map((m) => ({ sender: m.sender, text: m.text }));
		const blob = new Blob([JSON.stringify(textOnly, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `avero_chat_export_${Date.now()}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="flex h-screen w-full flex-col bg-black font-sans tracking-tight text-white md:flex-row">
	<!-- Sidebar -->
	<aside
		class="flex w-full flex-col gap-5 border-b border-white/10 bg-black p-5 md:w-72 md:border-r md:border-b-0"
	>
		<h1
			class="text-2xl font-black tracking-tighter text-[#9999FF] italic drop-shadow-[0_0_15px_rgba(153,153,255,0.4)]"
		>
			AVERO
		</h1>

		<div class="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
			<input
				bind:value={roomId}
				disabled={isJoined}
				placeholder="Room ID Identifier"
				class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 disabled:opacity-40"
			/>
			<button
				onclick={initConnection}
				disabled={isJoined}
				class="w-full rounded-xl bg-[#9999FF] py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] disabled:opacity-40"
			>
				{isJoined ? 'CONNECTED' : 'JOIN ROOM'}
			</button>
		</div>

		<div class="space-y-2">
			<label class="block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">
				Display Identity
				<input
					bind:value={username}
					oninput={updateUsernameProfile}
					class="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-normal tracking-normal text-white transition duration-300 outline-none focus:border-[#9999FF]/50"
				/>
			</label>
		</div>

		<div class="hidden grow overflow-y-auto md:block">
			<div class="flex items-center gap-2">
				<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
					>Mesh Nodes Online</span
				>
				{#if isJoined}
					<div class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
					</div>
				{/if}
			</div>
			<div class="mt-3 space-y-1.5">
				{#each onlineUsers as user (user)}
					<div
						class="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/80"
					>
						<span class="text-[#9999FF]">▪</span>
						{user}
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
			<button
				onclick={triggerChatExport}
				class="text-left text-[10px] font-black tracking-wider text-white/50 uppercase transition-opacity hover:text-[#9999FF]"
			>
				↑ Export Text Data
			</button>
			<label
				class="cursor-pointer text-left text-[10px] font-black tracking-wider text-white/50 uppercase transition-opacity hover:text-[#9999FF]"
			>
				↓ Import Schema Logs
				<input type="file" onchange={triggerChatImport} class="hidden" accept=".json" />
			</label>
		</div>
	</aside>

	<!-- Main Chat Area -->
	<main class="flex grow flex-col overflow-hidden bg-[#050505]">
		<div
			bind:this={messageContainer}
			class="grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-4 overflow-y-auto p-6"
		>
			{#if messages.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div
						class="max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-12 backdrop-blur-xl"
					>
						<span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase"
							>Avero Network State</span
						>
						<p class="mt-2 text-sm text-white/50">
							{isJoined
								? 'Room ready. Send a message to start communicating.'
								: 'Enter a Room ID in the sidebar to connect to a P2P mesh.'}
						</p>
					</div>
				</div>
			{/if}

			{#each messages as msg (msg.id)}
				<div class="flex flex-col {msg.self ? 'items-end' : 'items-start'}">
					<span class="mb-1 px-1 text-[9px] font-black tracking-wider text-white/30 uppercase"
						>{msg.sender}</span
					>
					<div
						class="inline-block max-w-[80%] rounded-2xl p-4 backdrop-blur-md transition-all duration-300 {msg.self
							? 'rounded-tr-none bg-[#9999FF] font-medium text-black shadow-[0_0_20px_rgba(153,153,255,0.15)]'
							: 'rounded-tl-none border border-white/10 bg-white/5 text-white'}"
					>
						{#if msg.text}
							<p class="text-sm leading-relaxed wrap-break-word">{msg.text}</p>
						{/if}
						{#if msg.image}
							<img
								src={msg.image}
								alt="Uploaded content"
								class="mt-1 max-w-full rounded-xl border border-black/10"
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Chat Input -->
		<div class="border-t border-white/10 bg-black p-4">
			<div class="mx-auto flex max-w-5xl items-center gap-3">
				<label
					class="flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3.5 text-lg transition duration-300 hover:border-[#9999FF]/40 hover:bg-white/10"
				>
					📷
					<input type="file" onchange={handleImageUpload} class="hidden" accept="image/*" />
				</label>

				<input
					bind:value={inputMessage}
					onkeydown={(e) => e.key === 'Enter' && handleSendMessage()}
					placeholder={isJoined
						? 'Transmit encrypted text data pipeline...'
						: 'Join a room to start sending messages...'}
					disabled={!isJoined}
					class="w-full grow rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white placeholder-white/20 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/10 disabled:opacity-40"
				/>

				<button
					onclick={() => handleSendMessage()}
					disabled={!isJoined}
					class="rounded-xl bg-[#9999FF] px-7 py-3.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] disabled:opacity-40"
				>
					SEND
				</button>
			</div>
		</div>
	</main>
</div>
