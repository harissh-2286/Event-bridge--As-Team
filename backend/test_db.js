const mysql = require('mysql2');

console.log('Connecting to Clever Cloud MySQL...');
const connection = mysql.createConnection({
  host: 'bcbzgb0udqcjpj2copna-mysql.services.clever-cloud.com',
  user: 'ugw3ip2ythdmqoep',
  password: 'DPCOffeRmMi8FoJ6KLTt',
  database: 'bcbzgb0udqcjpj2copna',
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ CONNECTION FAILED:');
    console.error(err);
  } else {
    console.log('✅ CONNECTION SUCCESSFUL! Clever Cloud is working perfectly!');
  }
  connection.end();
});
