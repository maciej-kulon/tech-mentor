import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectricalCadCanvasComponent } from '../electrical-cad-canvas/electrical-cad-canvas.component';
import { Project } from '../electrical-cad-canvas/models/project.model';
import { ToolboxPanelComponent } from '../toolbox-panel/toolbox-panel.component';

// Import Golden Layout properly
import {
  GoldenLayout,
  LayoutConfig,
  ComponentContainer,
  ComponentItemConfig,
  StackItemConfig,
  RowOrColumnItemConfig,
} from 'golden-layout';

@Component({
  selector: 'app-layout-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout-manager.component.html',
  styleUrls: ['./layout-manager.component.scss'],
})
export class LayoutManagerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('layoutContainer', { static: true })
  private layoutContainer!: ElementRef;

  private layoutManager: GoldenLayout | undefined;
  private defaultProject: Project;
  private angularComponentRef = new Map<
    ComponentContainer,
    ComponentRef<unknown>
  >();

  constructor(
    private viewContainerRef: ViewContainerRef,
    private ngZone: NgZone
  ) {
    // Create default project
    this.defaultProject = new Project({
      name: 'Default Project',
      settings: {
        defaultPaperFormat: 'A4',
        units: 'mm',
        defaultBackgroundColor: 'white',
        defaultGridSize: {
          rows: 9,
          columns: 14,
        },
      },
    });
  }

  ngAfterViewInit(): void {
    this.initializeLayout();
  }

  ngOnDestroy(): void {
    this.destroyLayout();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.layoutManager) return;
    // Get container dimensions
    const container = this.layoutContainer.nativeElement as HTMLElement;
    this.layoutManager.updateSize(
      container.clientWidth,
      container.clientHeight
    );
  }

  /**
   * Creates a new component in the right panel
   */
  public addComponentToRightPanel(componentType: string, title: string): void {
    if (!this.layoutManager) return;

    this.ngZone.run(() => {
      try {
        // Add directly to the right column
        const layoutManagerAny = this.layoutManager as any;

        if (layoutManagerAny.root && layoutManagerAny.root.contentItems) {
          const rootContentItems = layoutManagerAny.root.contentItems;

          // First element should be the main row that contains our layout
          if (rootContentItems.length > 0 && rootContentItems[0].contentItems) {
            const mainRowContentItems = rootContentItems[0].contentItems;

            // The second item in the main row should be our right column
            if (mainRowContentItems.length > 1) {
              const rightColumn = mainRowContentItems[1];

              if (rightColumn) {
                // Add the new component to the right column
                rightColumn.addChild({
                  type: 'component',
                  componentType: componentType,
                  title: title,
                  componentState: { label: title },
                });

                console.log('Added new component to right panel');
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to add component', err);
      }
    });
  }

  /**
   * Creates a drag source for a component
   * This can be used to create a button that initiates component dragging
   */
  public createDragSource(
    element: HTMLElement,
    componentType: string,
    title: string
  ): void {
    if (!this.layoutManager) return;

    try {
      // Create a configuration for the component
      const itemConfig = {
        type: 'component',
        componentType: componentType,
        title: title,
        componentState: { label: title },
      };

      // Use 'any' to bypass TypeScript's type checking since the API doesn't match the types
      (this.layoutManager as any).createDragSource(element, itemConfig);

      // Make the element visually indicate it's draggable
      element.style.cursor = 'grab';
      element.title = 'Drag to add to layout';
    } catch (err) {
      console.error('Failed to create drag source', err);
    }
  }

  private initializeLayout(): void {
    console.log('Initializing layout...');

    // Get container dimensions
    const container = this.layoutContainer.nativeElement as HTMLElement;
    console.log('Container dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight,
    });

    // Initial layout configuration
    const layoutConfig: LayoutConfig = {
      root: {
        type: 'column',
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'component',
                componentType: 'toolbox-panel',
                title: 'Toolbox',
                componentState: { label: 'Toolbox' },
                isClosable: false,
              } as ComponentItemConfig,
            ],
            isClosable: false,
            height: 8,
          } as StackItemConfig,
          {
            type: 'row',
            content: [
              {
                type: 'component',
                componentType: 'project-tree',
                title: 'Project Tree',
                componentState: { label: 'Project Tree' },
                width: 20,
              } as ComponentItemConfig,
              {
                type: 'component',
                componentType: 'electrical-cad-canvas',
                title: 'CAD Canvas',
                componentState: { label: 'CAD Canvas' },
                width: 60,
              } as ComponentItemConfig,
              {
                type: 'column',
                content: [
                  {
                    type: 'component',
                    componentType: 'placeholder',
                    title: 'Properties',
                    componentState: { label: 'Properties Panel' },
                    height: 50,
                  } as ComponentItemConfig,
                  {
                    type: 'component',
                    componentType: 'placeholder',
                    title: 'Components',
                    componentState: { label: 'Components Panel' },
                    height: 50,
                  } as ComponentItemConfig,
                ],
                width: 20,
              } as RowOrColumnItemConfig,
            ],
            height: 92,
          } as RowOrColumnItemConfig,
        ],
      },
      settings: {
        showPopoutIcon: true,
        showMaximiseIcon: true,
        showCloseIcon: true,
        reorderEnabled: true,
        popInOnClose: true,
        constrainDragToContainer: false,
        responsiveMode: 'always',
      },
    };

    try {
      // Create new layout manager
      this.layoutManager = new GoldenLayout(this.layoutContainer.nativeElement);
      console.log('Layout manager created');

      // Register component types
      this.registerComponents();
      console.log('Components registered');

      // Register event handlers for drag & drop
      this.setupLayoutEvents();
      console.log('Events setup');

      // Load the layout configuration
      this.layoutManager.loadLayout(layoutConfig);
      console.log('Layout configuration loaded');

      // Update layout size after init
      this.ngZone.runOutsideAngular(() => {
        window.setTimeout(() => {
          this.ngZone.run(() => {
            if (this.layoutManager) {
              this.layoutManager.updateSize(
                container.clientWidth,
                container.clientHeight
              );
              console.log('Layout size updated:', {
                width: container.clientWidth,
                height: container.clientHeight,
              });
            }
          });
        }, 0);
      });
    } catch (error) {
      console.error('Error initializing layout:', error);
    }
  }

  private setupLayoutEvents(): void {
    if (!this.layoutManager) return;

    // Setup drag & drop and other layout events
    this.layoutManager.on('stateChanged', () => {
      console.log('Layout state changed');
    });

    this.layoutManager.on('itemCreated', () => {
      console.log('Item created in layout');
    });

    this.layoutManager.on('itemDestroyed', () => {
      console.log('Item destroyed in layout');
    });

    this.layoutManager.on('windowOpened', () => {
      console.log('Window opened');
    });

    this.layoutManager.on('windowClosed', () => {
      console.log('Window closed');
    });

    // Use type assertion to bypass TypeScript event type limitations
    // Note: These are valid Golden Layout events, but TypeScript definitions are incomplete
    const layoutManagerAny = this.layoutManager as any;

    // Listen for component creation to enhance them
    if (layoutManagerAny.on) {
      layoutManagerAny.on('componentCreated', (component: any) => {
        // Add any component-specific enhancements or event handlers here
        console.log('Component created', component);

        // Check if component has a componentName property
        if (component && component.componentName === 'electrical-cad-canvas') {
          // Get parent of component (usually a stack)
          const parent = component._parent;
          if (parent && parent.header) {
            // You could customize the header here if needed
          }
        }
      });

      // Listen for stack creation to enhance stack headers
      layoutManagerAny.on('stackCreated', (stack: any) => {
        console.log('Stack created', stack);
        // Customize stack headers here if needed
      });
    }
  }

  private registerComponents(): void {
    if (!this.layoutManager) return;

    // Register the toolbox panel component
    this.layoutManager.registerComponentFactoryFunction(
      'toolbox-panel',
      (container: ComponentContainer) => {
        const componentElement = document.createElement('div');
        componentElement.className = 'golden-layout-component';
        componentElement.style.width = '100%';
        componentElement.style.height = '100%';
        container.element.appendChild(componentElement);

        const componentRef = this.viewContainerRef.createComponent(
          ToolboxPanelComponent
        );
        const compElement = componentRef.location.nativeElement;
        componentElement.appendChild(compElement);
        compElement.style.width = '100%';
        compElement.style.height = '100%';
        compElement.style.display = 'block';
        componentRef.changeDetectorRef.detectChanges();
        this.angularComponentRef.set(container, componentRef);
        container.on('resize', () => {
          this.ngZone.runOutsideAngular(() => {
            window.setTimeout(() => {
              this.ngZone.run(() => {
                window.dispatchEvent(new Event('resize'));
                componentRef.changeDetectorRef.detectChanges();
              });
            }, 0);
          });
        });
        container.on('destroy', () => {
          componentRef.destroy();
          this.angularComponentRef.delete(container);
        });
      }
    );

    // Register the project tree component
    this.layoutManager.registerComponentFactoryFunction(
      'project-tree',
      (container: ComponentContainer) => {
        const componentElement = document.createElement('div');
        componentElement.className = 'golden-layout-component';
        componentElement.style.width = '100%';
        componentElement.style.height = '100%';
        container.element.appendChild(componentElement);

        // For now, use placeholder content
        const placeholderElement = document.createElement('div');
        placeholderElement.className = 'placeholder-component';
        placeholderElement.textContent = 'Project Tree';
        componentElement.appendChild(placeholderElement);
      }
    );

    // Register the electrical CAD canvas component
    this.layoutManager.registerComponentFactoryFunction(
      'electrical-cad-canvas',
      (container: ComponentContainer) => {
        // Create wrapper element
        const componentElement = document.createElement('div');
        componentElement.className = 'golden-layout-component';
        componentElement.style.width = '100%';
        componentElement.style.height = '100%';
        container.element.appendChild(componentElement);

        // Create the Angular component using ViewContainerRef
        const componentRef = this.viewContainerRef.createComponent(
          ElectricalCadCanvasComponent
        );
        const component = componentRef.instance;

        // Set the project
        component.project = this.defaultProject;

        // Get the component's DOM element and append it to our wrapper
        const compElement = componentRef.location.nativeElement;
        componentElement.appendChild(compElement);

        // Make sure the component takes up the full space
        compElement.style.width = '100%';
        compElement.style.height = '100%';
        compElement.style.display = 'block';

        // Force change detection
        componentRef.changeDetectorRef.detectChanges();

        // Store the component reference for cleanup
        this.angularComponentRef.set(container, componentRef);

        // Setup resize handling
        container.on('resize', () => {
          this.ngZone.runOutsideAngular(() => {
            window.setTimeout(() => {
              this.ngZone.run(() => {
                // Trigger resize event explicitly
                window.dispatchEvent(new Event('resize'));
                componentRef.changeDetectorRef.detectChanges();
              });
            }, 0);
          });
        });

        // Handle component destruction
        container.on('destroy', () => {
          componentRef.destroy();
          this.angularComponentRef.delete(container);
        });
      }
    );

    // Register a placeholder component for future tool windows
    this.layoutManager.registerComponentFactoryFunction(
      'placeholder',
      (container: ComponentContainer) => {
        const element = container.element;

        // Create placeholder element
        const placeholderElement = document.createElement('div');
        placeholderElement.className = 'placeholder-component';

        // Safely access the label from componentState
        const state = container.state as Record<string, any> | undefined;
        placeholderElement.textContent = state?.['label'] || 'Placeholder';

        // Add to container
        element.appendChild(placeholderElement);
      }
    );
  }

  private destroyLayout(): void {
    if (this.layoutManager) {
      this.layoutManager.destroy();
      this.layoutManager = undefined;
    }

    // Clean up component references
    this.angularComponentRef.forEach(componentRef => {
      componentRef.destroy();
    });
    this.angularComponentRef.clear();
  }
}
