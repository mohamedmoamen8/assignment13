// tokenService.js

const redis = require('redis');

class TokenService {
    constructor() {
        this.client = redis.createClient();
        this.client.on('error', (err) => console.log('Redis Client Error', err));
    }

    async connect() {
        await this.client.connect();
    }

    async storeToken(userId, token) {
        await this.client.set(userId, token);
    }

    async getToken(userId) {
        return await this.client.get(userId);
    }

    async deleteToken(userId) {
        await this.client.del(userId);
    }

    async disconnect() {
        await this.client.quit();
    }
}

module.exports = new TokenService();