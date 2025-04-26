import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

/**
 * A service that provides Promise-based HTTP methods as an alternative to RxJS Observables.
 * This allows us to use HttpClient without RxJS dependencies in our application code.
 */
@Injectable({
  providedIn: "root",
})
export class HttpService {
  constructor(private http: HttpClient) {}

  /**
   * Performs a GET request and returns a Promise
   */
  get<T>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.http.get<T>(url).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Performs a POST request and returns a Promise
   */
  post<T>(url: string, body: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.http.post<T>(url, body).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Performs a PUT request and returns a Promise
   */
  put<T>(url: string, body: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.http.put<T>(url, body).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Performs a DELETE request and returns a Promise
   */
  delete<T>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.http.delete<T>(url).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
  }
}
