<script lang="ts">
	import type { Question, QuizMeta, ScoreReport } from './types';

	let workspaceMode: 'edit' | 'test' = $state('edit');
	let importModalActive = $state(false);
	let activeQuestionIndex = $state(0);

	let quizMeta: QuizMeta = $state({
		title: 'Avero Global Systems Routing & Framework Protocol Examination'
	});

	let questions: Question[] = $state([
		{
			id: 201,
			text: 'Which transport layer dynamic interface layer handles non-blocking high-frequency streams inside standalone Canvas matrix blocks safely?',
			options: [
				'User Datagram Protocol Matrix Flow',
				'Transmission Control Protocol Handshake',
				'WebRTC DataChannel Router Multiplexing',
				'Bilevel Bitstream Primitives Mapping System'
			],
			correctIndex: 2
		},
		{
			id: 202,
			text: 'What algorithmic pattern failure is explicitly mitigated by freezing mutations inside Avero Test Mode layout routines runtime parameters?',
			options: [
				'Deadlock Configuration Mutex Contention',
				'Reactive Pipeline Synchronization Leakage',
				'Context Cascading Memory Allocation Collisions',
				'State Race Condition Variable Polling Defect'
			],
			correctIndex: 3
		},
		{
			id: 203,
			text: 'How does the Avero Serialization layer clean text pointers when parsing input constants streams from file system parameters?',
			options: [
				'Regex Extraction Index Offset Scanners',
				'JSON Token Parsing Stack Bounds Verification',
				'Abstract Syntax Tree Declarative Token Isolation',
				'Lexical Memory Segment String Splitting Blocks'
			],
			correctIndex: 0
		}
	]);

	let userAnswers: Record<number, number> = $state({});
	let testSubmitted = $state(false);
	let timerTicks = $state(0);
	let timerIntervalPointer: ReturnType<typeof setInterval> | null = null;

	let scoreReport: ScoreReport = $state({ correct: 0, percentage: 0, timeTaken: '00:00' });

	const activeQuestion = $derived(questions[activeQuestionIndex] ?? null);

	const formatTimer = $derived.by(() => {
		const mins = Math.floor(timerTicks / 60);
		const secs = timerTicks % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	});

	function addNewQuestionNode(): void {
		questions.push({
			id: Date.now(),
			text: 'New Question Prompt Vector Text Block Query String',
			options: [
				'Option Variant Element Alpha',
				'Option Variant Element Beta',
				'Option Variant Element Gamma',
				'Option Variant Element Delta'
			],
			correctIndex: 0
		});
		activeQuestionIndex = questions.length - 1;
	}

	function deleteQuestionNode(index: number): void {
		questions.splice(index, 1);
		if (activeQuestionIndex >= questions.length) {
			activeQuestionIndex = Math.max(0, questions.length - 1);
		}
	}

	function addOptionNode(): void {
		if (!activeQuestion) return;
		activeQuestion.options.push(`Option Variant Element ${activeQuestion.options.length + 1}`);
	}

	function deleteOptionNode(oIdx: number): void {
		if (!activeQuestion || activeQuestion.options.length <= 1) return;
		activeQuestion.options.splice(oIdx, 1);

		// Adjust correctIndex if deleted option was active or out of bounds
		if (activeQuestion.correctIndex >= activeQuestion.options.length) {
			activeQuestion.correctIndex = Math.max(0, activeQuestion.options.length - 1);
		}
	}

	function enterTestMode(): void {
		if (questions.length === 0) return alert('Cannot initialize evaluation with empty questions.');
		workspaceMode = 'test';
		userAnswers = {};
		testSubmitted = false;
		timerTicks = 0;

		if (timerIntervalPointer) clearInterval(timerIntervalPointer);
		timerIntervalPointer = setInterval(() => timerTicks++, 1000);
	}

	function returnToEditMode(): void {
		if (timerIntervalPointer) clearInterval(timerIntervalPointer);
		workspaceMode = 'edit';
		testSubmitted = false;
		userAnswers = {};
	}

	function getAnswerTestingStyles(qIdx: number, oIdx: number): string {
		const isSelected = userAnswers[qIdx] === oIdx;
		const correctIdx = questions[qIdx].correctIndex;

		if (!testSubmitted) {
			return isSelected
				? 'border-[#9999FF] bg-[#9999FF]/15 text-white font-bold shadow-[0_0_15px_rgba(153,153,255,0.2)]'
				: 'border-white/10 bg-white/2 text-white/60 hover:border-white/20 hover:bg-white/5';
		}

		if (correctIdx === oIdx)
			return 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400 font-bold';
		if (isSelected && correctIdx !== oIdx)
			return 'border-red-500/80 bg-red-950/40 text-red-400 font-bold';
		return 'border-white/5 bg-white/1 text-white/30 opacity-60';
	}

	function submitFinalizedTestArray(): void {
		const answeredCount = Object.keys(userAnswers).length;
		if (
			answeredCount < questions.length &&
			!confirm(`Only answered ${answeredCount}/${questions.length}. Proceed anyway?`)
		)
			return;

		if (timerIntervalPointer) clearInterval(timerIntervalPointer);
		testSubmitted = true;

		const correctTally = questions.reduce(
			(acc, q, idx) => (userAnswers[idx] === q.correctIndex ? acc + 1 : acc),
			0
		);
		scoreReport = {
			correct: correctTally,
			percentage: Math.round((correctTally / questions.length) * 100),
			timeTaken: formatTimer
		};
	}

	function exportToJsonFile(): void {
		const data = JSON.stringify({ meta: quizMeta, questions }, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const filename = `${quizMeta.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'quiz'}.json`;

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function executeFilePickerStream(targetSubMode: 'edit' | 'test'): void {
		importModalActive = false;
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = (e: Event) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (evt) => {
				try {
					const parsed = JSON.parse(evt.target?.result as string);
					if (parsed?.meta && Array.isArray(parsed.questions)) {
						quizMeta = parsed.meta;
						questions = parsed.questions;
						activeQuestionIndex = 0;
						if (targetSubMode === 'test') {
							enterTestMode();
						} else {
							returnToEditMode();
						}
					} else {
						alert('Invalid JSON structure. Ensure file contains meta and questions array.');
					}
				} catch {
					alert('Failed to parse JSON file.');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}
</script>

<div class="flex h-screen flex-col bg-black font-sans tracking-tight text-white select-none">
	<!-- Header -->
	<header
		class="z-30 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-3 backdrop-blur-md"
	>
		<div class="flex items-center space-x-3">
			<span
				class="bg-linear-to-r from-white via-white to-[#9999FF] bg-clip-text text-xl font-black tracking-wider text-transparent"
				>AVERO</span
			>
			<span
				class="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-[#9999FF] uppercase"
				>Quizzes Engine</span
			>
		</div>

		<div class="flex items-center space-x-3">
			{#if !testSubmitted && workspaceMode === 'test'}
				<div
					class="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 font-mono text-xs text-white/70"
				>
					<span class="h-2 w-2 animate-ping rounded-full bg-red-500"></span>
					<span>ELAPSED: {formatTimer}</span>
				</div>
			{/if}

			{#if workspaceMode === 'edit'}
				<button
					onclick={enterTestMode}
					class="rounded-xl bg-[#9999FF] px-4 py-2 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE]"
					>🚀 Launch Test Mode</button
				>
				<button
					onclick={exportToJsonFile}
					class="rounded-xl border border-white/10 bg-white/3 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/6"
					>Export JSON</button
				>
				<button
					onclick={() => (importModalActive = true)}
					class="rounded-xl border border-[#9999FF]/30 bg-[#9999FF]/10 px-4 py-2 text-xs font-medium text-[#9999FF] hover:bg-[#9999FF]/20"
					>Import Data</button
				>
			{:else if workspaceMode === 'test' && testSubmitted}
				<button
					onclick={returnToEditMode}
					class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
					>Return to Workspace</button
				>
			{/if}
		</div>
	</header>

	<div class="relative flex flex-1 overflow-hidden">
		{#if workspaceMode === 'edit'}
			<aside
				class="z-20 flex w-80 flex-col justify-between border-r border-white/10 bg-black/50 backdrop-blur-xl"
			>
				<div
					class="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-4 overflow-y-auto p-4"
				>
					<div class="space-y-1.5">
						<span class="text-[10px] font-bold tracking-widest text-white/40 uppercase"
							>Quiz Properties</span
						>
						<input
							type="text"
							bind:value={quizMeta.title}
							class="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs text-white outline-none focus:border-[#9999FF]/50"
						/>
					</div>

					<hr class="border-white/5" />

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-bold tracking-widest text-white/40 uppercase"
								>Questions Matrix</span
							>
							<button
								onclick={addNewQuestionNode}
								class="text-[11px] font-bold text-[#9999FF] hover:underline">+ Add Question</button
							>
						</div>

						<div
							class="max-h-65 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-1.5 overflow-y-auto pr-1"
						>
							{#each questions as q, idx (q.id)}
								<div
									role="button"
									tabindex="0"
									onclick={() => (activeQuestionIndex = idx)}
									onkeydown={(e) => e.key === 'Enter' && (activeQuestionIndex = idx)}
									class={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${activeQuestionIndex === idx ? 'border-[#9999FF]/40 bg-[#9999FF]/10 text-white' : 'border-white/5 bg-white/2 text-white/50 hover:bg-white/4'}`}
								>
									<span class="truncate pr-2 font-mono text-xs"
										>#{idx + 1}: {q.text || 'Empty Question'}</span
									>
									<button
										onclick={(e) => {
											e.stopPropagation();
											deleteQuestionNode(idx);
										}}
										class="text-xs font-bold text-white/30 hover:text-red-400">&times;</button
									>
								</div>
							{/each}
						</div>
					</div>

					<hr class="border-white/5" />

					{#if activeQuestion}
						<div class="space-y-3">
							<span class="text-[10px] font-bold tracking-widest text-white/40 uppercase"
								>Node Inspector (#{activeQuestionIndex + 1})</span
							>

							<div class="space-y-1">
								<span class="font-mono text-[10px] text-white/40 uppercase">Prompt Input</span>
								<textarea
									bind:value={activeQuestion.text}
									rows="3"
									class="w-full resize-none rounded-xl border border-white/10 bg-white/3 p-2.5 text-xs text-white outline-none focus:border-[#9999FF]/50"
								></textarea>
							</div>

							<div class="space-y-2">
								<div
									class="flex items-center justify-between font-mono text-[10px] text-white/40 uppercase"
								>
									<span>Options Array</span>
									<button onclick={addOptionNode} class="text-[#9999FF] hover:underline"
										>+ Add Option</button
									>
								</div>

								<div class="space-y-2">
									{#each activeQuestion.options as option, oIdx (oIdx)}
										<div class="flex items-center space-x-2">
											<input
												type="radio"
												name={'correct-' + activeQuestion.id}
												checked={activeQuestion.correctIndex === oIdx}
												onchange={() => (activeQuestion.correctIndex = oIdx)}
												class="h-3.5 w-3.5 cursor-pointer accent-[#9999FF]"
											/>
											<input
												type="text"
												bind:value={activeQuestion.options[oIdx]}
												aria-label={`Option ${oIdx + 1}: ${option}`}
												class="w-full rounded-xl border border-white/10 bg-white/3 px-2.5 py-1.5 text-xs text-white/90 outline-none focus:border-[#9999FF]/50"
											/>
											{#if activeQuestion.options.length > 1}
												<button
													onclick={() => deleteOptionNode(oIdx)}
													class="text-xs font-bold text-white/30 hover:text-red-400">&times;</button
												>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<div
					class="flex justify-between border-t border-white/10 bg-black/80 p-4 font-mono text-[11px] text-white/40"
				>
					<span>Total Items Polled:</span>
					<span class="font-bold text-[#9999FF]">{questions.length} prompts</span>
				</div>
			</aside>

			<main class="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6">
				<div
					class="w-full max-w-2xl rounded-[28px] border border-white/10 bg-white/2 p-8 backdrop-blur-xl transition hover:border-[#9999FF]/20"
				>
					<div class="border-b border-white/10 pb-4">
						<span
							class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-wider text-white/40 uppercase"
							>Live Editor Preview</span
						>
						<h2 class="mt-3 text-xl font-bold tracking-tight text-white">{quizMeta.title}</h2>
					</div>

					{#if activeQuestion}
						<div class="mt-6 space-y-4">
							<p
								class="rounded-2xl border border-white/5 bg-white/3 p-4 text-sm font-medium text-white/80"
							>
								<span class="mr-1 font-mono text-[#9999FF]">Q{activeQuestionIndex + 1}.</span
								>{activeQuestion.text || 'Configure a question prompt...'}
							</p>

							<div class="grid grid-cols-1 gap-2.5">
								{#each activeQuestion.options as opt, oIdx (oIdx)}
									<div
										class={`flex items-center justify-between rounded-xl border p-3.5 font-mono text-xs ${activeQuestion.correctIndex === oIdx ? 'border-[#9999FF]/40 bg-[#9999FF]/10 text-[#9999FF]' : 'border-white/5 bg-white/2 text-white/50'}`}
									>
										<span>{opt || 'Empty Option Field'}</span>
										{#if activeQuestion.correctIndex === oIdx}
											<span
												class="rounded bg-[#9999FF]/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#9999FF] uppercase"
												>Correct Value</span
											>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="py-12 text-center font-mono text-xs text-white/30">
							No question selected.
						</div>
					{/if}
				</div>
			</main>
		{:else if workspaceMode === 'test'}
			<main
				class="flex flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent justify-center overflow-y-auto p-6"
			>
				<div
					class="my-auto w-full max-w-2xl space-y-6 rounded-[28px] border border-white/10 bg-white/2 p-8 shadow-2xl backdrop-blur-xl"
				>
					<div class="flex items-start justify-between border-b border-white/10 pb-4">
						<div>
							<h1 class="text-xl font-black tracking-wide text-white">{quizMeta.title}</h1>
							<p class="mt-1 font-mono text-xs text-white/40">
								Evaluation Cluster Block Sequence &bull; {questions.length} Questions Total
							</p>
						</div>
						{#if testSubmitted}
							<span
								class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/60"
								>SCORING PROCESS FINALIZED</span
							>
						{/if}
					</div>

					<div class="space-y-6">
						{#each questions as q, idx (q.id)}
							<div class="space-y-3 rounded-2xl border border-white/5 bg-white/2 p-4">
								<h3 class="text-sm font-bold text-white/90">
									<span class="mr-1.5 font-mono text-white/40">[{idx + 1}]</span>{q.text}
								</h3>
								<div class="grid grid-cols-1 gap-2">
									{#each q.options as opt, oIdx (oIdx)}
										<button
											disabled={testSubmitted}
											onclick={() => !testSubmitted && (userAnswers[idx] = oIdx)}
											class={`flex items-center justify-between rounded-xl border p-3.5 font-mono text-xs ${getAnswerTestingStyles(idx, oIdx)}`}
										>
											<span>{opt}</span>
											{#if testSubmitted}
												<div class="font-mono text-[9px] font-bold tracking-wider uppercase">
													{#if q.correctIndex === oIdx}<span
															class="rounded border border-emerald-800 bg-emerald-950/80 px-2 py-0.5 text-emerald-400"
															>Correct Target</span
														>
													{:else if userAnswers[idx] === oIdx}<span
															class="rounded border border-red-800 bg-red-950/80 px-2 py-0.5 text-red-400"
															>User Mismatch</span
														>
													{/if}
												</div>
											{/if}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>

					{#if !testSubmitted}
						<div class="flex justify-end border-t border-white/10 pt-4">
							<button
								onclick={submitFinalizedTestArray}
								class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-black tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] hover:bg-[#8888EE]"
								>Submit Assessment Array</button
							>
						</div>
					{:else}
						<div class="space-y-4 rounded-2xl border border-white/10 bg-white/3 p-6 font-mono">
							<h4 class="text-[10px] font-bold tracking-widest text-[#9999FF] uppercase">
								Diagnostic Evaluation Telemetry Log
							</h4>
							<div class="grid grid-cols-3 gap-4 text-xs">
								<div class="rounded-xl border border-white/5 bg-white/2 p-3">
									<span class="block text-[10px] text-white/40">RAW ACCURACY</span><span
										class="mt-1 block text-lg font-black text-white"
										>{scoreReport.correct} / {questions.length}</span
									>
								</div>
								<div class="rounded-xl border border-white/5 bg-white/2 p-3">
									<span class="block text-[10px] text-white/40">PERCENTAGE</span><span
										class="mt-1 block text-lg font-black text-[#9999FF]"
										>{scoreReport.percentage}%</span
									>
								</div>
								<div class="rounded-xl border border-white/5 bg-white/2 p-3">
									<span class="block text-[10px] text-white/40">RESOLUTION TIME</span><span
										class="mt-1 block text-lg font-black text-white/80"
										>{scoreReport.timeTaken}</span
									>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</main>
		{/if}
	</div>

	{#if importModalActive}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
		>
			<div
				class="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-black/90 p-6 shadow-2xl"
			>
				<div class="space-y-1">
					<h3 class="font-mono text-xs font-bold tracking-wider text-white uppercase">
						Select Loading Direct Mode Layer
					</h3>
					<p class="text-xs text-white/40">
						Determine runtime orchestration environments layout profiles.
					</p>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<button
						onclick={() => executeFilePickerStream('edit')}
						class="group space-y-1 rounded-2xl border border-white/10 bg-white/2 p-4 text-center hover:border-[#9999FF]/30 hover:bg-white/5"
					>
						<span class="block text-xl group-hover:scale-110">📝</span>
						<span class="block text-xs font-bold text-white/90">Edit Workspace</span>
					</button>
					<button
						onclick={() => executeFilePickerStream('test')}
						class="group space-y-1 rounded-2xl border border-[#9999FF]/20 bg-[#9999FF]/5 p-4 text-center hover:border-[#9999FF]/50 hover:bg-[#9999FF]/10"
					>
						<span class="block text-xl group-hover:scale-110">🔒</span>
						<span class="block text-xs font-bold text-[#9999FF]">Locked Test Mode</span>
					</button>
				</div>
				<div class="flex justify-end pt-2">
					<button
						onclick={() => (importModalActive = false)}
						class="font-mono text-xs text-white/40 hover:text-white/80">Cancel Pipeline</button
					>
				</div>
			</div>
		</div>
	{/if}
</div>
