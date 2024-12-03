/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import { createServer, IncomingMessage, request as httpRequest, ServerResponse } from 'http';
import handler_read_game from '../../../pages/api/getGameById';
import handler_update_game from '../../../pages/api/updateGame';
import handler_create_game from '../../../pages/api/addGame';
import { NextApiRequest, NextApiResponse } from 'next';

function createTestServer(handler: (req: NextApiRequest, res: NextApiResponse) => void) {
    return createServer((req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        let body = '';
        
        // Collect body data if present
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            let parsedBody = null;
            if (body) {
                try {
                    parsedBody = JSON.parse(body);
                } catch (error) {
                    console.error('Failed to parse request body:', error);
                }
            }
            
            // Mock NextApiRequest
            const mockReq = {
                ...req,
                query: Object.fromEntries(url.searchParams.entries()),
                method: req.method,
                headers: req.headers,
                body: parsedBody,
            } as unknown as NextApiRequest;

            // Mock NextApiResponse
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
    });
}

// Test case for concurrent transactions reading the same data item
describe('Concurrent Reads of the same Data Item', () => {
    let server1:any, server2:any, server3:any;

    beforeAll(() => {
        server1 = createTestServer(handler_read_game);
        server2 = createTestServer(handler_read_game);
        server3 = createTestServer(handler_read_game);
    });

    afterAll(() => {
        server1.close();
        server2.close();
        server3.close();
    });


    it('should return the same data item for 3 concurrent reads from different servers', async () => {
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
    });
});

// Test case for concurrent transactions with one update and concurrent reads
describe('Concurrent Update and Read of the same Data Item', () => {
    let server1: any, server2: any, server3: any;

    beforeAll(() => {
        server1 = createTestServer(handler_read_game);
        server2 = createTestServer(handler_read_game);
        server3 = createTestServer(handler_update_game);
    });

    afterAll(() => {
        server1.close();
        server2.close();
        server3.close();
    });

    it('should perform a concurrent read and update of the same data item', async () => {
        // Insert initial data
        const gameCreator = createTestServer(handler_create_game);
        const gameData = {
            game_id: 1234567,
            name: 'Sample Game',
            detailed_description: 'A detailed description',
            release_date: '2024-12-01',
            required_age: 'E',
            price: "29.99",
            estimated_owners_min: 100000,
            estimated_owners_max: 500000,
            dlc_count: 0,
            achievements: 0,
            packages: JSON.stringify([{
                subs: [{
                    text: 'Sample Game - $29.99',
                    price: 29.99,
                    description: ''
                }],
                title: 'Buy Sample Game',
                description: ''
            }]),
            notes: ''
        };

        const response = await request(gameCreator).post('/api/addGame').set('Content-Type', 'application/json').send(gameData);
        expect(response.status).toBe(200);
        gameCreator.close();

        const readRequest1 = request(server1).get('/api/getGameById?id=1234567');
        const readRequest2 = request(server2).get('/api/getGameById?id=1234567');
        const updateRequest = request(server3).put('/api/updateGame').send({
            game_id: 1234568,
            name: 'Updated Sample Game',
            detailed_description: 'Updated description',
            release_date: '2024-12-01T00:00:00.000Z',
            required_age: 'E',
            price: "39.99",
            estimated_owners_min: 150000,
            estimated_owners_max: 600000,
            dlc_count: 1,
            achievements: 1,
            packages: JSON.stringify([{
                subs: [{
                    text: 'Updated Sample Game - $39.99',
                    price: 39.99,
                    description: ''
                }],
                title: 'Buy Updated Sample Game',
                description: ''
            }]),
            notes: 'Updated notes'
        });

        const [readResponse1, readResponse2, updateResponse] = await Promise.all([readRequest1, readRequest2, updateRequest]);

        expect(updateResponse.status).toBe(200);
        expect(readResponse1.status).toBe(200);
        expect(readResponse2.status).toBe(200);


        expect(readResponse1.body.game.name).toBe('Updated Sample Game');
        expect(readResponse2.body.game.name).toBe('Updated Sample Game');
    });
});