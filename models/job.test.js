"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "author",
        salary: 75000,
        equity: "0.56",
        company_handle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            title: "author",
            salary: 75000,
            equity: "0.56",
            company_handle: "c1",
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title='author'`);
        expect(result.rows).toEqual([
            {
                title: "author",
                salary: 75000,
                equity: "0.56",
                company_handle: "c1",
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                "company_handle": "c1",
                "equity": "0",
                "salary": 80000,
                "title": "engineer",

            },
            {
                "company_handle": "c2",
                "equity": "0.07",
                "salary": 100000,
                "title": "doctor",

            },
            {
                "company_handle": "c3",
                "equity": "0.893",
                "salary": 120000,
                "title": "lawyer",

            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get("c1");
        expect(job).toEqual({
            "company_handle": "c1",
            "equity": "0",
            "salary": 80000,
            "title": "engineer",
        });
    });

    test("not found if no such company", async function () {
        try {
            await Job.get("nope");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        salary: 280000,
        equity: '0.99'
    };

    test("works", async function () {
        let job = await Job.update(1, updateData);
        expect(job).toEqual({
            title: "engineer",
            ...updateData,
        });

        const result = await db.query(
            `SELECT title, salary,equity, company_handle
           FROM jobs
           WHERE title='engineer'`);
        expect(result.rows).toEqual([{
            "company_handle": "c1",
            "equity": "0.99",
            "salary": 280000,
            "title": "engineer",
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null,
        };

        let job = await Job.update(1, updateDataSetNulls);
        expect(job).toEqual({
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT title,salary,equity,company_handle
            FROM jobs
           WHERE company_handle = 'c1'`);
        expect(result.rows).toEqual([{
            company_handle: "c1",
            equity: null,
            salary: null,
            title: "New",
        }]);
    });

      test("not found if no such job", async function () {
        try {
          await Job.update(999999, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });

      test("bad request with no data", async function () {
        try {
          await Job.update("c1", {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(12314);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
