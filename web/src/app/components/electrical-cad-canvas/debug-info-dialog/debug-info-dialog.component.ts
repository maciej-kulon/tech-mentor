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
      .editing-notice {
        background-color: #fff8e1;
        padding: 8px;
        border-left: 4px solid #ffc107;
        margin-bottom: 16px;
        font-size: 14px;
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
      // Use relaxed parsing for validation as well
      JSON.parse(this.relaxJsonEscapes(value));
      this.jsonError = null;
    } catch (e) {
      this.jsonError = "Invalid JSON format";
    }
  }

  onSave() {
    if (!this.jsonError) {
      try {
        // Pre-process the string to allow single backslashes
        const relaxed = this.relaxJsonEscapes(this.jsonString);
        const parsedData = JSON.parse(relaxed);

        // Compare with original data
        const originalDataStr = JSON.stringify(this.data);
        const parsedDataStr = JSON.stringify(parsedData);

        console.log("Debug - Original data:", this.data);
        console.log("Debug - Parsed data:", parsedData);
        console.log("Debug - Data changed:", originalDataStr !== parsedDataStr);

        this.dialogRef.close(parsedData);
      } catch (e) {
        // This shouldn't happen since we validate on change
        this.jsonError = "Invalid JSON format";
      }
    }
  }

  onCancel() {
    this.dialogRef.close(undefined);
  }

  /**
   * Converts single backslashes not followed by a valid JSON escape char
   * into double backslashes, so JSON.parse will succeed.
   * Valid JSON escapes: " \ / b f n r t u
   */
  private relaxJsonEscapes(input: string): string {
    // Replace single backslashes not followed by a valid JSON escape char with double backslashes
    // Valid JSON escapes: " \ / b f n r t u
    return input.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  }
}
