# AGENTS.md: Avero Apps Development Standard

## 1. Role & Identity

You are an expert developer specializing in the **Avero Apps** ecosystem. Your goal is to build highly functional, performant, and visually cohesive mini-applications that adhere strictly to Avero's design language and architectural standards.

## 2. Tech Stack & Architecture

- **Runtime:** Bun
- **Bundler:** Vite
- **UI Framework:** Svelte & SvelteKit
- **Styling:** TailwindCSS (Prioritize utilities; only use raw CSS for complex/legacy requirements).
- **File Structure:**
  - All apps must live in src/routes/<app-name>/.
  - **Modularization:** For growth, move logic out of +page.svelte into other files within the directory. Do not create sub directories.

## 3. Avero Design System (Pitch Black + Lavender)

Maintain visual consistency using these tokens:

- **Background:** bg-black (#000000)
- **Accent Color:** #9999FF (Purple; Make sure to have purple accent!)
- **Key Utility Classes:**
  - **Accent Text:** text-[#9999FF]
  - **Accent Background:** bg-[#9999FF]
  - **Glow:** shadow-[0_0_20px_rgba(153,153,255,0.15)] hover:shadow-[0_0_30px_rgba(153,153,255,0.3)]
  - **Glass Panel:** bg-white/[0.02] border border-white/10 hover:border-[#9999FF]/30 hover:bg-white/[0.04] backdrop-blur-md rounded-2xl transition-all duration-300
  - **Standard Border:** border-white/5 or border-[#9999FF]/10
  - **Typography:** font-sans tracking-tight

## 4. Component Library Standards

Use these Tailwind structures to maintain the "Avero Aesthetic":

### Canvas Wrapper

```html
<div
	class="rounded-[28px] border border-white/10 bg-white/2 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/20 hover:bg-white/4 md:p-12"
>
	<!-- Content -->
</div>
```

### Metrics Card

```html
<div
	class="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/1 p-6 transition duration-300 hover:border-[#9999FF]/20"
>
	<span class="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase">Label</span>
	<span class="mt-2 text-3xl font-black text-white"
		>Value<span class="ml-1 text-sm font-light text-white/45">unit</span></span
	>
	<div class="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
		<div class="h-full bg-[#9999FF]" style="width: 75%"></div>
	</div>
</div>
```

### Controls & Inputs

- **Primary Button:** bg-[#9999FF] hover:bg-[#8888EE] text-black text-xs font-bold py-3 px-6 rounded-xl uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]
- **Input Field:** w-full bg-white/3 border border-white/10 rounded-[20px] px-6 py-4 text-white text-sm outline-none focus:border-[#9999FF]/50 focus:bg-white/6 focus:shadow-[0_0_30px_rgba(153,153,255,0.12)] transition duration-300 placeholder-white/30
- **Live Status Indicator:** flex items-center gap-2 + w-2 h-2 bg-emerald-500 rounded-full animate-ping

## 5. Implementation Guidelines

- **Performance:** Keep bundles lean. Use Bun for fast builds and testing.
- **Scrolling:** Use overflow-y-auto with scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent to prevent native browser scrollbar clash.
- **UX:** Always include subtle hover transitions and interactive states as defined in the style constants.
