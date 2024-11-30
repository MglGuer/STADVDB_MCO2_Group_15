import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1 } from '@/lib/database';
import { FieldPacket, RowDataPacket } from 'mysql2';

const addGame = async (req: NextApiRequest, res: NextApiResponse) => {
    const {
        game_id,
        name,
        detailed_description,
        release_date,
        required_age,
        price,
        estimated_owners_min,
        estimated_owners_max,
        dlc_count,
        achievements,
        packages,
        notes,
    } = req.body;

    // Validate input
    if (!game_id || typeof game_id !== 'number') {
        return res.status(400).json({ message: 'Invalid game_id' });
    }
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Invalid name' });
    }
    if (!detailed_description || typeof detailed_description !== 'string') {
        return res.status(400).json({ message: 'Invalid detailed_description' });
    }
    if (!release_date || typeof release_date !== 'string') {
        return res.status(400).json({ message: 'Invalid release_date' });
    }
    if (!required_age || typeof required_age !== 'string') {
        return res.status(400).json({ message: 'Invalid required_age' });
    }
    if (!price || typeof price !== 'number') {
        return res.status(400).json({ message: 'Invalid price' });
    }
    if (!estimated_owners_min || typeof estimated_owners_min !== 'number') {
        return res.status(400).json({ message: 'Invalid estimated_owners_min' });
    }
    if (!estimated_owners_max || typeof estimated_owners_max !== 'number') {
        return res.status(400).json({ message: 'Invalid estimated_owners_max' });
    }
    if (!dlc_count || typeof dlc_count !== 'number') {
        return res.status(400).json({ message: 'Invalid dlc_count' });
    }
    if (!achievements || typeof achievements !== 'number') {
        return res.status(400).json({ message: 'Invalid achievements' });
    }

    // Validate packages as a valid JSON object
    let parsedPackages = null;
    try {
        parsedPackages = JSON.parse(packages);

        if (typeof parsedPackages !== 'object' || Array.isArray(parsedPackages)) {
            return res.status(400).json({ message: 'Packages must be a valid JSON object (not an array)' });
        }
    } catch {
        return res.status(400).json({ message: 'Invalid packages. Must be a valid JSON string.' });
    }

    if (!notes || typeof notes !== 'string') {
        return res.status(400).json({ message: 'Invalid notes' });
    }

    try {
        // Check if game_id already exists
        const checkQuery = 'SELECT COUNT(*) as count FROM dim_game_info WHERE game_id = ?';
        
        // Destructure result correctly (both QueryResult and FieldPacket[])
        const [checkResult]: [RowDataPacket[], FieldPacket[]] = await primaryConnectionNode1.execute(checkQuery, [game_id]);

        // Accessing count from the result
        const gameCount = (checkResult[0] as { count: number }).count;

        if (gameCount > 0) {
            return res.status(400).json({ message: 'Game ID already exists' });
        }

        // Insert query
        const query = `
        INSERT INTO dim_game_info 
        (game_id, name, detailed_description, release_date, required_age, price, estimated_owners_min, estimated_owners_max, dlc_count, achievements, packages, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            game_id,
            name,
            detailed_description,
            release_date,
            required_age,
            price,
            estimated_owners_min,
            estimated_owners_max,
            dlc_count,
            achievements,
            JSON.stringify(parsedPackages),
            notes,
        ];

        await primaryConnectionNode1.execute(query, values);

        return res.status(200).json({ message: 'Game added successfully', game_id });
    } catch (error) {
        const err = error as Error;
        console.error('Database error:', err.message, err.stack);
        return res.status(500).json({ message: 'An error occurred while adding the game' });
    }
};

export default addGame;
