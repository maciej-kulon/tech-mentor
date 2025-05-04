import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { LayoutManagerComponent } from "./components/layout-manager/layout-manager.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, LayoutManagerComponent],
  template: `
    <main>
      <h1>Welcome to Tech Mentor</h1>
      <app-layout-manager></app-layout-manager>
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
      app-layout-manager {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class AppComponent {
  title = "tech-mentor";
}
