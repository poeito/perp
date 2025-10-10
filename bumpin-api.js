/**
 * Bumpin API SDK
 * 基于官方API文档实现的JavaScript SDK
 * 支持所有交易、查询和账户管理功能
 */

import crypto from 'crypto';

class BumpinAPI {
    constructor(apiKey, secretKey, baseURL = 'https://api.bumpin.trade/bapi') {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.baseURL = baseURL;
        this.retryCount = 3;
        this.retryDelay = 1000; // 1秒
    }

    /**
     * 生成请求签名
     * @param {string} requestURI - 请求URI路径
     * @param {string} queryString - 查询字符串
     * @param {string} requestBody - 请求体
     * @param {string} userTime - 用户时间戳
     * @returns {string} Base64编码的签名
     */
    generateSignature(requestURI, queryString, requestBody, userTime) {
        const parameterStr = requestURI + 
            (queryString || '') + 
            (requestBody || '') + 
            userTime;
        
        const hmac = crypto.createHmac('sha256', this.secretKey);
        hmac.update(parameterStr);
        return hmac.digest('base64');
    }

    /**
     * 发送HTTP请求
     * @param {string} method - HTTP方法
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} queryParams - 查询参数
     * @returns {Promise<Object>} API响应
     */
    async makeRequest(method, endpoint, data = null, queryParams = null) {
        // 手动构建URL以确保正确拼接baseURL和endpoint
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const fullUrl = `${this.baseURL}/${cleanEndpoint}`;
        const url = new URL(fullUrl);
        
        // 添加查询参数
        if (queryParams) {
            Object.keys(queryParams).forEach(key => {
                url.searchParams.append(key, queryParams[key]);
            });
        }

        const userTime = Math.floor(Date.now() / 1000).toString();
        const requestBody = data ? JSON.stringify(data) : '';
        const queryString = url.search;
        
        // 生成签名 - 对于POST请求，使用完整路径
        const signaturePath = method === 'POST' ? url.pathname + url.search : endpoint;
        const signature = this.generateSignature(
            signaturePath, 
            queryString, 
            requestBody, 
            userTime
        );

        // 构建请求头
        const headers = {
            'X-USER-KEY': this.apiKey,
            'X-USER-SIGN-KEY': signature,
            'X-USER-TIMESTAMP-KEY': userTime,
            'Content-Type': 'application/json'
        };

        const requestOptions = {
            method: method,
            headers: headers
        };

        if (data) {
            requestOptions.body = requestBody;
        }

        try {
            // 输出HTTP请求信息
            console.log('\n=== HTTP请求信息 ===');
            console.log('请求URL:', url.toString());
            console.log('请求方法:', method);
            console.log('请求头:', JSON.stringify(headers, null, 2));
            if (requestBody) {
                console.log('请求体:', requestBody);
            }
            if (queryParams) {
                console.log('查询参数:', JSON.stringify(queryParams, null, 2));
            }
            console.log('========================\n');
            
            const response = await fetch(url.toString(), requestOptions);
            
            // 输出HTTP响应信息
            console.log('\n=== HTTP响应信息 ===');
            console.log('响应状态:', response.status);
            console.log('响应状态文本:', response.statusText);
            console.log('响应头:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
            
            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                console.log('错误响应内容:', errorText.substring(0, 500));
                console.log('========================\n');
                throw new Error(`API请求失败 (${response.status}): ${errorText.substring(0, 200)}`);
            }
            
            // 检查Content-Type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorText = await response.text();
                console.log('非JSON响应内容:', errorText.substring(0, 500));
                console.log('========================\n');
                throw new Error(`服务器返回非JSON响应: ${errorText.substring(0, 200)}`);
            }
            
            const result = await response.json();
            console.log('响应数据:', JSON.stringify(result, null, 2));
            console.log('========================\n');
            
            return result;
        } catch (error) {
            if (error.message.includes('服务器返回非JSON响应') || error.message.includes('API请求失败')) {
                throw error;
            }
            throw new Error(`网络请求错误: ${error.message}`);
        }
    }

    /**
     * 下单接口
     * @param {Object} orderData - 订单数据
     * @returns {Promise<Object>} 下单结果
     */
    async placeOrder(orderData) {
        const requiredFields = [
            'marketIndex', 'isPortfolioMargin', 'isNativeToken', 
            'positionSide', 'orderSide', 'orderType', 'stopType',
            'size', 'orderMargin', 'leverage', 'triggerPrice', 
            'acceptablePrice', 'takeProfitRate'
        ];

        // 验证必需字段
        for (const field of requiredFields) {
            if (!(field in orderData)) {
                throw new Error(`缺少必需字段: ${field}`);
            }
        }

        return await this.makeRequest('POST', '/user/place-order', orderData);
    }

    /**
     * 获取持仓历史
     * @param {number} pageNumber - 页码 (1-100)
     * @param {number} pageSize - 每页大小 (10-200)
     * @returns {Promise<Object>} 持仓历史数据
     */
    async getPositionHistory(pageNumber, pageSize) {
        if (pageNumber < 1 || pageNumber > 100) {
            throw new Error('页码必须在1-100之间');
        }
        if (pageSize < 10 || pageSize > 200) {
            throw new Error('每页大小必须在10-200之间');
        }

        return await this.makeRequest('GET', '/user/position-history', null, {
            pageNumber,
            pageSize
        });
    }

    /**
     * 获取当前持仓
     * @returns {Promise<Object>} 当前持仓数据
     */
    async getCurrentPositions() {
        return await this.makeRequest('GET', '/user/currency-position');
    }

    /**
     * 获取当前订单
     * @returns {Promise<Object>} 当前订单数据
     */
    async getCurrentOrders() {
        return await this.makeRequest('GET', '/user/currency-order');
    }

    /**
     * 获取用户账户信息
     * @returns {Promise<Object>} 账户信息
     */
    async getAccountInfo() {
        return await this.makeRequest('GET', '/user/account');
    }

    /**
     * 获取价格
     * @param {string} symbol - 交易对符号
     * @returns {Promise<Object>} 价格数据
     */
    async getPrice(symbol) {
        if (!symbol) {
            throw new Error('交易对符号不能为空');
        }
        return await this.makeRequest('GET', '/price/get-price', null, { symbol });
    }

    /**
     * 获取市场列表
     * @returns {Promise<Object>} 市场列表数据
     */
    async getMarketList() {
        return await this.makeRequest('GET', '/market/list');
    }

    /**
     * 获取支持的价格符号
     * @returns {Promise<Object>} 支持的符号列表
     */
    async getSupportedSymbols() {
        return await this.makeRequest('GET', '/price/get-symbols');
    }
}

// 导出枚举常量
const OrderSide = {
    NONE: 0,
    LONG: 1,
    SHORT: 2
};

const OrderType = {
    NONE: 0,
    MARKET: 1,
    LIMIT: 2,
    STOP: 3
};

const PositionSide = {
    NONE: 0,
    INCREASE: 1,
    DECREASE: 2
};

const StopType = {
    NONE: 0,
    StopLoss: 1,
    TakeProfit: 2
};

export {
    BumpinAPI,
    OrderSide,
    OrderType,
    PositionSide,
    StopType
};

export default BumpinAPI;

