import type Phaser from 'phaser';

// Define a concrete contract for the data bridge shared between Svelte and Phaser
export interface GameRuntimeBridge {
	gameState: string;
	settings: {
		baseSpeed: number;
		speedStep: number;
		birdSize: number;
		pipeWidth: number;
		gapSize: number;
		extremity: number;
		enemyIntensity: number;
		gravity: number;
		colors: {
			bg: string;
			bird: string;
			pipe: string;
			enemy: string;
		};
	};
	btn: {
		u: boolean;
		d: boolean;
	};
	addPoint: () => void;
}

// Intersecting types for custom properties added dynamically to game objects
type PipeObject = Phaser.GameObjects.Sprite & {
	scored?: boolean;
	partner?: PipeObject;
	body: Phaser.Physics.Arcade.Body;
};

type ThreatObject = Phaser.GameObjects.Sprite & {
	iq?: number;
	body: Phaser.Physics.Arcade.Body;
};

export function createMainGameScene(PhaserLib: typeof Phaser, _runtimeBridge: GameRuntimeBridge) {
	return class MainGame extends PhaserLib.Scene {
		private scoreTarget: number = 0;
		private currentSpeed: number = 500;
		private bird!: Phaser.Physics.Arcade.Sprite;
		private pipes!: Phaser.Physics.Arcade.Group;
		private enemies!: Phaser.Physics.Arcade.Group;
		private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
		private keys!: Record<string, Phaser.Input.Keyboard.Key>;
		private speedEvent!: Phaser.Time.TimerEvent;
		private enemyEvent!: Phaser.Time.TimerEvent;

		constructor() {
			super('MainGame');
		}

		create() {
			const bus = _runtimeBridge;
			this.scoreTarget = 0;
			this.currentSpeed = bus.settings.baseSpeed ?? 500;

			this.cameras.main.setBackgroundColor(bus.settings.colors.bg);

			if (this.textures.exists('bird')) this.textures.remove('bird');
			if (this.textures.exists('pipe')) this.textures.remove('pipe');
			if (this.textures.exists('enemy')) this.textures.remove('enemy');

			this.generateVectorTextures(bus);

			this.particles = this.add.particles(0, 0, 'bird', {
				speed: 80,
				scale: { start: 0.3, end: 0 },
				alpha: { start: 0.5, end: 0 },
				lifespan: 400,
				blendMode: 'ADD'
			});

			const bSize = bus.settings.birdSize || 32;
			this.bird = this.physics.add.sprite(200, this.scale.height / 2, 'bird');
			this.bird.setDisplaySize(bSize, bSize);
			this.bird.setCollideWorldBounds(true);

			// FIX: 'allowGravity' is a property directly on the arcade body object, not nested
			const birdBody = this.bird.body as Phaser.Physics.Arcade.Body;
			birdBody.allowGravity = false;

			this.particles.startFollow(this.bird);

			this.pipes = this.physics.add.group();
			this.enemies = this.physics.add.group();

			const pipeSpacing = 400;
			for (let i = 0; i < 5; i++) {
				this.spawnPipePair(900 + pipeSpacing * i, bus);
			}

			this.physics.add.collider(this.bird, this.pipes, () => this.terminatePipeline());
			this.physics.add.overlap(this.bird, this.enemies, () => this.terminatePipeline());

			this.keys = this.input.keyboard!.addKeys('A,D,W,S,UP,DOWN,SPACE') as Record<
				string,
				Phaser.Input.Keyboard.Key
			>;

			this.speedEvent = this.time.addEvent({
				delay: 10000,
				callback: () => {
					if (bus.gameState === 'playing') this.currentSpeed += bus.settings.speedStep;
				},
				loop: true
			});

			this.enemyEvent = this.time.addEvent({
				delay: 2000,
				callback: () => this.spawnDynamicThreat(bus),
				loop: true
			});

			if (bus.gameState !== 'playing') this.scene.pause();
		}

		generateVectorTextures(bus: GameRuntimeBridge) {
			const hexToColorNum = (hex: string) => parseInt(hex.replace('#', '0x')) || 0xffffff;
			const bSize = bus.settings.birdSize || 32;
			const pWidth = bus.settings.pipeWidth || 60;

			// FIX: In Phaser 3, pass options object as the second argument, configuration parameter name is 'add'
			const gfx = this.make.graphics({ x: 0, y: 0 }, false);

			gfx.fillStyle(hexToColorNum(bus.settings.colors.bird)).fillRect(0, 0, bSize, bSize);
			gfx.generateTexture('bird', bSize, bSize);

			gfx.clear();
			gfx.fillStyle(hexToColorNum(bus.settings.colors.pipe)).fillRect(0, 0, pWidth, 1200);
			gfx.generateTexture('pipe', pWidth, 1200);

			gfx.clear();
			gfx.fillStyle(hexToColorNum(bus.settings.colors.enemy)).fillRect(0, 0, 32, 32);
			gfx.generateTexture('enemy', 32, 32);

			gfx.destroy();
		}

		updateTextures() {
			this.scene.restart();
		}

		spawnPipePair(xPos: number, bus: GameRuntimeBridge) {
			const gap = bus.settings.gapSize;
			const extreme = bus.settings.extremity / 100;
			const range = this.scale.height / 2 - gap / 2 - 50;
			const offset = PhaserLib.Math.Between(-range * extreme, range * extreme);
			const centerY = this.scale.height / 2 + offset;

			// FIX: Made variables immutable to fulfill 'prefer-const'
			const topPipe = this.pipes
				.create(xPos, centerY - gap / 2, 'pipe')
				.setOrigin(0.5, 1) as PipeObject;
			const bottomPipe = this.pipes
				.create(xPos, centerY + gap / 2, 'pipe')
				.setOrigin(0.5, 0) as PipeObject;

			const pWidth = bus.settings.pipeWidth || 60;
			topPipe.setDisplaySize(pWidth, 1200);
			bottomPipe.setDisplaySize(pWidth, 1200);

			[topPipe, bottomPipe].forEach((p) => {
				p.body.allowGravity = false;
				p.body.immovable = true;
				p.body.setVelocityX(-this.currentSpeed);
			});

			topPipe.scored = false;
			topPipe.partner = bottomPipe;
			bottomPipe.partner = topPipe;
		}

		spawnDynamicThreat(bus: GameRuntimeBridge) {
			if (bus.gameState !== 'playing' || bus.settings.enemyIntensity === 0) return;

			let enemy = this.enemies.getFirstDead(false) as ThreatObject | null;
			const spawnX = this.scale.width + 100;
			const spawnY = PhaserLib.Math.Between(100, this.scale.height - 100);

			if (!enemy) {
				enemy = this.enemies.create(spawnX, spawnY, 'enemy') as ThreatObject;
			} else {
				enemy.setActive(true).setVisible(true);
				enemy.setPosition(spawnX, spawnY);
			}

			enemy.body.allowGravity = false;
			enemy.body.setVelocityX(-(this.currentSpeed + 200));
			enemy.iq = bus.settings.enemyIntensity;
		}

		terminatePipeline() {
			const bus = this.registry.get('bus') as GameRuntimeBridge;
			bus.gameState = 'gameover';
			this.scene.pause();
		}

		// FIX: Removed unused 'delta' parameter to clear 'no-unused-vars'
		override update(time: number) {
			const bus = this.registry.get('bus') as GameRuntimeBridge;
			if (bus.gameState !== 'playing') return;

			const moveUp =
				this.keys.A.isDown ||
				this.keys.W.isDown ||
				this.keys.UP.isDown ||
				this.keys.SPACE.isDown ||
				bus.btn.u;
			const moveDown =
				this.keys.D.isDown || this.keys.S.isDown || this.keys.DOWN.isDown || bus.btn.d;

			if (moveUp) {
				this.bird.setVelocityY(-1000);
			} else if (moveDown) {
				this.bird.setVelocityY(1000);
			} else {
				this.bird.setVelocityY(bus.settings.gravity ?? 0);
			}

			let rightmostX = 0;
			this.pipes.getChildren().forEach((gameObject) => {
				const p = gameObject as PipeObject;
				if (p.x > rightmostX) rightmostX = p.x;
			});

			this.pipes.getChildren().forEach((gameObject) => {
				const p = gameObject as PipeObject;
				p.body.setVelocityX(-this.currentSpeed);

				if (p.originY === 1 && !p.scored && p.x < this.bird.x) {
					p.scored = true;
					bus.addPoint();
				}

				if (p.x < -100) {
					if (p.originY === 1) {
						const gap = bus.settings.gapSize;
						const extreme = bus.settings.extremity / 100;
						const range = this.scale.height / 2 - gap / 2 - 50;
						const offset = PhaserLib.Math.Between(-range * extreme, range * extreme);
						const centerY = this.scale.height / 2 + offset;

						p.x = rightmostX + 400;
						p.y = centerY - gap / 2;
						p.scored = false;

						if (p.partner) {
							p.partner.x = p.x;
							p.partner.y = centerY + gap / 2;
						}
					}
				}
			});

			this.enemies.getChildren().forEach((gameObject) => {
				const e = gameObject as ThreatObject;
				if (!e.active) return;

				const iqValue = e.iq ?? 0;
				if (iqValue > 50) {
					const diff = this.bird.y - e.y;
					e.body.setVelocityY(PhaserLib.Math.Clamp(diff, -445, 445));
				} else {
					e.body.setVelocityY(Math.sin(time / 200) * iqValue * 10);
				}

				if (e.x < -200) {
					e.setActive(false).setVisible(false);
					e.body.setVelocity(0, 0);
				}
			});
		}
	};
}
