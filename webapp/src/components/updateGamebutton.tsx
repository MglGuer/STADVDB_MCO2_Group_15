import React, { useState} from 'react';

enum AgeRequirement {
    E = 'Everyone',
    T = 'Teen',
    M = 'Mature',
    AO = 'Adults Only',
}

const UpdateGameButton = () => {
    const [isStepOneVisible, setIsStepOneVisible] = useState(true);
    const [isStepTwoVisible, setIsStepTwoVisible] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState<AgeRequirement | ''>('');
    const [formData, setFormData] = useState({
        game_id: '',
        name: '',
        detailed_description: '',
        release_date: '',
        required_age: '',
        price: '',
        estimated_owners_min: '',
        estimated_owners_max: '',
        dlc_count: '',
        achievements: '',
        packages: '',
        notes: '',
    });
    const [gameInput, setGameInput] = useState('');
    const [gameIdToUpdate, setGameIdToUpdate] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePackagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const jsonValue = JSON.parse(e.target.value);
            setFormData((prev) => ({ ...prev, packages: JSON.stringify(jsonValue, null, 2) }));
        } catch (error) {
            console.error('Invalid JSON format:', error);
        }
    };

    const fetchGameData = async (input: string) => {
        const response = await fetch(`/api/steamGames/getGame?game_id_or_name=${input}`);
        const data = await response.json();
        if (response.ok && data) {
            setFormData({
                game_id: data.game_id,
                name: data.name,
                detailed_description: data.detailed_description,
                release_date: data.release_date,
                required_age: data.required_age,
                price: data.price.toString(),
                estimated_owners_min: data.estimated_owners_min.toString(),
                estimated_owners_max: data.estimated_owners_max.toString(),
                dlc_count: data.dlc_count.toString(),
                achievements: data.achievements.toString(),
                packages: JSON.stringify(data.packages, null, 2),
                notes: data.notes,
            });
            setSelectedRequirement(data.required_age as AgeRequirement);
            setGameIdToUpdate(data.game_id);
            setIsStepOneVisible(false);
            setIsStepTwoVisible(true);
        } else {
            alert('No game found with that ID or name.');
        }
    };

    const handleStepOneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gameInput.trim() === '') {
            alert('Please provide a game ID or name.');
            return;
        }
        fetchGameData(gameInput);
    };

    const handleStepTwoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formDataToSend = {
            game_id: parseInt(formData.game_id),
            name: formData.name,
            detailed_description: formData.detailed_description,
            release_date: formData.release_date,
            required_age: selectedRequirement,
            price: parseFloat(formData.price),
            estimated_owners_min: parseInt(formData.estimated_owners_min),
            estimated_owners_max: parseInt(formData.estimated_owners_max),
            dlc_count: parseInt(formData.dlc_count),
            achievements: parseInt(formData.achievements),
            packages: formData.packages,
            notes: formData.notes,
        };

        try {
            const response = await fetch(`/api/steamGames/updateGame`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formDataToSend),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Game updated successfully!');
            } else {
                alert(result.message || 'Something went wrong.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred while submitting the form.');
        }
    };

    return (
        <div className="p-4">
            {isStepOneVisible && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Update Game:</h2>
                    <form onSubmit={handleStepOneSubmit}>
                        <div className="mb-4">
                            <input
                                type="text"
                                id="gameInput"
                                value={gameInput}
                                onChange={(e) => setGameInput(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Enter Game ID or Name to update"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Search Game
                        </button>
                    </form>
                </div>
            )}

            {isStepTwoVisible && (
                <div className="mt-4 p-4 border rounded shadow bg-gray-50">
                    <h2 className="text-lg font-semibold mb-2">Update Game Details</h2>
                    <form onSubmit={handleStepTwoSubmit}>
                        {[
                            { label: 'Game ID', name: 'game_id', type: 'number' },
                            { label: 'Name', name: 'name', type: 'text' },
                            { label: 'Detailed Description', name: 'detailed_description', type: 'text' },
                            { label: 'Release Date', name: 'release_date', type: 'date' },
                            { label: 'Price', name: 'price', type: 'number' },
                            { label: 'Estimated Owners (Min)', name: 'estimated_owners_min', type: 'number' },
                            { label: 'Estimated Owners (Max)', name: 'estimated_owners_max', type: 'number' },
                            { label: 'DLC Count', name: 'dlc_count', type: 'number' },
                            { label: 'Achievements', name: 'achievements', type: 'number' },
                            { label: 'Notes', name: 'notes', type: 'text' },
                        ].map(({ label, name, type }) => (
                            <div key={name} className="mb-4">
                                <label htmlFor={name} className="block font-medium mb-1">
                                    {label}
                                </label>
                                <input
                                    type={type}
                                    id={name}
                                    name={name}
                                    className="w-full p-2 border rounded"
                                    placeholder={`Enter ${label.toLowerCase()}`}
                                    value={(formData as any)[name]}
                                    onChange={handleInputChange}
                                />
                            </div>
                        ))}

                        <div className="mb-4">
                            <label htmlFor="ageRequirement" className="block font-medium mb-1">
                                Age Rating
                            </label>
                            <select
                                name="required_age"
                                id="ageRequirement"
                                value={selectedRequirement}
                                onChange={(e) => {
                                    setSelectedRequirement(e.target.value as AgeRequirement);
                                    handleInputChange(e);
                                }}
                                className="w-full p-2 border rounded"
                            >
                                <option value="" disabled>
                                    Select Age Rating
                                </option>
                                {Object.entries(AgeRequirement).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="packages" className="block font-medium mb-1">
                                Packages (JSON)
                            </label>
                            <textarea
                                id="packages"
                                name="packages"
                                className="w-full p-2 border rounded"
                                placeholder="Enter JSON for packages"
                                value={formData.packages}
                                onChange={handlePackagesChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Update Game
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UpdateGameButton;
