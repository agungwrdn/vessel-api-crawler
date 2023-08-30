const async = require('async');
const sql = require('mssql');
require('dotenv').config();

const sqlConfig = {
  server: process.env.sqlServer,
  user: process.env.sqlUser,
  password: process.env.sqlPwd,
  database: process.env.sqlDb,
  port: parseInt(process.env.sqlPort),
  connectionTimeout: 30000,
  options: {
    trustedConnection: false,
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
};

async function connectToSqlServer() {
  try {
    await sql.connect(sqlConfig);
    console.log('Connected to SQL Server');
  } catch (error) {
    console.error('Error connecting to SQL Server:', error);
    process.exit(1);
  }
}

async function generateCodes(startString, endString) {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
  const base = characters.length;

  let startIndex = 0;
  let endIndex = Math.pow(base, 6) - 1;

  if (startString) {
    startIndex = convertToDecimal(startString.toLowerCase());
  }

  if (endString) {
    endIndex = convertToDecimal(endString.toLowerCase());
  }

  // Set to collect unique codes
  const codesSet = new Set();

  for (let i = startIndex; i <= endIndex; i++) {
    let code = '';
    let num = i;

    // Convert the decimal number to base 36 (alphanumeric)
    while (num > 0) {
      code = characters[num % base] + code;
      num = Math.floor(num / base);
    }

    // Pad the code with leading zeros if necessary
    code = code.padStart(6, '0');
    codesSet.add(code.toUpperCase());

    if (codesSet.size === 100000) {
      await insertData(Array.from(codesSet));
      codesSet.clear();
    }
  }

  if (codesSet.size > 0) {
    await insertData(Array.from(codesSet));
  }
}

function convertToDecimal(code) {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
  const base = characters.length;

  let decimal = 0;
  for (let i = 0; i < code.length; i++) {
    decimal = decimal * base + characters.indexOf(code[i]);
  }

  return decimal;
}

async function insertData(data) {
  try {
    console.log('Inserting batch of', data.length, 'rows');
    const table = new sql.Table('TracknTrace.dbo.qr_list');
    table.columns.add('id_qr', sql.VarChar, { nullable: false });
    table.columns.add('unique_random', sql.VarChar, { nullable: true });

    for (const value of data) {
      const random = await generateRandomAlphabet(3);
      table.rows.add(value, random);
    }

    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    const res = await request.bulk(table);

    console.log(res.rowsAffected);
  } catch (error) {
    console.error('Error:', error);
  }
}

function generateRandomAlphabet(length) {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

async function run() {
  try {
    await connectToSqlServer();
    await generateCodes('0YMCTR', 'ZZZZZZ');
    console.log('Code generation completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
