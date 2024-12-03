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

  
  const [connectionToggles, setConnectionToggles] = useState({
    primary: true,
    replica1: true,
    replica2: true,
  });

  
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
    
    setGames([]);
    
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
        
        if (data.reports) {
          setReports(data.reports); 
        } else {
          setReports([]); 
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports([]); 
      }
    }
  };
  

  
  const handleToggleChange = async (node: 'primary' | 'replica1' | 'replica2') => {
    const newStatus = !connectionToggles[node];
    setConnectionToggles({ ...connectionToggles, [node]: newStatus });
  
    
    await fetch(`/api/toggleConnection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node, status: newStatus }),
    });
  };

  return (
    <div>
      <h1>Database Connection Status</h1>
      <div>
        <h3>Status: {status}</h3>
        <p>Primary Node: {connectionToggles.primary ? 'Connected' : 'Disconnected'}</p>
        <p>Replica Node 1: {connectionToggles.replica1 ? 'Connected' : 'Disconnected'}</p>
        <p>Replica Node 2: {connectionToggles.replica2 ? 'Connected' : 'Disconnected'}</p>
      
      </div>


      <div>
        <h2>Manage Connections</h2>
        <label>
          <input
            type="checkbox"
            checked={connectionToggles.primary}
            onChange={() => handleToggleChange('primary')}
          />
          Primary Node
        </label>
        <label>
          <input
            type="checkbox"
            checked={connectionToggles.replica1}
            onChange={() => handleToggleChange('replica1')}
          />
          Replica Node 1
        </label>
        <label>
          <input
            type="checkbox"
            checked={connectionToggles.replica2}
            onChange={() => handleToggleChange('replica2')}
          />
          Replica Node 2
        </label>
      </div>

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
