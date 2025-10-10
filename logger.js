/**
 * 简单的日志工具
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

class Logger {
    constructor(prefix = '') {
        this.prefix = prefix;
    }

    _formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const prefix = this.prefix ? `[${this.prefix}] ` : '';
        let msg = `[${timestamp}] ${prefix}${level}: ${message}`;
        
        if (data !== undefined) {
            if (typeof data === 'object') {
                msg += '\n' + JSON.stringify(data, null, 2);
            } else {
                msg += ' ' + data;
            }
        }
        
        return msg;
    }

    info(message, data) {
        const msg = this._formatMessage('INFO', message, data);
        console.log(`${colors.blue}${msg}${colors.reset}`);
    }

    success(message, data) {
        const msg = this._formatMessage('SUCCESS', message, data);
        console.log(`${colors.green}${msg}${colors.reset}`);
    }

    warn(message, data) {
        const msg = this._formatMessage('WARN', message, data);
        console.warn(`${colors.yellow}${msg}${colors.reset}`);
    }

    error(message, data) {
        const msg = this._formatMessage('ERROR', message, data);
        console.error(`${colors.red}${msg}${colors.reset}`);
    }

    debug(message, data) {
        const msg = this._formatMessage('DEBUG', message, data);
        console.log(`${colors.dim}${msg}${colors.reset}`);
    }

    log(message, data) {
        this.info(message, data);
    }
}

// 创建默认实例
const logger = new Logger();

// 导出默认实例和类
export default logger;
export { Logger };

