import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// fix __dirname for ES modules and set views/view engine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Use DATABASE_URL if it exists (for Render), otherwise use local config
const db = new pg.Client(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Render connections
        },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

// Connect to DB and fail fast on connection errors so deploy logs show useful info
db.connect()
  .then(() => {
    console.log('Connected to database');
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err && err.message ? err.message : err);
    process.exit(1);
  });
 
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(express.static("public"));
 
 async function checkVisited() {
   const result = await db.query("SELECT country_code FROM visited_countries");
 
   let countries = [];
   result.rows.forEach((country) => {
     countries.push(country.country_code);
   });
   return countries;
 }
 
 // GET home page
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index", { countries: countries, total: countries.length });
});

// API: return visited country codes as JSON
app.get('/api/visited', async (req, res) => {
  try {
    const countries = await checkVisited();
    res.json({ countries });
  } catch (err) {
    console.error('Failed to fetch visited countries', err);
    res.status(500).json({ error: 'Failed to fetch visited countries' });
  }
});
 
// INSERT new country (case-insensitive match on country name)
app.post("/add", async (req, res) => {
  const input = (req.body["country"] || "").trim();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name ILIKE $1",
      [input]
    );

    if (!result.rows[0]) {
      const countries = await checkVisited();
      return res.render("index", {
        countries,
        total: countries.length,
        error: "Country name does not exist, try again.",
      });
    }

    const countryCode = result.rows[0].country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index", {
        countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index", {
      countries,
      total: countries.length,
      error: "Failed to add country.",
    });
  }
});


// POST Remove a specific country by name typed by the user
app.post("/remove", async (req, res) => {
  const input = (req.body["country"] || "").trim();
  try {
    // Find code for the typed country (case-insensitive)
    const lookup = await db.query(
      "SELECT country_code FROM countries WHERE country_name ILIKE $1",
      [input]
    );

    if (!lookup.rows[0]) {
      const countries = await checkVisited();
      return res.render("index", {
        countries,
        total: countries.length,
        error: "Country name does not exist, try again.",
      });
    }

    const code = lookup.rows[0].country_code;
    const del = await db.query(
      "DELETE FROM visited_countries WHERE country_code = $1",
      [code]
    );

    if (del.rowCount === 0) {
      const countries = await checkVisited();
      return res.render("index", {
        countries,
        total: countries.length,
        error: "That country is not in your visited list.",
      });
    }

    res.redirect("/");
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index", {
      countries,
      total: countries.length,
      error: "Failed to remove the country, try again.",
    });
  }
});

app.listen(port, () => {
    console.log(`✅ Server running locally at http://localhost:${port}`);

  //console.log(`Server running on port ${port}`);
});
