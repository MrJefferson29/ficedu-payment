const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const morgan = require("morgan");
const connectDatabase = require("./Controllers/connectDB");
const IndexRoute = require("./Routes/index");

dotenv.config({ path: "./.env" });

mongoose.set("strictQuery", false);
connectDatabase();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev")); // Request logging

// Routes
app.use("/", IndexRoute);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} : ${process.env.NODE_ENV}`);
});

// Graceful shutdown for unhandled rejections
process.on("unhandledRejection", (err, promise) => {
    console.log(`Logged Error: ${err}`);
    server.close(() => process.exit(1));
});

// Graceful shutdown on SIGTERM (for production)
process.on("SIGTERM", () => {
    server.close(() => {
        console.log("Process terminated");
        mongoose.connection.close();
        process.exit(0);
    });
});
