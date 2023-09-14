"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require('../db');
const router = new express.Router();

router.use(express.json());

// TODO: doc string should include result from instructions
// TODO: ORDER by primary key in queries
/**Route to get all companies from API. */
router.get('/', async function (req, res) {
  const result = await db.query(
    `SELECT code, name
      FROM companies;`
  );

  const rows = result.rows;

  return res.json({
    companies: rows
  });
});


/**
 * takes code from url params
 * returns company info and invoices associated with it
 *{
  "company": {
    "code": "apple",
    "name": "Apple Computer",
    "invoices": [
      {
        "id": 1,
        "comp_code": "apple",
        "amt": "100.00",
        "paid": false,
        "add_date": "2023-09-14T04:00:00.000Z",
        "paid_date": null
      }
    ]
  }
};
 */
router.get('/:code', async function (req, res) {
  const code = req.params.code;

  const cResult = await db.query(
    `SELECT code, name
      FROM companies
      WHERE code = $1;`, [code]
  );

  const iResult = await db.query(
    // TODO: only need id's of invoices
    `
    SELECT id, comp_code, amt, paid, add_date, paid_date
    FROM invoices
    WHERE comp_code = $1
    `, [code]
  );
  const company = cResult.rows[0];
  if (!company) throw new NotFoundError('Unable to find company');
  company.invoices = iResult.rows;

  return res.json({ company });

  // return res.json({
  //   company: result.rows[0]
  // });
});


/**Route to create a company. */
router.post("/", async function (req, res) {
  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT into companies(code, name, description)
     VALUES ($1,$2,$3)
     RETURNING code, name, description
    `, [code, name, description]);
  const company = result.rows[0];

  return res.status(201).json({ company });
});


/** Route to update a company */
router.put("/:code", async function (req, res) {
  const code = req.params.code;
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
    SET name = $1,
         description = $2
    WHERE code = $3
    RETURNING code, name, description
    `, [name, description, code]
  );
  const company = result.rows[0];

  if (company) return res.json({ company });
  // TODO: make sure error is thrown first
  // TODO: include message on NotFoundError
  throw new NotFoundError();
});


/** Route to delete a company. */
router.delete('/:code', async function (req, res) {
  const code = req.params.code;

  const result = await db.query(
    `DELETE FROM companies
      WHERE code = $1
      RETURNING code, name, description`, [code]
  );
  const company = result.rows[0];

  if (company) return res.json({ status: "Deleted" });

  throw new NotFoundError();
});

module.exports = router;