const express = require("express");

const router = express.Router();

const { fetch_report, get_report, login } = require("./crudop");

const {authenticateJWT} = require("../middleware/middleware")

router.post("/login",login)

router.get("/fetch-transaction",authenticateJWT, fetch_report);

router.get("/report",authenticateJWT, get_report);

module.exports=router
