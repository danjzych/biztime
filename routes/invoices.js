"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
const db = require('../db');
const router = new express.Router();

router.use(express.json());

/**
 * returns all invoices as an array of object
 *
 *{
	"invoices": [
		{
			"id": 1,
			"comp_code": "apple"
		}]};
 */
router.get("/", async function (req, res) {
  const result = await db.query(
    `
      SELECT id, comp_code
      FROM invoices
      ORDER BY id
      `
  );
  const invoices = result.rows;

  return res.json({ invoices });

});

/**
 * from a invoice id url parameter returns a specific invoice
 *{
	"invoice": {
		"id": 1,
		"amt": "100.00",
		"paid": false,
		"add_date": "2023-09-14T04:00:00.000Z",
		"paid_date": null,
		"company": {
			"code": "apple",
			"name": "Apple Computer",
			"description": "Maker of OSX."
		}
	}
}
 */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const iResult = await db.query(
    `
      SELECT id, amt, paid, add_date, paid_date, comp_code AS company
      FROM invoices
      WHERE id = $1`,
      [id]
  );
  const invoice = iResult.rows[0];
  // TODO: throw notfounderror if invoice not found

  const cResult = await db.query(

    `
      SELECT code, name, description
      FROM companies
      WHERE code = $1
      ORDER BY code
      `, [invoice.company]
  );
  const company = cResult.rows[0];

  invoice.company = company;

  return res.json({ invoice });
});


/**
 * creates an invoice with a specific comp_code and amt sent via request
//  TODO: add request json example
 *{
	"invoice": {
		"id": 5,
		"comp_code": "apple",
		"amt": "800.00",
		"paid": false,
		"add_date": "2023-09-14T04:00:00.000Z",
		"paid_date": null
	}
}
 */
router.post('/', async function (req, res) {
  if (!req.body) throw new BadRequestError('Expected "comp_code" and "amt" in body.');

  const { comp_code, amt } = req.body;
  if (!comp_code || !amt) throw new BadRequestError('Expected "comp_code" and "amt" in body.');

  const result = await db.query(
    `INSERT INTO invoices(comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`
      ,
    [comp_code, amt]
  );
  const invoice = result.rows[0];

  //QUESTION: best way to catch and throw errors for errors in PG query
    // TODO: status 201 on post route
  return res.json({ invoice });
});

/**
 * takes invoice id from url params and amt from request body
 * returns updated invoice
 * {
	"invoice": {
		"id": 5,
		"comp_code": "apple",
		"amt": "800.00",
		"paid": false,
		"add_date": "2023-09-14T04:00:00.000Z",
		"paid_date": null
	}
}
 */
router.put('/:id', async function (req, res) {
  // TODO: try to describe error message as no data to parse
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

/**
 * takes invoice id from url params
 * returns a message to confirm deletion of invoice
 * { status: 'Deleted' }
 */
router.delete('/:id', async function (req, res) {
  const id = req.params.id;

  const results = await db.query(
    `DELETE FROM invoices
      WHERE id = $1
      RETURNING id, comp_code`, [id]
      // TODO: don't need comp_code
  )
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`Could not find invoice id ${id}`);

  return res.json({ status: 'Deleted' })
})



module.exports = router;