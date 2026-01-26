import { GameObjects, Scene } from 'phaser';

export class Slider {
    public container: GameObjects.Container;

    private track: GameObjects.Graphics;
    private fill: GameObjects.Graphics;
    private handle: GameObjects.Graphics;
    private handleHit: GameObjects.Zone;

    private value: number = 100; // 0..100
    private isDragging: boolean = false;

    private sliderWidth: number;

    private onChange: (value: number) => void;

    // Stored handlers so we can unsubscribe on destroy (prevents stacking listeners)
    private onMove!: (pointer: Phaser.Input.Pointer) => void;
    private onUp!: () => void;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        onChange: (value: number) => void,
        initialValue: number = 50
    ) {
        this.onChange = onChange;
        this.sliderWidth = width;

        this.container = scene.add.container(x, y);

        // --- Track ---
        // Blue track
        this.track = scene.make.graphics({ x: 0, y: -12 });
        this.track.fillStyle(0x3845C8, 1);
        this.track.fillRoundedRect(0, 0, width, 24, 12);

        // --- Fill ---
        // Light brown fill
        this.fill = scene.make.graphics({ x: 4, y: -8 });

        // --- Handle (visual) ---
        this.handle = scene.make.graphics({ x: 0, y: 0 });
        this.drawHandle();

        // Handle hit area
        this.handleHit = scene.add.zone(0, 0, 60, 60).setOrigin(0.5).setInteractive();

        // Add to container
        this.container.add([
            this.track,
            this.fill,
            this.handle,
            this.handleHit
        ]);

        // Start value
        this.setValue(initialValue, false);

        // --- Input wiring ---
        this.handleHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.updateFromPointer(pointer)
        });

        const trackHit = scene
            .add.zone(width / 2, 0, width + 40, 60)
            .setOrigin(0.5)
            .setInteractive();

        this.container.add(trackHit);

        trackHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.updateFromPointer(pointer);
        });

        this.onMove = (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging || !this.container.active) return;
            this.updateFromPointer(pointer);
        };

        this.onUp = () => {
            this.isDragging = false;
        };

        scene.input.on('pointermove', this.onMove);
        scene.input.on('pointerup', this.onUp);

        this.container.bringToTop(trackHit);
        this.container.bringToTop(this.handleHit);
    }

    private updateFromPointer(pointer: Phaser.Input.Pointer) {
        const localPoint = new Phaser.Math.Vector2();

        // Get the world transform matrix of the container and invert it to get local coordinates.
        // This is the robust way to handle nested containers and camera transforms.
        const matrix = this.container.getWorldTransformMatrix();
        matrix.applyInverse(pointer.x, pointer.y, localPoint);

        const localX = localPoint.x;
        const t = Phaser.Math.Clamp(localX / this.sliderWidth, 0, 1);

        const newValue = Math.round(t * 100);
        this.value = newValue;

        this.updateSlider(t * this.sliderWidth);
        this.onChange(this.value);
    }

    private drawHandle() {
        this.handle.clear();
        this.handle.fillStyle(0xffffff, 1);
        this.handle.fillCircle(0, 0, 12);
        this.handle.lineStyle(3, 0x1e4fb9, 1);
        this.handle.strokeCircle(0, 0, 12);
    }

    private updateFill() {
        this.fill.clear();
        const fillWidth = (this.value / 100) * this.sliderWidth;
        // Make sure fillWidth is at least a small amount if value > 0 to maintain rounded look
        const finalWidth = Math.max(fillWidth, this.value > 0 ? 12 : 0);
        this.fill.fillStyle(0xd2f1ff, 1);
        this.fill.fillRoundedRect(0, 0, finalWidth, 16, 8);
    }

    private updateSlider(handleX: number) {
        // handleX is 0..sliderWidth relative to track left
        const localX = handleX;

        this.handle.x = localX;
        this.handleHit.x = localX;

        this.updateFill();
    }

    /**
     * Set slider value (0..100)
     * @param value
     * @param fireCallback whether to call onChange
     */
    public setValue(value: number, fireCallback: boolean = true) {
        this.value = Phaser.Math.Clamp(value, 0, 100);
        this.updateSlider((this.value / 100) * this.sliderWidth);
        if (fireCallback) this.onChange(this.value);
    }

    public getValue() {
        return this.value;
    }

    public destroy() {
        const scene = this.container.scene;

        // Unsubscribe global input listeners (prevents stacking!)
        scene.input.off('pointermove', this.onMove);
        scene.input.off('pointerup', this.onUp);

        if (this.container) {
            this.container.destroy();
        }
    }
}
