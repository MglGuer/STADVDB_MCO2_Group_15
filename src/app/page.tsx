"use client";
import { useEffect, useState } from 'react';
import AddGameButton from '@/components/addGamebutton';
import UpdateGameButton from '@/components/UpdateGameButton';

interface Game {
  name: string;
  release_date: string;
}

interface Report {
  title: string;
  data: ReportData[];
}

interface ReportData {
  name: string;
  value: string;
}

const HomePage = () => {
  const [status, setStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');  
  const [games, setGames] = useState<Game[]>([]);  
  const [reportsVisible, setReportsVisible] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        const response = await fetch('/api/checkConnection');
        const data = await response.json();
        setStatus(data.message);
      } catch {
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

  const toggleReports = async () => {
    setReportsVisible(!reportsVisible);

    
    if (!reportsVisible) {
      try {
        const response = await fetch('/api/getReports');
        const data = await response.json();
        setReports(data.reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
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

      <div className="mt-10">
        <AddGameButton />
        <UpdateGameButton />
      </div>

      <div className="mt-10">
        <button onClick={toggleReports}>
          {reportsVisible ? 'Hide Reports' : 'Show Reports'}
        </button>

        {reportsVisible && (
          <div>
            <h3>Top 5 Reports:</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {reports.map((report, index) => (
                <li key={index} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                  <h4 style={{ marginBottom: '10px' }}>{report.title}</h4>
                  <ul style={{ paddingLeft: '20px' }}>
                    {report.data.map((item, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>
                        {item.name} - <strong>{item.value}</strong>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
