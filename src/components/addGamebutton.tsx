import React, { useState } from 'react';

enum AgeRequirement {
    E = 'Everyone',
    T = 'Teen',
    M = 'Mature',
    AO = 'Adults Only',
}

const AddGameButton = () => {
    const [isFormVisible, setIsFormVisible] = useState(false);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePackagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = e.target;
        setFormData((prev) => ({ ...prev, packages: value })); // Raw value for validation later
    };

    const toggleFormVisibility = () => {
        setIsFormVisible((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Validate JSON for packages
        let validPackages;
        try {
            validPackages = JSON.parse(formData.packages);
            if (typeof validPackages !== 'object' || Array.isArray(validPackages)) {
                throw new Error('Packages must be a valid JSON object (not an array).');
            }
        } catch (error) {
            console.error('Invalid JSON for packages:', error);
            alert('Packages must be a valid JSON object.');
            return;
        }

        const formDataToSend = {
            ...formData,
            game_id: parseInt(formData.game_id),
            price: parseFloat(formData.price),
            estimated_owners_min: parseInt(formData.estimated_owners_min),
            estimated_owners_max: parseInt(formData.estimated_owners_max),
            dlc_count: parseInt(formData.dlc_count),
            achievements: parseInt(formData.achievements),
            required_age: selectedRequirement,
            packages: validPackages,  // Send parsed JSON
        };

        try {
            const response = await fetch('/api/addGame', {  // Removed .ts
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formDataToSend),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Game added successfully!');
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
            <h2 className="text-xl font-semibold mb-4">Add Game:</h2>
            <button
                onClick={toggleFormVisibility}
                className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
            >
                {isFormVisible ? 'Hide Form' : 'Add Game'}
            </button>
            {isFormVisible && (
                <div className="mt-4 p-4 border rounded shadow bg-gray-50">
                    <h2 className="text-lg font-semibold mb-2">Add Game Details</h2>
                    <form onSubmit={handleSubmit}>
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
                                onChange={(e) => setSelectedRequirement(e.target.value as AgeRequirement)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="" disabled>Select Age Rating</option>
                                {Object.entries(AgeRequirement).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
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
                                placeholder='{"example": "value"}'
                                value={formData.packages}
                                onChange={handlePackagesChange}
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Submit
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AddGameButton;