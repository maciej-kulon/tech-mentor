import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { ElectricalElementsRendererService } from './components/electrical-elements/services/electrical-elements-renderer.service';
import { ElementFactoryService } from './components/electrical-elements/services/element-factory.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    ElectricalElementsRendererService,
    ElementFactoryService,
  ],
};
