"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, checkAdmin } = require("../middleware/auth");
const Job = require("../models/jobs");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json")
const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity company_handle }
 *
 * Returns {  title, salary, equity company_handle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { job: [ {  title, salary, equity company_handle  }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - salary
 * - equity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const filter = req.query
    const jobs = await Job.findAll(filter);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { job}
 *
 *  Job is {   title, salary, equity company_handle   }
 *   where jobs is [{  title, salary, equity company_handle }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.handle);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: {  title, salary, equity company_handle  }
 *
 * Returns {  title, salary, equity company_handle  }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, checkAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, checkAdmin, async function (req, res, next) {
  console.log(res.locals.user)
  try {
    await Job.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
