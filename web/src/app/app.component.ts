import { Component } from '@angular/core';
import { ElectricalCadCanvasComponent } from './components/electrical-cad-canvas/electrical-cad-canvas.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [ElectricalCadCanvasComponent],
})
export class AppComponent {
  title = 'tech-mentor';
}
