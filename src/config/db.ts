import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
};

export const getConnection = async () => {
  const connection = await mysql.createConnection(dbConfig);
  return connection;
};
