import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbox-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbox-panel">
      <div class="toolbox-tabs">
        <button class="toolbox-tab active">Drawing</button>
      </div>
      <div class="toolbox-tools" tabindex="0">
        <button
          *ngFor="let tool of tools"
          class="toolbox-tool"
          [class.selected]="selectedTool === tool.name"
          (click)="selectTool(tool.name)"
          [attr.aria-label]="tool.label"
          [title]="tool.label">
          <span class="material-icons">{{ tool.icon }}</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./toolbox-panel.component.scss'],
})
export class ToolboxPanelComponent {
  tools = [
    { name: 'select', icon: 'mouse', label: 'Select' },
    { name: 'line', icon: 'show_chart', label: 'Draw Line' },
    { name: 'arc', icon: 'panorama_horizontal', label: 'Draw Arc' },
    { name: 'circle', icon: 'circle', label: 'Draw Circle' },
    { name: 'rect', icon: 'crop_square', label: 'Draw Rectangle' },
    { name: 'path', icon: 'timeline', label: 'Draw Path' },
    { name: 'label', icon: 'title', label: 'Add Label' },
    { name: 'bezier', icon: 'gesture', label: 'Draw Bezier' },
  ];
  selectedTool = 'select';

  selectTool(tool: string) {
    this.selectedTool = tool;
  }
}
