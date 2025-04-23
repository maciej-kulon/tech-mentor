import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ElectricalCadCanvasComponent } from './components/electrical-cad-canvas/electrical-cad-canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ElectricalCadCanvasComponent],
  template: `
    <main>
      <h1>Welcome to Tech Mentor</h1>
      <app-electrical-cad-canvas></app-electrical-cad-canvas>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      main {
        padding: 1rem;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      h1 {
        color: #333;
      }
      app-electrical-cad-canvas {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class AppComponent {
  title = 'tech-mentor';
}
