const express = require("express");
const router = express.Router();
const { scan } = require("../libs/onvif");

router.get("/scan", scan);

module.exports = router;
