import request from 'supertest';
import { createServer, IncomingMessage, request as httpRequest, ServerResponse } from 'http';
import handler_read_game from '../../../pages/api/getGameById';
import { NextApiRequest, NextApiResponse } from 'next';

function createTestServer(handler: (req: NextApiRequest, res: NextApiResponse) => void) {
    return createServer((req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const mockReq = {
            ...req,
            query: Object.fromEntries(url.searchParams.entries()),
            method: req.method,
            headers: req.headers,
            body: null,
        } as unknown as NextApiRequest;

        const mockRes = {
            status: (statusCode: number) => {
                res.statusCode = statusCode;
                return mockRes;
            },
            json: (body: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body));
            },
            setHeader: (name: string, value: string) => {
                res.setHeader(name, value);
            },
            end: (data?: string) => {
                if (data) {
                    res.write(data);
                }
                res.end();
            },
        } as unknown as NextApiResponse;

        handler(mockReq, mockRes);
    });
}

// Test case for concurrent transactions reading the same data item
describe('Concurrent Reads of the same Data Item', () => {
    it('should return the same data item for 3 concurrent reads from different servers', async () => {
        const server1 = createTestServer(handler_read_game);
        const server2 = createTestServer(handler_read_game);
        const server3 = createTestServer(handler_read_game);

        // Simulate concurrent requests
        const request1 = request(server1).get('/api/getGameById?id=50');
        const request2 = request(server2).get('/api/getGameById?id=50');
        const request3 = request(server3).get('/api/getGameById?id=50');

        const [response1, response2, response3] = await Promise.all([request1, request2, request3]);

        // Verify that the status code is 200 and that the body matches the expected structure
        [response1, response2, response3].forEach((response, index) => {
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                game: {
                    game_id: 50,
                    name: 'Half-Life: Opposing Force',
                    detailed_description: 'Return to the Black Mesa Research Facility as one of the military specialists assigned to eliminate Gordon Freeman. Experience an entirely new episode of single player action. Meet fierce alien opponents, and experiment with new weaponry. Named \'Game of the Year\' by the Academy of Interactive Arts and Sciences.',
                    release_date: '1999-10-31T15:00:00.000Z',
                    required_age: 'E',
                    price: "4.99",
                    estimated_owners_min: 5000000,
                    estimated_owners_max: 10000000,
                    dlc_count: 0,
                    achievements: 0,
                    packages: [{
                        subs: [{
                            text: 'Opposing Force - $4.99',
                            price: 4.99,
                            description: ''
                        }],
                        title: 'Buy Half-Life: Opposing Force',
                        description: ''
                    }],
                    notes: ''
                }
            });
        });

        server1.close();
        server2.close();
        server3.close();
    });
});

// Test case for concurrent transactions reading the same data item from different servers
