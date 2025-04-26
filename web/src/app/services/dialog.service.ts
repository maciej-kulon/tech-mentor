import { Injectable } from "@angular/core";
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";

/**
 * A service that provides Promise-based dialog methods as an alternative to RxJS Observables.
 * This allows us to use MatDialog without RxJS dependencies in our application code.
 */
@Injectable({
  providedIn: "root",
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  /**
   * Opens a modal dialog with the given component and returns a Promise
   * that resolves with the dialog result when the dialog is closed.
   */
  open<T, R = any>(
    component: ComponentType<T>,
    config?: MatDialogConfig<any>
  ): Promise<R | undefined> {
    const dialogRef = this.dialog.open<T, any, R>(component, config);

    return new Promise<R | undefined>((resolve) => {
      dialogRef.afterClosed().subscribe((result) => {
        resolve(result);
      });
    });
  }

  /**
   * Closes all open dialogs
   */
  closeAll(): void {
    this.dialog.closeAll();
  }
}
