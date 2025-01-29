const express = require("express");
const bodyParser = require("body-parser");
const res = require("express/lib/response");
const db = require('./db'); // Import your MySQL connection
const bcrypt = require('bcrypt'); // For password hashing
const app = express();


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(express.json());



let showpayments = false;
let balance = 0.0;
let userid =1;



// login page 

app.get("/", function(req, res){
    let ismember = true;
    res.render("login", {ismember: ismember});
});

app.post("/", function(req, res){

    console.log(req.body)
    
    mail = req.body.mail;
    password = req.body.password;

    // SQL Query
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [mail], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error: ' + err.message);
        }

        // Check if user exists
        if (results.length === 0) {
            return res.status(401).send('Invalid email or password.');
        }

        const user = results[0];

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send('Invalid email or password2.');
        }
        
        userid = user.id;


        const getbalance = 'select balance from users where id = ?';
        db.query(getbalance, [userid], async (err, results) => {
            if (err) {
              return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
            }
            balance = parseFloat(results[0].balance);

        });

        // Successful login
        res.redirect("/options");
    });



});




//Signup Page

confmatches = true;


app.get("/signup", function(req, res){
    res.render("signup", {confmatches: confmatches});
});

app.post("/signup", function(req, res){
    pass = req.body.password;
    confpass = req.body.confirm_password;
    email = req.body.email;
    first_name = req.body.first_name;
    last_name = req.body.last_name;
    
    console.log(req.body)

    

    if(confpass === pass){
        confmatches = true ;
        // Check if the user already exists
        const checkUserSql = 'SELECT * FROM users WHERE email = ?';
        db.query(checkUserSql, [email], async (err, results) => {
            if (err) {
                return res.status(500).send('Database error: ' + err.message);
            }

            if (results.length > 0) {
                return res.status(400).send('User with this email already exists.');
            }

            // Hash the password
            const saltRounds = process.env.SaltRounds;
            const hashedPassword = await bcrypt.hash(pass, saltRounds);

            // Insert new user into the database
            const insertSql = 'INSERT INTO users (first_name, second_name, email, password) VALUES (?, ?, ?, ?)';
            db.query(insertSql, [first_name, last_name, email, hashedPassword], (err, result) => {
                if (err) {
                    return res.status(500).send('Error inserting data: ' + err.message);
                }

                res.redirect("/registerdsuccess");
            });
        });

    }
    else{
        confmatches = false; 
        res.redirect("/signup"); 

    }
});




// User registered successfully page

app.get("/registerdsuccess" , function(req, res){
    res.render("registerdsuccess");
});





// options Page 

app.get("/options", function(req, res){
    res.render("main");
});
app.post("/options", function(req, res){
    console.log(req.body);
    let Action = req.body.action;
    switch (Action) {
        case "addPayment":
            res.redirect("/addPayment")
            break;
        case "addIncome":
            res.redirect("/addIncome")  
            break;
        case "dashboard":
            res.redirect("/dashboard")
            break;

    }
});




// Add Payment Page

app.get("/addPayment", function(req, res){
    
    if(showpayments){
        const getpayments = 'SELECT amount, date, category FROM payments WHERE user_id = ?';
        db.query(getpayments, [userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while getting balance for inserting income: ' + err.message);
        }

        // Format the date for each payment
        const formattedPayments = results.map(payment => {
            const paymentDate = new Date(payment.date);
            return {
                ...payment,
                date: paymentDate.toISOString().split('T')[0] // Formats to YYYY-MM-DD
            };
        });

        console.log(formattedPayments); // Logs the formatted data
        res.render("addpayment", { Payments: formattedPayments, balance: balance });
        showpayments = false;
    });
    }
    else{
        res.render("addpayment" , {Payments:{}, balance:balance});
    }

    

    
});

app.post("/addPayment", function(req, res){
    // push the payment
    const insertpayment = 'insert into payments (amount, date, category, user_id) values (?, ?, ?, ?)';
    db.query(insertpayment, [parseFloat(req.body.AmountSpent), req.body.Date, req.body.Categories ,userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
        }

    });
    console.log(req.body)

    

    const getbalance = 'select balance from users where id = ?';
    db.query(getbalance, [userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
        }
        balance = parseFloat(results[0].balance);

    });

    balance -= parseFloat(req.body.AmountSpent);

    const insertPalance = 'update users set balance = ? where id = ?';
    db.query(insertPalance, [balance, userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while inserting balance after updating payments: ' + err.message);
        }
            

    });

    res.redirect("/addPayment");

});


app.post("/showPayments" , function(req, res){
    showpayments = true;
    res.redirect("/addPayment");
});




// Add Income Page


app.get("/addIncome", function(req, res){

    const getbalance = 'select balance from users where id = ?';
    db.query(getbalance, [userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
        } 

        console.log(results)
        console.log(userid)

        balance = parseFloat(results[0].balance);
    });
        
    res.render("addincome",{ balance: balance});
});


app.post("/addIncome", function(req, res){

    const getbalance = 'select balance from users where id = ?';
    db.query(getbalance, [userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
        }

        balance = parseFloat(results[0].balance);
        balance += parseFloat(req.body.Income);

        const addincomesql = 'Insert into incomes (amount , user_id) values (? , ?)';
        db.query(addincomesql, [parseFloat(req.body.Income) , userid], async (err, results) => {
            if (err) {
                return res.status(500).send('Database error while adding income: ' + err.message);
            }
        });
        const addbalance = 'update users set balance = ? where id = ?';
        db.query(addbalance, [balance , userid], async (err, results) => {
            if (err) {
                return res.status(500).send('Database error while adding balance: ' + err.message);
            }
        });
 
    });


    res.redirect("/addIncome")

});


// Dashboard Bage


const util = require('util');
const query = util.promisify(db.query).bind(db);

app.get('/dashboard', async (req, res) => {

        // Get balance
        const getbalance = 'SELECT balance FROM users WHERE id = ?';
        const balanceResult = await query(getbalance, [userid]);
        const balance = parseFloat(balanceResult[0]?.balance || 0);

        const getpayments = 'SELECT amount, date, category FROM payments WHERE user_id = ?';
        db.query(getpayments, [userid], async (err, results) => {
        if (err) {
            return res.status(500).send('Database error while getting balance for inserting income: ' + err.message);
        }

        // Format the date for each payment
        const paymentsResult = results.map(payment => {
            const paymentDate = new Date(payment.date);
            return {
                ...payment,
                date: paymentDate.toISOString().split('T')[0] // Formats to YYYY-MM-DD
            };
        });

        console.log(paymentsResult); // Logs the formatted data




        // Group payments by category for pie chart
        const categorySpending = paymentsResult.reduce((acc, pay) => {
            acc[pay.category] = (acc[pay.category] || 0) + pay.amount;
            return acc;
        }, {});

        // Prepare data for the charts
        const barChartData = paymentsResult.map(pay => ({ x: pay.date, y: pay.amount }));
        const pieChartData = {
            labels: Object.keys(categorySpending),
            values: Object.values(categorySpending)
        };

        const lastFivePayments = paymentsResult.slice(-5).reverse();


        res.render('dashboard', { balance, payments: lastFivePayments, barChartData, pieChartData });



        });


        
});





// app.get('/dashboard', (req, res) => {
//     const getbalance = 'select balance from users where id = ?';
//     db.query(getbalance, [userid], async (err, results) => {
//         if (err) {
//             return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
//         }
//         balance = parseFloat(results[0].balance);

//     });

//     let Payments = {};
//     const getpayments = 'select amount, date, category from payments where user_id = ?';
//         db.query(getpayments, [userid], async (err, results) => {
//          if (err) {
//              return res.status(500).send('Database error while getting balance for insertnig income: ' + err.message);
//          }
//             Payments = results;
//         });


//     // Group payments by category for pie chart
//     const categorySpending = Payments.reduce((acc, pay) => {
//       acc[pay.Categories] = (acc[pay.AmountSpent] || 0) + pay.AmountSpent;
//       return acc;
//     }, {});
  
//     // Prepare data for the charts
//     const barChartData = Payments.map(pay => ({ x: pay.Date, y: pay.AmountSpent }));
//     const pieChartData = {
//       labels: Object.keys(categorySpending),
//       values: Object.values(categorySpending)
//     };
//     console.log(JSON.stringify(barChartData))
  
//     res.render('dashboard', { balance, Payments, barChartData, pieChartData });
//   });
  
 




app.post("/dashboard", function(req, res){
    console.log(req.body);
    
    }
);




// Start the server
app.listen(3000, function () {
    console.log("Server is running on port 3000");
});