<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	type Category = 'IMAGE' | 'VIDEO' | 'AUDIO' | '3D' | 'UNKNOWN';

	let mediaUrl = $state<string | null>(null);
	let fileName = $state<string>('');
	let fileCategory = $state<Category>('UNKNOWN');

	let threeContainer = $state<HTMLDivElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	// Three.js Engine References
	let scene: THREE.Scene | null = null;
	let camera: THREE.PerspectiveCamera | null = null;
	let renderer: THREE.WebGLRenderer | null = null;
	let controls: OrbitControls | null = null;
	let animationId: number | null = null;
	let resizeObserver: ResizeObserver | null = null;

	function processFile(file: File | undefined) {
		if (!file) return;

		destroy3DEngine();
		if (mediaUrl) URL.revokeObjectURL(mediaUrl);

		fileName = file.name;
		const extension = file.name.split('.').pop()?.toLowerCase();

		if (file.type.startsWith('image/')) {
			fileCategory = 'IMAGE';
		} else if (file.type.startsWith('video/')) {
			fileCategory = 'VIDEO';
		} else if (file.type.startsWith('audio/')) {
			fileCategory = 'AUDIO';
		} else if (extension === 'gltf' || extension === 'glb') {
			fileCategory = '3D';
		} else {
			fileCategory = 'UNKNOWN';
		}

		mediaUrl = URL.createObjectURL(file);

		if (fileCategory === '3D') {
			setTimeout(() => {
				if (threeContainer && mediaUrl) {
					init3DEngine(threeContainer, mediaUrl);
				}
			}, 50);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.[0]) {
			processFile(target.files[0]);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files?.[0]) {
			processFile(e.dataTransfer.files[0]);
		}
	}

	function resetPlayer() {
		destroy3DEngine();
		if (mediaUrl) URL.revokeObjectURL(mediaUrl);
		if (fileInput) fileInput.value = '';

		mediaUrl = null;
		fileName = '';
		fileCategory = 'UNKNOWN';
	}

	// --- 3D Engine Lifecycle ---
	function init3DEngine(container: HTMLElement, modelUrl: string) {
		destroy3DEngine();

		const width = container.clientWidth || 800;
		const height = container.clientHeight || 500;

		// 1. Scene & Background
		scene = new THREE.Scene();
		scene.background = new THREE.Color('#070707');

		// 2. Camera
		camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
		camera.position.set(0, 0, 5);

		// 3. Renderer
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;
		if (THREE.ColorManagement) THREE.ColorManagement.enabled = true;
		renderer.outputColorSpace = THREE.SRGBColorSpace;

		container.appendChild(renderer.domElement);

		// 4. Orbit Controls
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		// 5. Lighting Pack
		const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
		scene.add(ambientLight);

		const dirLight1 = new THREE.DirectionalLight('#ffffff', 1.5);
		dirLight1.position.set(5, 10, 7);
		scene.add(dirLight1);

		const dirLight2 = new THREE.DirectionalLight('#9999FF', 0.8);
		dirLight2.position.set(-5, -5, -5);
		scene.add(dirLight2);

		// 6. GLTF Loader
		const loader = new GLTFLoader();
		loader.load(
			modelUrl,
			(gltf) => {
				const model = gltf.scene;
				const box = new THREE.Box3().setFromObject(model);
				const size = box.getSize(new THREE.Vector3());
				const center = box.getCenter(new THREE.Vector3());

				model.position.x += model.position.x - center.x;
				model.position.y += model.position.y - center.y;
				model.position.z += model.position.z - center.z;

				const maxDim = Math.max(size.x, size.y, size.z);
				if (maxDim > 0) {
					const scale = 2.5 / maxDim;
					model.scale.set(scale, scale, scale);
				}

				scene?.add(model);
			},
			undefined,
			(err) => console.error('Error loading 3D asset:', err)
		);

		// 7. Responsive Observer
		resizeObserver = new ResizeObserver(() => {
			if (!container || !camera || !renderer) return;
			const w = container.clientWidth;
			const h = container.clientHeight;
			if (w === 0 || h === 0) return;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h);
		});
		resizeObserver.observe(container);

		// 8. Render Loop
		const animate = () => {
			animationId = requestAnimationFrame(animate);
			if (controls) controls.update();
			if (renderer && scene && camera) {
				renderer.render(scene, camera);
			}
		};
		animate();
	}

	function destroy3DEngine() {
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}
		if (resizeObserver) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (controls) {
			controls.dispose();
			controls = null;
		}
		if (renderer) {
			if (renderer.domElement && renderer.domElement.parentNode) {
				renderer.domElement.parentNode.removeChild(renderer.domElement);
			}
			renderer.dispose();
			renderer = null;
		}
		scene = null;
		camera = null;
	}

	onDestroy(() => {
		destroy3DEngine();
		if (mediaUrl) URL.revokeObjectURL(mediaUrl);
	});
</script>

<div
	role="region"
	aria-label="Media drop zone and player canvas"
	class="relative flex h-screen w-screen flex-col overflow-hidden bg-black font-sans text-white select-none"
	ondragover={(e) => e.preventDefault()}
	ondrop={handleDrop}
>
	<!-- Floating Glass HUD Controller Overlay -->
	<div
		class="absolute top-6 left-6 z-40 flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black/60 px-5 py-3.5 backdrop-blur-xl transition-all duration-300 {mediaUrl
			? 'border-[#9999FF]/20 bg-black/80 shadow-[0_20px_40px_rgba(0,0,0,0.6)]'
			: ''}"
	>
		<div class="min-w-0">
			<h1
				class="max-w-[320px] truncate text-sm font-black tracking-tight text-white uppercase md:max-w-125"
			>
				{fileName || 'Avero Player'}
			</h1>
			{#if fileCategory !== 'UNKNOWN'}
				<div class="mt-1 flex items-center gap-2">
					<span
						class="rounded border border-[#9999FF]/30 bg-[#9999FF]/15 px-2 py-0.5 text-[9px] font-black tracking-widest text-[#9999FF]"
					>
						{fileCategory}
					</span>
				</div>
			{/if}
		</div>

		{#if mediaUrl}
			<button
				onclick={resetPlayer}
				class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-bold tracking-wider text-red-400 uppercase transition hover:bg-red-500 hover:text-black"
			>
				Eject
			</button>
		{/if}
	</div>

	<!-- Main Viewport Canvas -->
	<div
		class="absolute inset-0 z-10 flex h-full w-full items-center justify-center overflow-hidden bg-[#020202]"
	>
		{#if !mediaUrl}
			<div
				onclick={() => fileInput?.click()}
				onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
				role="button"
				tabindex="0"
				class="group flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/2 p-12 backdrop-blur-xl transition-all duration-500 hover:border-[#9999FF]/30 hover:bg-white/4"
			>
				<div
					class="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl transition-all duration-300 group-hover:scale-110 group-hover:border-[#9999FF]/50"
				>
					📂
				</div>
				<p class="mb-4 font-mono text-[10px] font-bold tracking-[0.6em] text-white/40 uppercase">
					Drop Media Anywhere
				</p>
				<button
					class="rounded-xl bg-[#9999FF] px-6 py-3 text-xs font-bold tracking-wider text-black uppercase shadow-[0_4px_20px_rgba(153,153,255,0.15)] transition-all duration-300 hover:bg-[#8888EE] hover:shadow-[0_0_25px_rgba(153,153,255,0.35)]"
				>
					Open File Explorer
				</button>
			</div>
		{/if}

		{#if fileCategory === 'VIDEO' && mediaUrl}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video src={mediaUrl} controls autoplay class="h-full w-full object-contain"></video>
		{/if}

		{#if fileCategory === 'IMAGE' && mediaUrl}
			<img src={mediaUrl} alt="Preview" class="h-full w-full object-contain" />
		{/if}

		{#if fileCategory === 'AUDIO' && mediaUrl}
			<div class="flex flex-col items-center justify-center gap-8">
				<div
					class="flex h-36 w-36 animate-pulse items-center justify-center rounded-full border border-[#9999FF]/30 bg-[#9999FF]/10 shadow-[0_0_50px_rgba(153,153,255,0.2)]"
				>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border border-[#9999FF]/40 bg-[#9999FF]/20"
					>
						<div class="h-6 w-6 rounded-full bg-[#9999FF]"></div>
					</div>
				</div>
				<audio src={mediaUrl} controls autoplay class="w-80 invert filter"></audio>
			</div>
		{/if}

		<!-- 3D Viewport -->
		<div
			bind:this={threeContainer}
			class="h-full w-full"
			style:display={fileCategory === '3D' ? 'block' : 'none'}
		></div>
	</div>

	<!-- File Input -->
	<input
		type="file"
		bind:this={fileInput}
		onchange={handleFileSelect}
		accept="image/*,video/*,audio/*,.gltf,.glb"
		class="hidden"
	/>
</div>
