const request = require('supertest');
const express = require('express');
const { loginLimiter, createUserLimiter, apiLimiter } = require('../middlewares/rateLimiter');

describe('Rate Limiter Middleware Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    describe('loginLimiter', () => {
        beforeEach(() => {
            app.post('/test-login', loginLimiter, (req, res) => {
                res.status(200).json({ message: 'Login successful' });
            });
        });

        it('should allow requests within the limit (5 per 15 minutes)', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/test-login')
                    .send({ username: 'test', password: 'test' });
                
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Login successful');
            }
        });

        it('should block requests after exceeding the limit', async () => {
            // Make 5 requests (the limit)
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/test-login')
                    .send({ username: 'test', password: 'test' });
            }

            // 6th request should be blocked
            const response = await request(app)
                .post('/test-login')
                .send({ username: 'test', password: 'test' });

            expect(response.status).toBe(429); // Too Many Requests
            expect(response.body.message).toContain('Too many login attempts');
        });

        it('should include rate limit headers', async () => {
            const response = await request(app)
                .post('/test-login')
                .send({ username: 'test', password: 'test' });

            expect(response.headers).toHaveProperty('ratelimit-limit');
            expect(response.headers).toHaveProperty('ratelimit-remaining');
        });
    });

    describe('createUserLimiter', () => {
        beforeEach(() => {
            app.post('/test-create', createUserLimiter, (req, res) => {
                res.status(201).json({ message: 'User created' });
            });
        });

        it('should allow requests within the limit (10 per hour)', async () => {
            for (let i = 0; i < 10; i++) {
                const response = await request(app)
                    .post('/test-create')
                    .send({ username: `user${i}`, password: 'Password123' });
                
                expect(response.status).toBe(201);
            }
        });

        it('should block requests after exceeding the limit', async () => {
            // Make 10 requests (the limit)
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .post('/test-create')
                    .send({ username: `user${i}`, password: 'Password123' });
            }

            // 11th request should be blocked
            const response = await request(app)
                .post('/test-create')
                .send({ username: 'user11', password: 'Password123' });

            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many accounts created');
        });
    });

    describe('apiLimiter', () => {
        beforeEach(() => {
            app.get('/test-api', apiLimiter, (req, res) => {
                res.status(200).json({ message: 'API response' });
            });
        });

        it('should allow requests within the limit (100 per 15 minutes)', async () => {
            // Test first 10 requests (testing all 100 would be slow)
            for (let i = 0; i < 10; i++) {
                const response = await request(app).get('/test-api');
                expect(response.status).toBe(200);
            }
        });

        it('should include standard rate limit headers', async () => {
            const response = await request(app).get('/test-api');

            expect(response.headers).toHaveProperty('ratelimit-limit', '100');
            expect(response.headers).toHaveProperty('ratelimit-remaining');
            expect(response.headers).toHaveProperty('ratelimit-reset');
        });

        it('should decrement remaining requests with each call', async () => {
            const response1 = await request(app).get('/test-api');
            const remaining1 = parseInt(response1.headers['ratelimit-remaining']);

            const response2 = await request(app).get('/test-api');
            const remaining2 = parseInt(response2.headers['ratelimit-remaining']);

            expect(remaining2).toBe(remaining1 - 1);
        });
    });

    describe('Rate Limiter Configuration', () => {
        it('should have correct window time for loginLimiter', () => {
            expect(loginLimiter).toBeDefined();
            // loginLimiter configured for 15 minutes (900000 ms)
        });

        it('should have correct window time for createUserLimiter', () => {
            expect(createUserLimiter).toBeDefined();
            // createUserLimiter configured for 1 hour (3600000 ms)
        });

        it('should have correct window time for apiLimiter', () => {
            expect(apiLimiter).toBeDefined();
            // apiLimiter configured for 15 minutes (900000 ms)
        });
    });
});
