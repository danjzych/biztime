"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
const db = require('../db');
const router = new express.Router();

router.use(express.json());

router.get("/", async function (req, res) {
  const result = await db.query(
    `
      SELECT id, comp_code
      FROM invoices
      `
  );
  const invoices = result.rows;
  return res.json({ invoices });
});

router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const iResult = await db.query(
    `
      SELECT id, amt, paid, add_date, paid_date, comp_code AS company
      FROM invoices
      WHERE id = $1
      `, [id]
  );
  const invoice = iResult.rows[0];

  const cResult = await db.query(

    `
      SELECT code, name, description
      FROM companies
      WHERE code = $1
      `, [invoice.company]
  );
  const company = cResult.rows[0];

  invoice.company = company;

  return res.json({ invoice });
});


/**ADD DOC STRING */
router.post('/', async function (req, res) {
  if (!req.body) throw new BadRequestError('Expected "comp_code" and "amt" in body.');

  const { comp_code, amt } = req.body;
  if (!comp_code || !amt) throw new BadRequestError('Expected "comp_code" and "amt" in body.');

  const result = await db.query(
    `INSERT INTO invoices(comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );
  const invoice = result.rows[0];

  //QUESTION: best way to catch and throw errors for errors in PG query

  return res.json({ invoice });
});


router.put('/:id', async function (req, res) {
  if (!req.body) throw new BadRequestError('Expected "amt" in body.');
  const id = req.params.id;

  const { amt } = req.body;
  if (!amt) throw new BadRequestError('Expected "amt" in body.');

  const results = await db.query(
    `UPDATE invoices
      SET amt = $1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  )
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Could not find invoice id ${id}`);

  return res.json({ invoice })
})


router.delete('/:id', async function (req, res) {
  const id = req.params.id;

  const results = await db.query(
    `DELETE FROM invoices
      WHERE id = $1
      RETURNING id, comp_code`, [id]
  )
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Could not find invoice id ${id}`);

  return res.json({ status: 'Deleted' })
})



module.exports = router;