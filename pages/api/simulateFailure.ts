import { simulateFailure } from "@/lib/database";

export default async function handler(req: any, res:any) {
    const {node} = req.query;
    if (node && ['primary', 'replica1', 'replica2'].includes(node)) {
        simulateFailure(node);
        res.status(200).json({message: `Simulated failure for node ${node}`});
    }else{
        res.status(400).json({message: 'Invalid node'});
    }
}