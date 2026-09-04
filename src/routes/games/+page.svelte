<script lang="ts">
  import sourcesData from './sources.json';
  import gamesData from './games.json';
  import type { Source, Game } from './types';

  let searchQuery = $state('');
  let activeTab: 'all' | 'games' | 'sources' = $state('all');
  let openDropdownId: string | null = $state(null);

  const sources: Source[] = sourcesData;
  const games: Game[] = gamesData;

  let filteredGames = $derived(
    games.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.sources.some(s => s.source.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  let filteredSources = $derived(
    sources.filter(source =>
      source.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function toggleDropdown(gameName: string, event: MouseEvent) {
    event.stopPropagation();
    openDropdownId = openDropdownId === gameName ? null : gameName;
  }

  function closeDropdowns() {
    openDropdownId = null;
  }
</script>

<svelte:window onclick={closeDropdowns} />

<div class="min-h-screen bg-black text-white p-6 md:p-12 font-sans tracking-tight selection:bg-[#9999FF]/30 selection:text-[#9999FF]">
  <div class="max-w-6xl mx-auto space-y-8">
    
    <div class="rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-10 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            AVERO <span class="text-[#9999FF]">GAMES</span>
          </h1>
          <p class="text-xs text-white/40 tracking-wider uppercase mt-1">Directory & Mirror Hub</p>
        </div>
        
        <div class="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full w-fit">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Ecosystem Online</span>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-4">
        <div class="relative w-full">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search games or sources..."
            class="w-full bg-white/3 border border-white/10 rounded-[20px] px-6 py-4 pr-12 text-white text-sm outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)] transition duration-300 placeholder-white/30"
          />
          {#if searchQuery}
            <button 
              onclick={() => searchQuery = ''}
              class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full transition"
              aria-label="Clear search"
            >
              ✕
            </button>
          {/if}
        </div>

        <div class="flex gap-2 bg-white/3 border border-white/10 p-1.5 rounded-[20px] shrink-0">
          <button 
            onclick={() => activeTab = 'all'} 
            class="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 {activeTab === 'all' ? 'bg-[#9999FF] text-black shadow-[0_4px_20px_rgba(153,153,255,0.15)]' : 'text-white/60 hover:text-white'}">
            All
          </button>
          <button 
            onclick={() => activeTab = 'games'} 
            class="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 {activeTab === 'games' ? 'bg-[#9999FF] text-black shadow-[0_4px_20px_rgba(153,153,255,0.15)]' : 'text-white/60 hover:text-white'}">
            Games ({filteredGames.length})
          </button>
          <button 
            onclick={() => activeTab = 'sources'} 
            class="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 {activeTab === 'sources' ? 'bg-[#9999FF] text-black shadow-[0_4px_20px_rgba(153,153,255,0.15)]' : 'text-white/60 hover:text-white'}">
            Sources ({filteredSources.length})
          </button>
        </div>
      </div>
    </div>

    <div class="space-y-10">
      
      {#if activeTab === 'all' || activeTab === 'games'}
        <section class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">Index / Games</span>
            <span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase">{filteredGames.length} Results</span>
          </div>

          <div class="grid grid-cols-1 gap-4">
            {#each filteredGames as game (game)}
              <div class="bg-white/2 border border-white/10 hover:border-[#9999FF]/30 hover:bg-white/4 backdrop-blur-md rounded-2xl transition-all duration-300 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_0_20px_rgba(153,153,255,0.05)] hover:shadow-[0_0_30px_rgba(153,153,255,0.15)]">
                <div>
                  <h2 class="text-xl font-bold text-white tracking-tight">{game.name}</h2>
                  <p class="text-xs text-white/40 mt-1">
                    Primary Host: <span class="text-white/70 font-semibold">{game.sources[0]?.source || 'None'}</span>
                  </p>
                </div>

                <div class="flex items-center gap-3 relative">
                  {#if game.sources.length > 0}
                    <a
                      href={game.sources[0].link}
                      target="_blank"
                      rel="noopener noreferrer external"
                      class="bg-[#9999FF] hover:bg-[#8888EE] text-black text-xs font-bold py-3 px-6 rounded-xl uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)] flex items-center gap-2"
                    >
                      Play Game
                      <span class="text-[10px]">↗</span>
                    </a>
                  {/if}

                  {#if game.sources.length > 1}
                    <div class="relative">
                      <button
                        onclick={(e) => toggleDropdown(game.name, e)}
                        class="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-2"
                      >
                        +{game.sources.length - 1} More Mirror{game.sources.length - 1 > 1 ? 's' : ''}
                        <span class="text-[10px] transition-transform duration-200 {openDropdownId === game.name ? 'rotate-180' : ''}">▼</span>
                      </button>

                      {#if openDropdownId === game.name}
                        <div class="absolute right-0 mt-2 w-56 bg-black/95 border border-white/10 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div class="text-[10px] font-black tracking-[0.15em] text-white/30 uppercase px-3 py-1.5 border-b border-white/5">
                            Select Alternate Source
                          </div>
                          <div class="mt-1 space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            {#each game.sources.slice(1) as altSource (altSource)}
                              <a
                                href={altSource.link}
                                target="_blank"
                                rel="noopener noreferrer external"
                                class="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-white/70 hover:text-black hover:bg-[#9999FF] transition duration-200 group"
                              >
                                <span class="font-medium">{altSource.source}</span>
                                <span class="text-[10px] opacity-50 group-hover:opacity-100">↗</span>
                              </a>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="p-8 text-center text-white/30 text-sm border border-dashed border-white/10 rounded-2xl">
                No games match your query.
              </div>
            {/each}
          </div>
        </section>
      {/if}

      {#if activeTab === 'all' || activeTab === 'sources'}
        <section class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">Index / Source Domains</span>
            <span class="text-[10px] font-black tracking-[0.25em] text-[#9999FF] uppercase">{filteredSources.length} Listed</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each filteredSources as source (source)}
              <a
                href={source.link}
                target="_blank"
                rel="noopener noreferrer external"
                class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 transition duration-300 hover:border-[#9999FF]/20 hover:bg-white/3 group"
              >
                <div>
                  <span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">Domain Host</span>
                  <div class="mt-2 text-xl font-bold text-white group-hover:text-[#9999FF] transition-colors flex items-center justify-between">
                    {source.name}
                    <span class="text-sm text-white/30 group-hover:text-[#9999FF] transition-colors">↗</span>
                  </div>
                </div>
                <div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div class="h-full bg-[#9999FF] transition-all duration-300" style="width: 100%"></div>
                </div>
              </a>
            {:else}
              <div class="p-8 text-center text-white/30 text-sm border border-dashed border-white/10 rounded-2xl col-span-full">
                No sources match your query.
              </div>
            {/each}
          </div>
        </section>
      {/if}

    </div>
  </div>
</div>
