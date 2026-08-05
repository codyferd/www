<script lang="ts">
	import { contactsStore } from './contactsStore.svelte';

	let fileInputEl = $state<HTMLInputElement | null>(null);

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			contactsStore.importJSON(target.files[0]);
			target.value = '';
		}
	}
</script>

<div class="flex h-full w-full flex-col bg-black font-sans tracking-tight text-white select-none">
	<!-- Top Navigation / Toolbar -->
	<header
		class="flex items-center justify-between border-b border-white/5 bg-white/1 px-6 py-4 backdrop-blur-md"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#9999FF]/30 bg-[#9999FF]/10 text-[#9999FF] shadow-[0_0_15px_rgba(153,153,255,0.2)]"
			>
				📇
			</div>
			<div>
				<h1 class="text-lg font-bold tracking-tight text-white">Avero Contacts</h1>
				<p class="text-xs text-white/40">Manage your network database securely</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<input
				type="file"
				accept=".json"
				class="hidden"
				bind:this={fileInputEl}
				onchange={handleFileChange}
			/>

			<button
				onclick={() => fileInputEl?.click()}
				class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition-all duration-300 hover:border-[#9999FF]/40 hover:bg-white/10 hover:text-white"
			>
				📥 Import JSON
			</button>

			<button
				onclick={() => contactsStore.exportJSON()}
				class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition-all duration-300 hover:border-[#9999FF]/40 hover:bg-white/10 hover:text-white"
			>
				📤 Export JSON
			</button>

			<button
				onclick={() => contactsStore.startNewContact()}
				class="rounded-xl bg-[#9999FF] px-5 py-2.5 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
			>
				+ New Contact
			</button>
		</div>
	</header>

	<!-- Main App Area -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Left Sidebar List -->
		<aside class="flex w-80 flex-col border-r border-white/5 bg-black/40">
			<!-- Search bar -->
			<div class="border-b border-white/5 p-4">
				<input
					type="text"
					placeholder="Search name, phone, email..."
					bind:value={contactsStore.searchQuery}
					class="w-full rounded-[20px] border border-white/10 bg-white/3 px-4 py-3 text-xs text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
				/>
			</div>

			<!-- Contact Cards List -->
			<div
				class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-2 overflow-y-auto p-4"
			>
				{#each contactsStore.filteredContacts as contact (contact.id)}
					{@const isSelected = contactsStore.selectedContactId === contact.id}
					<button
						onclick={() => contactsStore.selectContact(contact)}
						class="w-full rounded-2xl border p-4 text-left transition-all duration-300 {isSelected
							? 'border-[#9999FF]/50 bg-white/6 shadow-[0_0_20px_rgba(153,153,255,0.1)]'
							: 'border-white/5 bg-white/2 hover:border-[#9999FF]/20 hover:bg-white/4'}"
					>
						<div class="flex items-center justify-between">
							<span class="text-sm font-bold text-white">{contact.name}</span>
							{#if contact.customAttributes.length > 0}
								<span
									class="rounded-full bg-[#9999FF]/10 px-2 py-0.5 text-[10px] font-medium text-[#9999FF]"
								>
									{contact.customAttributes.length} attr
								</span>
							{/if}
						</div>
						<p class="mt-1 text-xs text-white/50">
							{contact.phoneNumber || contact.email || 'No contact info'}
						</p>
					</button>
				{:else}
					<div class="py-12 text-center text-xs text-white/30">No contacts found</div>
				{/each}
			</div>
		</aside>

		<!-- Right Content Pane / Details & Form -->
		<main
			class="flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent overflow-y-auto bg-linear-to-br from-black to-white/1 p-8"
		>
			{#if contactsStore.isEditing || (!contactsStore.selectedContact && contactsStore.contacts.length === 0)}
				<!-- Editor Form View -->
				<div
					class="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
				>
					<h2 class="mb-6 text-xl font-black text-white">
						{contactsStore.selectedContactId ? 'Edit Contact' : 'Create New Contact'}
					</h2>

					<div class="space-y-5">
						<!-- Editor Form View -->
						<div
							class="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
						>
							<h2 class="mb-6 text-xl font-black text-white">
								{contactsStore.selectedContactId ? 'Edit Contact' : 'Create New Contact'}
							</h2>

							<div class="space-y-5">
								<div>
									<label class="block">
										<span
											class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
											>Full Name</span
										>
										<input
											type="text"
											bind:value={contactsStore.formName}
											placeholder="e.g. John Doe"
											class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
										/>
									</label>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block">
											<span
												class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
												>Phone Number</span
											>
											<input
												type="text"
												bind:value={contactsStore.formPhone}
												placeholder="+1 (555) 000-0000"
												class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
											/>
										</label>
									</div>
									<div>
										<label class="block">
											<span
												class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
												>Email Address</span
											>
											<input
												type="email"
												bind:value={contactsStore.formEmail}
												placeholder="john@example.com"
												class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
											/>
										</label>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="block">
											<span
												class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
												>Birthdate</span
											>
											<input
												type="date"
												bind:value={contactsStore.formBirthdate}
												class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
											/>
										</label>
									</div>
									<div>
										<label class="block">
											<span
												class="mb-2 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
												>Address</span
											>
											<input
												type="text"
												bind:value={contactsStore.formAddress}
												placeholder="Street, City, Country"
												class="w-full rounded-[20px] border border-white/10 bg-white/3 px-6 py-4 text-sm text-white placeholder-white/30 transition duration-300 outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)]"
											/>
										</label>
									</div>
								</div>

								<!-- Custom Attributes Section -->
								<div class="mt-5 border-t border-white/5 pt-5">
									<div class="mb-3 flex items-center justify-between">
										<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
											>Custom Attributes</span
										>
										<button
											onclick={() => contactsStore.addAttribute()}
											class="text-xs font-bold text-[#9999FF] hover:underline"
											>+ Add Attribute</button
										>
									</div>
									<div class="space-y-3">
										{#each contactsStore.formAttributes as attr (attr.id)}
											<div class="flex items-center gap-3">
												<input
													type="text"
													bind:value={attr.key}
													placeholder="Key (e.g. Discord)"
													class="flex-1 rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
												/>
												<input
													type="text"
													bind:value={attr.value}
													placeholder="Value (e.g. user#123)"
													class="flex-1 rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
												/>
												<button
													onclick={() => contactsStore.removeAttribute(attr.id)}
													class="px-2 text-xs text-red-400 hover:text-red-300">✕</button
												>
											</div>
										{/each}
									</div>
								</div>

								<!-- Form Actions -->
								<div class="flex items-center justify-end gap-3 border-t border-white/5 pt-6">
									<button
										onclick={() => contactsStore.selectContact(contactsStore.selectedContact)}
										class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase hover:bg-white/10"
									>
										Cancel
									</button>
									<button
										onclick={() => contactsStore.saveContact()}
										class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:bg-[#8888EE]"
									>
										Save Contact
									</button>
								</div>
							</div>
						</div>
						<!-- Custom Attributes Section -->
						<div class="mt-5 border-t border-white/5 pt-5">
							<div class="mb-3 flex items-center justify-between">
								<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
									>Custom Attributes</span
								>
								<button
									onclick={() => contactsStore.addAttribute()}
									class="text-xs font-bold text-[#9999FF] hover:underline">+ Add Attribute</button
								>
							</div>
							<div class="space-y-3">
								{#each contactsStore.formAttributes as attr (attr.id)}
									<div class="flex items-center gap-3">
										<input
											type="text"
											bind:value={attr.key}
											placeholder="Key (e.g. Discord)"
											class="flex-1 rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
										/>
										<input
											type="text"
											bind:value={attr.value}
											placeholder="Value (e.g. user#123)"
											class="flex-1 rounded-xl border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#9999FF]/50"
										/>
										<button
											onclick={() => contactsStore.removeAttribute(attr.id)}
											class="px-2 text-xs text-red-400 hover:text-red-300">✕</button
										>
									</div>
								{/each}
							</div>
						</div>

						<!-- Form Actions -->
						<div class="flex items-center justify-end gap-3 border-t border-white/5 pt-6">
							<button
								onclick={() => contactsStore.selectContact(contactsStore.selectedContact)}
								class="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold tracking-wider text-white uppercase hover:bg-white/10"
							>
								Cancel
							</button>
							<button
								onclick={() => contactsStore.saveContact()}
								class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:bg-[#8888EE]"
							>
								Save Contact
							</button>
						</div>
					</div>
				</div>
			{:else if contactsStore.selectedContact}
				<!-- View Mode -->
				{@const contact = contactsStore.selectedContact}
				<div
					class="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20"
				>
					<div class="flex items-start justify-between border-b border-white/5 pb-6">
						<div class="flex items-center gap-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#9999FF]/30 bg-[#9999FF]/10 text-2xl font-black text-[#9999FF] shadow-[0_0_20px_rgba(153,153,255,0.15)]"
							>
								{contact.name.charAt(0).toUpperCase()}
							</div>
							<div>
								<h2 class="text-2xl font-black text-white">{contact.name}</h2>
								<p class="mt-1 text-xs text-white/40">
									Added {new Date(contact.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={() => (contactsStore.isEditing = true)}
								class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:border-[#9999FF]/30 hover:bg-white/10"
							>
								Edit
							</button>
							<button
								onclick={() => contactsStore.deleteContact(contact.id)}
								class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
							>
								Delete
							</button>
						</div>
					</div>

					<div class="mt-8 grid grid-cols-2 gap-6">
						<div class="rounded-2xl border border-white/5 bg-white/1 p-5">
							<span
								class="mb-1 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Phone Number</span
							>
							<span class="text-sm font-medium text-white"
								>{contact.phoneNumber || 'Not specified'}</span
							>
						</div>
						<div class="rounded-2xl border border-white/5 bg-white/1 p-5">
							<span
								class="mb-1 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Email Address</span
							>
							<span class="text-sm font-medium text-white">{contact.email || 'Not specified'}</span>
						</div>
						<div class="rounded-2xl border border-white/5 bg-white/1 p-5">
							<span
								class="mb-1 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Birthdate</span
							>
							<span class="text-sm font-medium text-white"
								>{contact.birthdate || 'Not specified'}</span
							>
						</div>
						<div class="rounded-2xl border border-white/5 bg-white/1 p-5">
							<span
								class="mb-1 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Address</span
							>
							<span class="text-sm font-medium text-white"
								>{contact.address || 'Not specified'}</span
							>
						</div>
					</div>

					{#if contact.customAttributes.length > 0}
						<div class="mt-8">
							<span
								class="mb-3 block text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
								>Custom Attributes</span
							>
							<div class="grid grid-cols-2 gap-3">
								{#each contact.customAttributes as attr (attr)}
									<div
										class="flex items-center justify-between rounded-xl border border-white/5 bg-white/1 p-4"
									>
										<span class="text-xs text-white/50">{attr.key}</span>
										<span class="text-xs font-bold text-[#9999FF]">{attr.value}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div class="mb-3 text-4xl">👤</div>
					<h3 class="text-sm font-bold text-white/70">No contact selected</h3>
					<p class="mt-1 text-xs text-white/40">
						Select a contact from the sidebar or create a new one.
					</p>
				</div>
			{/if}
		</main>
	</div>
</div>
