
"use client"; 

import { useEffect, useState } from 'react';

const HomePage = () => {
  const [status, setStatus] = useState<string>('');

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

  return (
    <div>
      <h1>Database Connection Status</h1>
      <p>{status}</p>
    </div>
  );
};

export default HomePage;