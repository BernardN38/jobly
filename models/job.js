"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ company_handle, title, salary, equity }) {
    const duplicateCheck = await db.query(
      `SELECT title
           FROM jobs
           WHERE title = $1`,
      [title]
    );

    if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job: ${title}`);

    const result = await db.query(
      `INSERT INTO jobs
           (company_handle, title, salary, equity)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
      [company_handle, title, salary, equity]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity }, ...]
   * Can be filtered by company name including a keyword, minimum salary or having equity
   * */

  static async findAll({ title, minSalary, hasEquity } = {}) {
    const jobsRes = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs`
    );
    let jobs = jobsRes.rows;

    if (title) {
      jobs = jobs.filter((job) => {
        if (job.title.toLowerCase().includes(title)) return job;
      });
    }
    if (minSalary) {
      jobs = jobs.filter((job) => {
        if (job.salary > minSalary) return job;
      });
    }
    if (hasEquity == 'true') {
      jobs = jobs.filter((job) => {
        if (job.equity > 0) return job;
      });
    }
    return jobs;
  }

  /** Given a job id, return data about job.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const jobsRes = await db.query(
      `SELECT company_handle, title, salary, equity
           FROM jobs
           WHERE company_handle = $1`,
      [handle]
    );

    const job = jobsRes.rows[0];

    if (!job) throw new NotFoundError(`No jobs for company: ${handle}`);

    return job || [];
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {'title', 'equity', 'salary'}
   *
   * Returns {'title', 'equity', 'salary'}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      salary: "salary",
      equity: "equity",
      // company_handle: "company_handle"
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING title, salary, equity`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id= $1
           RETURNING *`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);
  }
}

module.exports = Job;
