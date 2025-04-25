import { Component, Inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: "app-debug-info-dialog",
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Debug Information</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="json-editor">
        <mat-label>Edit JSON</mat-label>
        <textarea
          matInput
          [(ngModel)]="jsonString"
          (ngModelChange)="validateJson($event)"
          rows="10"
        ></textarea>
        <mat-error *ngIf="jsonError">{{ jsonError }}</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSave()"
        [disabled]="!!jsonError"
      >
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .json-editor {
        width: 100%;
      }
      textarea {
        font-family: monospace;
        min-height: 200px;
      }
    `,
  ],
})
export class DebugInfoDialogComponent implements OnInit {
  jsonString: string = "";
  jsonError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DebugInfoDialogComponent>
  ) {}

  ngOnInit() {
    // Initialize with formatted JSON
    this.jsonString = JSON.stringify(this.data, null, 2);
  }

  validateJson(value: string) {
    try {
      JSON.parse(value);
      this.jsonError = null;
    } catch (e) {
      this.jsonError = "Invalid JSON format";
    }
  }

  onSave() {
    if (!this.jsonError) {
      try {
        const parsedData = JSON.parse(this.jsonString);
        this.dialogRef.close(parsedData);
      } catch (e) {
        // This shouldn't happen since we validate on change
        this.jsonError = "Invalid JSON format";
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
