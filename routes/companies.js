"use strict"

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require('../db');
const router = new express.Router();

router.use(express.json());

/**Route to get all companies from API. */
router.get('/', async function(req, res) {
  const result = await db.query(
    `SELECT code, name
      FROM companies;`
  );

  const rows = result.rows;

  return res.json({
    companies: rows
  })
})


/**Route to get the information for a specific company */
router.get('/:code', async function (req, res) {
  const code = req.params.code;

  const result = await db.query(
    `SELECT code, name
      FROM companies
      WHERE code = $1;`, [code]
  );

  return res.json({
    company: result.rows[0]
  })
})


module.exports = router;