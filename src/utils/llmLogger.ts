import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class LLMLogger {
  private enabled: boolean = __DEV__;

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const platform = Platform.OS;
    const prefix = `[LLM ${level}] [${platform}] ${timestamp}:`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: any) {
    this.log(LogLevel.ERROR, message, error);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const llmLogger = new LLMLogger();
