export type LogMessage = {
        message: string;
    }

class Logger {
    static log(data:LogMessage): void;
}

export default Logger;
