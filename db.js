const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',      // Your database host
    user: 'root',           // Your database username
    password: 'yahia2002',           // Your database password
    database: 'financial_manager'        // Your database name
});


// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

module.exports = db;