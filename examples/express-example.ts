import express from 'express';
import { expressMiddleware } from '@manik3112/guard-stack';

const app = express();
app.use(express.json());

const inMemory = new Map<string, number>();

app.use(
    expressMiddleware({
        currentService: 'service-b',
        trustedIssuers: {
            'service-a': process.env.SERVICE_A_SECRET ?? '',
        },
        nonceStore: {
            add: async (jti, ttlSeconds) => {
                if (inMemory.has(jti)) {
                    return false;
                }

                inMemory.set(jti, Date.now());

                // Example TTL cleanup
                setTimeout(() => {
                    inMemory.delete(jti);
                }, ttlSeconds * 1000);

                return true;
            },
        },
    }),
);

app.post('/payments/create', (req, res) => {
    res.json({
        ok: true,
        caller: req.body,
    });
});
