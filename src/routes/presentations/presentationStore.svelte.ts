// src/routes/presentations/presentationStore.svelte.ts
import type { ElementType, Slide, SlideElement } from './types';

export function createPresentationStore() {
	let slides = $state<Slide[]>([
		{
			id: 1,
			background: '#000000',
			elements: [
				{
					id: 101,
					type: 'text',
					content: 'Avero Dark Presentation Module',
					top: 60,
					left: 160,
					fontSize: 40,
					width: 600,
					height: 120,
					color: '#FFFFFF',
					zIndex: 3
				},
				{
					id: 102,
					type: 'text',
					content: 'Built with Avero Pitch Black & Lavender design tokens.',
					top: 200,
					left: 160,
					fontSize: 18,
					width: 500,
					height: 60,
					color: 'rgba(255,255,255,0.5)',
					zIndex: 2
				},
				{
					id: 103,
					type: 'shape',
					width: 640,
					height: 4,
					radius: 2,
					color: '#9999FF',
					top: 280,
					left: 160,
					zIndex: 1
				}
			]
		}
	]);

	let currentSlideIndex = $state(0);
	let selectedElement = $state<SlideElement | null>(null);
	let presentationMode = $state(false);

	const currentSlide = $derived(slides[currentSlideIndex] || null);

	function addSlide() {
		const newId = Date.now();
		slides.push({
			id: newId,
			background: '#000000',
			elements: [
				{
					id: Date.now() + 1,
					type: 'text',
					content: 'New Workspace Slide',
					top: 60,
					left: 100,
					fontSize: 32,
					width: 500,
					height: 80,
					color: '#FFFFFF',
					zIndex: 1
				}
			]
		});
		currentSlideIndex = slides.length - 1;
	}

	function deleteSlide(index: number) {
		if (slides.length <= 1) return;
		slides.splice(index, 1);
		if (currentSlideIndex >= slides.length) {
			currentSlideIndex = slides.length - 1;
		}
	}

	function addElement(type: ElementType) {
		if (!currentSlide) return;

		const maxZ = currentSlide.elements.reduce(
			(max: number, el: SlideElement) => Math.max(max, el.zIndex || 1),
			0
		);

		const baseElement: SlideElement = {
			id: Date.now(),
			type,
			top: 150,
			left: 200,
			zIndex: maxZ + 1
		};

		if (type === 'text') {
			baseElement.content = 'Editable text block';
			baseElement.fontSize = 24;
			baseElement.width = 350;
			baseElement.height = 100;
			baseElement.color = '#FFFFFF';
		} else if (type === 'image') {
			baseElement.content = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';
		} else if (type === 'shape') {
			baseElement.width = 150;
			baseElement.height = 150;
			baseElement.color = '#9999FF';
			baseElement.radius = 16;
		}

		currentSlide.elements.push(baseElement);
		selectedElement = baseElement;
	}

	function deleteElement() {
		if (!selectedElement || !currentSlide) return;
		const targetId = selectedElement.id;
		currentSlide.elements = currentSlide.elements.filter((el: SlideElement) => el.id !== targetId);
		selectedElement = null;
	}

	function changeLayer(direction: 'up' | 'down') {
		if (!selectedElement) return;
		if (!selectedElement.zIndex) selectedElement.zIndex = 1;

		if (direction === 'up') {
			selectedElement.zIndex += 1;
		} else if (direction === 'down' && selectedElement.zIndex > 1) {
			selectedElement.zIndex -= 1;
		}
	}

	function navigateSlide(direction: number) {
		const nextIndex = currentSlideIndex + direction;
		if (nextIndex >= 0 && nextIndex < slides.length) {
			currentSlideIndex = nextIndex;
		}
	}

	function setSlides(newSlides: Slide[]) {
		slides = newSlides;
		currentSlideIndex = 0;
		selectedElement = null;
	}

	return {
		get slides() {
			return slides;
		},
		get currentSlideIndex() {
			return currentSlideIndex;
		},
		set currentSlideIndex(v: number) {
			currentSlideIndex = v;
		},
		get selectedElement() {
			return selectedElement;
		},
		set selectedElement(v: SlideElement | null) {
			selectedElement = v;
		},
		get presentationMode() {
			return presentationMode;
		},
		set presentationMode(v: boolean) {
			presentationMode = v;
		},
		get currentSlide() {
			return currentSlide;
		},
		addSlide,
		deleteSlide,
		addElement,
		deleteElement,
		changeLayer,
		navigateSlide,
		setSlides
	};
}
