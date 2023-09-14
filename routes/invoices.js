"use strict"

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require('../db');
const router = new express.Router();

router.use(express.json());

router.get("/", async function(req,res){
    const result = await db.query(
      `
      SELECT id, comp_code
      FROM invoices
      `
    )
    const invoices = result.rows;
    return res.json({invoices});
})

router.get("/:id", async function(req,res){
    const id = req.params.id;

    const iResult = await db.query(
      `
      SELECT id, amt, paid, add_date, paid_date, comp_code AS company
      FROM invoices
      WHERE id = $1
      `, [id]
    )
    const invoice = iResult.rows[0];

    const cResult = await db.query(

      `
      SELECT code, name, description
      FROM companies
      WHERE code = $1
      `, [invoice.company]
    )
    const company = cResult.rows[0]

    invoice.company = company;

    return res.json({invoice});
})






module.exports = router;