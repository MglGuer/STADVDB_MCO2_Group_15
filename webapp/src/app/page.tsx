"use client"; 

import { useEffect, useState } from 'react';
import AddGameButton from '@/components/addGamebutton';
import UpdateGameButton from '@/components/updateGamebutton';

const HomePage = () => {
  const [status, setStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');  
  const [games, setGames] = useState<any[]>([]);  

  
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        const response = await fetch('/api/checkConnection');
        const data = await response.json();
        setStatus(data.message);
      } catch (error) {
        setStatus('Error checking database connection');
      }
    };

    checkDatabaseConnection();
  }, []);

  
  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/searchGames?name=${searchQuery}`);
      const data = await response.json();
      setGames(data.games);  
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  return (
    <div>
      <h1>Database Connection Status</h1>
      <p>{status}</p>

      <div>
        <h2>Search for a Game</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Enter game name"
        />
        <button onClick={handleSearch}>Search</button>
        
        {games.length > 0 && (
          <div>
            <h3>Search Results:</h3>
            <ul>
              {games.map((game, index) => (
                <li key={index}>
                  {game.name} - {game.release_date}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className='mt-10'>
        <AddGameButton/>
        <UpdateGameButton/>
      </div>
    </div>
  );
};

export default HomePage;