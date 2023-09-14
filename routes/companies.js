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


/**Route to create a company. */
router.post("/", async function(req,res){
  const {code, name, description} = req.body;

  const result = await db.query(
    `INSERT into companies(code, name, description)
     VALUES ($1,$2,$3)
     RETURNING code, name, description
    `, [code,name,description]);
    const company = result.rows[0]

    return res.status(201).json({company})
})


/** Route to update a company */
router.put("/:code", async function(req,res){
  const code = req.params.code;
  const {name, description} = req.body

  const result = await db.query(
   `UPDATE companies
    SET name = $1,
         description = $2
    WHERE code = $3
    RETURNING code, name, description
    `, [name, description, code]
  );
  const company = result.rows[0]

  if(company)return res.json({company});

  throw new NotFoundError();
})


/** Route to delete a company. */
router.delete('/:code', async function(req, res) {
  const code = req.params.code;

  const result = await db.query(
    `DELETE FROM companies
      WHERE code = $1
      RETURNING code, name, description`, [code]
  );
  const company = result.rows[0]

  if(company)return res.json({"status": "Deleted"});

throw new NotFoundError();
})

module.exports = router;