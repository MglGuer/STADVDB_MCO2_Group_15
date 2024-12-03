
interface GamePriceRow {
  name: string;
  price: string | number | null;
}

interface GameOwnersRow {
  name: string;
  estimated_owners_max: number | null;
}

interface GameDLCRow {
  name: string;
  dlc_count: number | null;
}


const reportConfigs = [
  {
    title: 'Top 5 Games by Price',
    query: `SELECT name, price FROM dim_game_info`,
    dateConditionNode2: `WHERE release_date < '2010-01-01'`,
    dateConditionNode3: `WHERE release_date >= '2010-01-01'`,
    sortField: 'price',
    format: (row: GamePriceRow) => ({
      name: row.name,
      value: row.price && !isNaN(parseFloat(row.price as string))
        ? `$${parseFloat(row.price as string).toFixed(2)}`
        : 'N/A',
    }),
  },
  {
    title: 'Top 5 Games by Estimated Owners',
    query: `SELECT name, estimated_owners_max FROM dim_game_info`,
    dateConditionNode2: `WHERE release_date < '2010-01-01'`,
    dateConditionNode3: `WHERE release_date >= '2010-01-01'`,
    sortField: 'estimated_owners_max',
    format: (row: GameOwnersRow) => ({
      name: row.name,
      value: row.estimated_owners_max
        ? row.estimated_owners_max.toLocaleString()
        : 'N/A',
    }),
  },
  {
    title: 'Top 5 Games by DLC Count',
    query: `SELECT name, dlc_count FROM dim_game_info`,
    dateConditionNode2: `WHERE release_date < '2010-01-01'`,
    dateConditionNode3: `WHERE release_date >= '2010-01-01'`,
    sortField: 'dlc_count',
    format: (row: GameDLCRow) => ({
      name: row.name,
      value: row.dlc_count !== null ? row.dlc_count.toString() : 'N/A',
    }),
  },
];
