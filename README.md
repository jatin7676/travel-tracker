 # Travel Tracker App

## Overview

The Travel Tracker app is a web-based application that allows users to track their travel experiences. It is built using PostgreSQL, Express, and Node.js, with EJS and HTML for rendering the frontend.

## Features

Add new travel destinations with details

View a list of all tracked destinations

Edit or delete existing destinations

User-friendly UI with EJS templates

Persistent data storage with PostgreSQL

## Technologies Used

Backend: Node.js, Express.js

Database: PostgreSQL

Frontend: EJS, HTML, CSS

## Installation Steps

### Prerequisites

Ensure you have the following installed:

Node.js

PostgreSQL

### Setup

 1.Clone the Repository:
git clone https://github.com/jatin7676/travel-tracker.git
cd travel-tracker

2.Install Dependencies:

npm install

3.Setup PostgreSQL Database:

Create a new database in PostgreSQL:

CREATE DATABASE travel_tracker;

Run database migrations or schema setup (if available).

4.Configure Environment Variables:
Create a .env file in the root directory and add your PostgreSQL connection details:

DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=travel_tracker
DB_PORT=5432

Run the Server:

npm start

The server will start on http://localhost:3000.

## Usage

Open http://localhost:3000 in your browser.

Use the UI to add, edit, and delete travel records.

## Project Structure

travel-tracker/
│-- views/            # EJS templates
│-- public/           # Static files (CSS, JS, Images)
│-- routes/           # Express routes
│-- models/           # Database models and queries
│-- app.js            # Main server file
│-- package.json      # Dependencies and scripts
│-- .env              # Environment variables


## License

This project is licensed under the MIT License.

