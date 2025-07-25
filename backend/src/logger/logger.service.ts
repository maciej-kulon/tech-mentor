import { Injectable } from '@nestjs/common';
import { createLogDash } from '@logdash/js-sdk';

@Injectable()
export class LoggerService {
  private readonly logdash;

  constructor() {
    // Initialize Logdash with the API key
    this.logdash = createLogDash({
      apiKey: 'm3y0bIbdGukv8Ih27bzcYddaCTzZfM9b',
    });
  }

  /**
   * Get the logger instance from Logdash
   */
  public get logger() {
    return this.logdash.logger;
  }

  public log(message: string, ...meta: unknown[]) {
    this.logdash.logger.log(message, ...meta);
  }

  /**
   * Log info message
   */
  public info(message: string, ...meta: unknown[]) {
    this.logdash.logger.info(message, ...meta);
  }

  /**
   * Log error message
   */
  public error(message: string, ...meta: unknown[]) {
    this.logdash.logger.error(message, ...meta);
  }

  /**
   * Log warning message
   */
  public warn(message: string, ...meta: unknown[]) {
    this.logdash.logger.warn(message, ...meta);
  }

  /**
   * Log debug message
   */
  public debug(message: string, ...meta: unknown[]) {
    this.logdash.logger.debug(message, ...meta);
  }
}
