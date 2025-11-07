import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

 db.connect();
 
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(express.static("public"));
 
 async function checkVisisted() {
   const result = await db.query("SELECT country_code FROM visited_countries");
 
   let countries = [];
   result.rows.forEach((country) => {
     countries.push(country.country_code);
   });
   return countries;
 }
 
 // GET home page
 app.get("/", async (req, res) => {
   const countries = await checkVisisted();
   res.render("index.ejs", { countries: countries, total: countries.length });
 });
 
 //INSERT new country
 app.post("/add", async (req, res) => {
   const input = req.body["country"];
 
   try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1",
      [input]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});


// POST Remove Last Country
app.post("/remove", async (req, res) => {
    try {
      await db.query(
        `DELETE FROM visited_countries 
         WHERE country_code = (
           SELECT country_code 
           FROM visited_countries 
           ORDER BY id DESC 
           LIMIT 1
         )`
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Failed to remove the last country, try again.",
      });
    }
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
