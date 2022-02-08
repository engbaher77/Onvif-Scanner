module.exports = {
    HOST: process.env.MYSQL_HOST || "localhost",
    USER: process.env.MYSQL_USER || "postgres",
    PASSWORD: process.env.MYSQL_PASSWORD || "P@ssw0rd",
    DB: "aiactive-20",
    PORT: process.env.MYSQL_PORT || "5432",
    MAX_CLIENTS: 100
};