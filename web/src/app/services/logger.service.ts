import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  error(message: string): void {
    if (!environment.production) {
      console.error(message);
    }
  }
}
