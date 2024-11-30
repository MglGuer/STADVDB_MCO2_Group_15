import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1 } from '@/lib/database';
import { ResultSetHeader, FieldPacket } from 'mysql2';

const updateGame = async (req: NextApiRequest, res: NextApiResponse) => {
  // Ensure the request is a PUT
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed. Use PUT.' });
    }

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

    // Validate the required `game_id`
    if (!game_id || typeof game_id !== 'number') {
        return res.status(400).json({ message: 'Invalid or missing game_id' });
    }

    try {
        const updates: string[] = [];
        const values: (string | number)[] = [];

        if (name) {
        updates.push('name = ?');
        values.push(name);
        }
        if (detailed_description) {
        updates.push('detailed_description = ?');
        values.push(detailed_description);
        }
        if (release_date) {
        updates.push('release_date = ?');
        values.push(release_date);
        }
        if (required_age) {
        updates.push('required_age = ?');
        values.push(required_age);
        }
        if (price) {
        updates.push('price = ?');
        values.push(price);
        }
        if (estimated_owners_min) {
        updates.push('estimated_owners_min = ?');
        values.push(estimated_owners_min);
        }
        if (estimated_owners_max) {
        updates.push('estimated_owners_max = ?');
        values.push(estimated_owners_max);
        }
        if (dlc_count) {
        updates.push('dlc_count = ?');
        values.push(dlc_count);
        }
        if (achievements) {
        updates.push('achievements = ?');
        values.push(achievements);
        }
        if (packages) {
        updates.push('packages = ?');
        values.push(typeof packages === 'object' ? JSON.stringify(packages) : packages);
        }
        if (notes) {
        updates.push('notes = ?');
        values.push(notes);
        }

        if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update provided' });
        }


        values.push(game_id);


        const query = `UPDATE dim_game_info SET ${updates.join(', ')} WHERE game_id = ?`;


        const [result, fields]: [ResultSetHeader, FieldPacket[]] = await primaryConnectionNode1.execute(query, values);

        if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Game not found or no changes made' });
        }

        return res.status(200).json({ message: 'Game updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'An error occurred while updating the game' });
    }
};

export default updateGame;
