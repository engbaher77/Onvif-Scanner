const express = require("express");
const serveStatic = require("serve-static");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");

// Route files
const onvif = require("./routes/onvif");

// Load env Vars
dotenv.config({ path: "./config/config.env" });

// Initialize app instance
const app = express();

const whitelist = ["http://localhost:8080"];
const corsOptions = {
  credentials: true, // This is important.
  origin: (origin, callback) => {
    // console.log('origin', origin);
    // if (whitelist.includes(origin))
    return callback(null, true);

    // callback(new Error('Not allowed by CORS'));
  },
};

// Serve Public Folder
app.use(serveStatic(__dirname + "/dist"));

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Helmet Security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 200, // num of requests per windowMs
});

app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors(corsOptions));

// Dev Logging middleware
if (process.env.NODE_ENV === "production") app.use(morgan("combined"));
else app.use(morgan("dev"));

// Mount routers
app.use("/api/v1/onvif", onvif);

// Mount Error Handler middleware should be after routes to catch it
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & Exit process
  server.close(() => process.exit(1));
});
