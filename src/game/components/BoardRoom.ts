import { GameObjects, Scene } from 'phaser';
import { GameConfig, RoomDefinition } from '../utils/GameConfig';

export class BoardRoom extends GameObjects.Container {
    private definition: RoomDefinition;
    private polygon: Phaser.Geom.Polygon;
    private debugGraphics: GameObjects.Graphics;
    private handles: GameObjects.Arc[] = [];
    private isEditing: boolean = false;

    constructor(scene: Scene, definition: RoomDefinition) {
        super(scene, 0, 0);
        this.definition = definition;
        this.polygon = new Phaser.Geom.Polygon(definition.points);

        // Setup interaction
        this.setInteractive(this.polygon, Phaser.Geom.Polygon.Contains);

        // Debug graphic
        this.debugGraphics = this.scene.add.graphics();
        this.add(this.debugGraphics);

        this.refreshHandles();
        this.setupEvents();
        scene.add.existing(this);
    }

    private refreshHandles() {
        // Clear existing handles
        this.handles.forEach(h => h.destroy());
        this.handles = [];

        this.polygon.points.forEach((point, index) => {
            const handle = this.scene.add.circle(point.x, point.y, 8, this.definition.color, 0.8)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive({ draggable: true })
                .setVisible(this.isEditing);

            handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                handle.x = dragX;
                handle.y = dragY;
                this.polygon.points[index].x = dragX;
                this.polygon.points[index].y = dragY;
                this.updateShape();
            });

            handle.on('dragend', () => {
                this.logCoordinates();
            });

            // Right click to delete node
            handle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown() && this.isEditing && this.polygon.points.length > 3) {
                    this.polygon.points.splice(index, 1);
                    this.refreshHandles();
                    this.updateShape();
                    this.logCoordinates();
                }
            });

            this.handles.push(handle);
            this.add(handle);
        });
    }

    public setEditMode(enabled: boolean) {
        this.isEditing = enabled;
        this.handles.forEach(h => h.setVisible(enabled));
        if (enabled) {
            this.showDebug(0.2);
            this.scene.input.mouse?.disableContextMenu();
        } else {
            this.showDebug(0);
        }
    }

    private updateShape() {
        this.showDebug(0.2);
    }

    private logCoordinates() {
        const coords = this.polygon.points.map(p => `${Math.round(p.x)}, ${Math.round(p.y)}`).join(', ');
        console.log(`Room: ${this.definition.id} Points: [${coords}]`);
    }

    private setupEvents() {
        this.on('pointerover', () => {
            if (!this.isEditing) this.showDebug(0.3);
        });

        this.on('pointerout', () => {
            if (!this.isEditing) this.showDebug(0);
        });

        // Click to add node (edit mode)
        this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isEditing) {
                if (!pointer.rightButtonDown()) {
                    const isOverHandle = this.handles.some(h =>
                        Phaser.Math.Distance.Between(pointer.x, pointer.y, h.x, h.y) < 15
                    );

                    if (!isOverHandle) {
                        this.polygon.points.push({ x: pointer.x, y: pointer.y } as any);
                        this.refreshHandles();
                        this.updateShape();
                        this.logCoordinates();
                    }
                }
            } else {
                // In play mode, emit event for room click
                this.emit('room-clicked', {
                    roomId: this.definition.id,
                    x: pointer.x,
                    y: pointer.y
                });
            }
        });
    }

    public showDebug(alpha: number) {
        this.debugGraphics.clear();
        this.debugGraphics.fillStyle(this.definition.color, alpha);
        this.debugGraphics.fillPoints(this.polygon.points, true);
        this.debugGraphics.lineStyle(2, this.definition.color, alpha > 0 ? 1 : 0);
        this.debugGraphics.strokePoints(this.polygon.points, true);
    }

    public getRandomPoint(): Phaser.Math.Vector2 {
        const bounds = Phaser.Geom.Polygon.GetAABB(this.polygon);
        const point = new Phaser.Math.Vector2();
        const margin = GameConfig.coins.margin;
        let valid = false;
        let attempts = 0;

        const points = this.polygon.points;
        const edges: Phaser.Geom.Line[] = [];
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            edges.push(new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y));
        }

        while (!valid && attempts < 100) {
            // Pick a point within AABB
            point.x = Phaser.Math.Between(bounds.left + margin, bounds.right - margin);
            point.y = Phaser.Math.Between(bounds.top + margin, bounds.bottom - margin);

            // 1. Check if center is inside
            if (this.polygon.contains(point.x, point.y)) {
                // 2. Check if the circle at this point intersects any edge
                const circle = new Phaser.Geom.Circle(point.x, point.y, margin);
                let intersects = false;

                for (const edge of edges) {
                    if (Phaser.Geom.Intersects.LineToCircle(edge, circle)) {
                        intersects = true;
                        break;
                    }
                }

                if (!intersects) {
                    valid = true;
                }
            }
            attempts++;
        }
        return point;
    }

    public contains(x: number, y: number): boolean {
        return this.polygon.contains(x, y);
    }

    public getID(): string {
        return this.definition.id;
    }
}
