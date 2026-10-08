-- =====================================================================
--  Campus Finder - schema, sample data and the important queries
--  Target : Oracle Database (SQL*Plus), 12c or newer
--  Run    : sqlplus <user>/<password>@<service> @docs/campus_finder_queries.sql
--
--  PART 1  schema        (skip if your tables already exist)
--  PART 2  sample data   (fixed dates, so the match scores never change)
--  PART 3  queries Q1-Q10, each with its join count in the header
--
--  Column names follow the project ER model. Data types and constraint
--  details are assumptions - adjust them to match your own tables.
-- =====================================================================

SET LINESIZE 220
SET PAGESIZE 100

-- ---------------------------------------------------------------------
-- PART 1: SCHEMA
-- ---------------------------------------------------------------------
-- To start from scratch, drop in this order first:
--   DROP TABLE item_image;  DROP TABLE claim;  DROP TABLE item;
--   DROP TABLE location;    DROP TABLE category;  DROP TABLE student;
--   DROP SEQUENCE item_seq;

CREATE TABLE student (
    student_id    NUMBER(10)     PRIMARY KEY,
    student_name  VARCHAR2(100)  NOT NULL,
    email         VARCHAR2(100)  NOT NULL UNIQUE,
    phone         VARCHAR2(15),
    department    VARCHAR2(50)
);

CREATE TABLE category (
    category_id    NUMBER(5)     PRIMARY KEY,
    category_name  VARCHAR2(50)  NOT NULL UNIQUE
);

CREATE TABLE location (
    location_id    NUMBER(5)     PRIMARY KEY,
    location_name  VARCHAR2(80)  NOT NULL,
    building       VARCHAR2(80)
);

CREATE TABLE item (
    item_id        NUMBER(10)     PRIMARY KEY,
    student_id     NUMBER(10)     NOT NULL REFERENCES student (student_id),
    category_id    NUMBER(5)      NOT NULL REFERENCES category (category_id),
    location_id    NUMBER(5)      NOT NULL REFERENCES location (location_id),
    item_name      VARCHAR2(100)  NOT NULL,
    description    VARCHAR2(500),
    item_status    VARCHAR2(5)    NOT NULL CHECK (item_status IN ('LOST', 'FOUND')),
    reported_date  DATE           DEFAULT SYSDATE NOT NULL
);

-- Weak entity: a claim cannot exist without its item (composite key)
CREATE TABLE claim (
    item_id            NUMBER(10)    NOT NULL REFERENCES item (item_id) ON DELETE CASCADE,
    student_id         NUMBER(10)    NOT NULL REFERENCES student (student_id),
    claim_date         DATE          DEFAULT SYSDATE NOT NULL,
    claim_description  VARCHAR2(500),
    claim_status       VARCHAR2(10)  DEFAULT 'PENDING' NOT NULL
                       CHECK (claim_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    PRIMARY KEY (item_id, student_id)
);

-- Weak entity: an image only exists to illustrate an item (composite key)
CREATE TABLE item_image (
    item_id        NUMBER(10)    NOT NULL REFERENCES item (item_id) ON DELETE CASCADE,
    image_no       NUMBER(3)     NOT NULL,
    image_path     VARCHAR2(255) NOT NULL,
    uploaded_date  DATE          DEFAULT SYSDATE,
    PRIMARY KEY (item_id, image_no)
);

-- Source of new item_id values (sample data below uses 1001-1012)
CREATE SEQUENCE item_seq START WITH 1013 INCREMENT BY 1;

-- ---------------------------------------------------------------------
-- PART 2: SAMPLE DATA
-- ---------------------------------------------------------------------
INSERT INTO student VALUES (5001, 'Aarav Sharma', 'aarav@campus.edu', '9000000001', 'CSE');
INSERT INTO student VALUES (5002, 'Diya Patel',   'diya@campus.edu',  '9000000002', 'ECE');
INSERT INTO student VALUES (5003, 'Rohan Mehta',  'rohan@campus.edu', '9000000003', 'MECH');
INSERT INTO student VALUES (5004, 'Sneha Iyer',   'sneha@campus.edu', '9000000004', 'CSE');
INSERT INTO student VALUES (5005, 'Kabir Singh',  'kabir@campus.edu', '9000000005', 'CIVIL');
INSERT INTO student VALUES (5006, 'Meera Nair',   'meera@campus.edu', '9000000006', 'IT');

INSERT INTO category VALUES (101, 'Electronics');
INSERT INTO category VALUES (102, 'Documents');
INSERT INTO category VALUES (103, 'Accessories');
INSERT INTO category VALUES (104, 'Books');
INSERT INTO category VALUES (105, 'Keys');

INSERT INTO location VALUES (201, 'Library',      'Central Library');
INSERT INTO location VALUES (202, 'Canteen',      'Food Court');
INSERT INTO location VALUES (203, 'Main Block',   'Academic Block A');
INSERT INTO location VALUES (204, 'Parking Area', 'North Gate');

-- LOST reports
INSERT INTO item VALUES (1001, 5001, 101, 201, 'Black Earbuds',  'Lost my Black Earbuds case somewhere near the library reading hall', 'LOST', DATE '2026-09-28');
INSERT INTO item VALUES (1002, 5002, 102, 203, 'ID Card',        'Student ID Card in a blue holder, dropped near the Main Block stairs', 'LOST', DATE '2026-09-29');
INSERT INTO item VALUES (1003, 5003, 105, 202, 'Bike Keys',      'Bunch of Bike Keys with a red keychain', 'LOST', DATE '2026-09-30');
INSERT INTO item VALUES (1004, 5004, 103, 204, 'Black Wallet',   'Black Wallet with some cash and a library card', 'LOST', DATE '2026-10-01');
INSERT INTO item VALUES (1005, 5005, 104, 201, 'DBMS Textbook',  'Blue DBMS Textbook with my name on the first page', 'LOST', DATE '2026-10-02');

-- FOUND reports
INSERT INTO item VALUES (1006, 5006, 101, 201, 'Black Earbuds',      'Charging case with earbuds on a library table', 'FOUND', DATE '2026-09-29');
INSERT INTO item VALUES (1007, 5001, 102, 203, 'ID Card',            'ID card found near Main Block', 'FOUND', DATE '2026-10-05');
INSERT INTO item VALUES (1008, 5002, 105, 201, 'Bike Keys',          'Keys found at the library entrance', 'FOUND', DATE '2026-10-01');
INSERT INTO item VALUES (1009, 5006, 103, 202, 'Brown Wallet',       'Brown leather wallet left in the canteen', 'FOUND', DATE '2026-10-02');
INSERT INTO item VALUES (1010, 5003, 104, 204, 'Notebook',           'Spiral notebook', 'FOUND', DATE '2026-10-07');
INSERT INTO item VALUES (1011, 5005, 103, 203, 'Steel Water Bottle', 'Silver bottle left in the Main Block corridor', 'FOUND', DATE '2026-10-04');
INSERT INTO item VALUES (1012, 5002, 103, 203, 'Umbrella',           'Black folding umbrella in Main Block', 'FOUND', DATE '2026-10-06');

-- Claims on FOUND items (item 1008 has two competing claims)
INSERT INTO claim VALUES (1006, 5001, DATE '2026-09-30', 'The charging case has my initials scratched on it', 'APPROVED');
INSERT INTO claim VALUES (1007, 5002, DATE '2026-10-06', 'It is my ID card, my photo is on it', 'PENDING');
INSERT INTO claim VALUES (1008, 5003, DATE '2026-10-02', 'Red keychain shaped like a guitar', 'PENDING');
INSERT INTO claim VALUES (1008, 5005, DATE '2026-10-02', 'I think these are my keys', 'PENDING');
INSERT INTO claim VALUES (1009, 5004, DATE '2026-10-03', 'Mine has a department card inside', 'PENDING');
INSERT INTO claim VALUES (1010, 5005, DATE '2026-10-07', 'Looks like my notebook', 'REJECTED');

INSERT INTO item_image VALUES (1006, 1, '/uploads/1006_1.jpg', DATE '2026-09-29');
INSERT INTO item_image VALUES (1006, 2, '/uploads/1006_2.jpg', DATE '2026-09-29');
INSERT INTO item_image VALUES (1007, 1, '/uploads/1007_1.jpg', DATE '2026-10-05');
INSERT INTO item_image VALUES (1010, 1, '/uploads/1010_1.jpg', DATE '2026-10-07');

COMMIT;

-- ---------------------------------------------------------------------
-- PART 3: QUERIES
-- ---------------------------------------------------------------------

-- @@Q1
-- Q1  Report an item                              JOINS: 0   (INSERT)
-- Page: report-item.html -> ReportItemServlet. The servlet should run this
-- with a PreparedStatement, using ? placeholders instead of literal values.
PROMPT Q1: report an item
INSERT INTO item (item_id, student_id, category_id, location_id,
                  item_name, description, item_status, reported_date)
VALUES (item_seq.NEXTVAL, 5004, 101, 201,
        'Silver Laptop Charger', 'Silver laptop charger left near the library desk',
        'FOUND', DATE '2026-10-07');

SELECT item_id, item_name, item_status, reported_date
FROM   item
WHERE  item_id = (SELECT MAX(item_id) FROM item);

ROLLBACK;

-- @@Q2
-- Q2  Search items by category and status         JOINS: 3   (all INNER)
-- Page: search.html. Filters are literals here; the servlet would bind them.
PROMPT Q2: search found accessories
SELECT i.item_id,
       i.item_name,
       i.item_status,
       c.category_name,
       l.location_name,
       i.reported_date,
       s.student_name AS reported_by
FROM   item i
JOIN   category c ON c.category_id = i.category_id
JOIN   location l ON l.location_id = i.location_id
JOIN   student  s ON s.student_id  = i.student_id
WHERE  i.item_status = 'FOUND'
AND    i.category_id = 103
ORDER  BY i.reported_date DESC;

-- @@Q3
-- Q3  Possible match finder (project novelty)     JOINS: 1   (self-join)
-- Page: matches.html. Scores every LOST report against every FOUND report.
PROMPT Q3: possible match finder
SELECT l.item_id  AS lost_item_id,
       f.item_id  AS found_item_id,
       ( CASE WHEN l.category_id = f.category_id THEN 30 ELSE 0 END
       + CASE WHEN l.location_id = f.location_id THEN 30 ELSE 0 END
       + CASE WHEN ABS(l.reported_date - f.reported_date) <= 3 THEN 20 ELSE 0 END
       + CASE WHEN UPPER(l.description) LIKE '%' || UPPER(f.item_name) || '%'
              THEN 20 ELSE 0 END
       ) AS match_score
FROM   item l
JOIN   item f  ON l.item_id != f.item_id
WHERE  l.item_status = 'LOST'
AND    f.item_status = 'FOUND'
ORDER  BY match_score DESC, l.item_id, f.item_id;

-- @@Q4
-- Q4  Possible matches with names, best only      JOINS: 6   (all INNER)
-- Page: matches.html. Q3 plus readable details, a minimum score of 60,
-- and a rule that a student is never matched with their own report.
PROMPT Q4: possible matches with details
SELECT *
FROM (
    SELECT l.item_id         AS lost_item_id,
           l.item_name       AS lost_item,
           ls.student_name   AS lost_by,
           ll.location_name  AS lost_at,
           f.item_id         AS found_item_id,
           f.item_name       AS found_item,
           fs.student_name   AS found_by,
           fl.location_name  AS found_at,
           lc.category_name  AS category,
           ( CASE WHEN l.category_id = f.category_id THEN 30 ELSE 0 END
           + CASE WHEN l.location_id = f.location_id THEN 30 ELSE 0 END
           + CASE WHEN ABS(l.reported_date - f.reported_date) <= 3 THEN 20 ELSE 0 END
           + CASE WHEN UPPER(l.description) LIKE '%' || UPPER(f.item_name) || '%'
                  THEN 20 ELSE 0 END
           ) AS match_score
    FROM   item l
    JOIN   item f       ON l.item_id != f.item_id
    JOIN   student ls   ON ls.student_id  = l.student_id
    JOIN   student fs   ON fs.student_id  = f.student_id
    JOIN   category lc  ON lc.category_id = l.category_id
    JOIN   location ll  ON ll.location_id = l.location_id
    JOIN   location fl  ON fl.location_id = f.location_id
    WHERE  l.item_status = 'LOST'
    AND    f.item_status = 'FOUND'
    AND    l.student_id <> f.student_id
)
WHERE  match_score >= 60
ORDER  BY match_score DESC, lost_item_id;

-- @@Q5
-- Q5  My Claims for one student                   JOINS: 3   (all INNER)
-- Page: my-claims.html. Student 5005 is the logged-in student here.
PROMPT Q5: my claims
SELECT c.item_id,
       i.item_name,
       cat.category_name,
       loc.location_name,
       c.claim_date,
       c.claim_status
FROM   claim c
JOIN   item i       ON i.item_id       = c.item_id
JOIN   category cat ON cat.category_id = i.category_id
JOIN   location loc ON loc.location_id = i.location_id
WHERE  c.student_id = 5005
ORDER  BY c.claim_date DESC;

-- @@Q6
-- Q6  Submit a claim, then approve one and reject the rest   JOINS: 0   (DML)
-- One transaction: either every change is kept (COMMIT) or none (ROLLBACK).
PROMPT Q6: claim workflow
INSERT INTO claim (item_id, student_id, claim_date, claim_description)
VALUES (1011, 5003, DATE '2026-10-08', 'Silver bottle with a dent near the base');

UPDATE claim
SET    claim_status = 'APPROVED'
WHERE  item_id = 1008
AND    student_id = 5003;

UPDATE claim
SET    claim_status = 'REJECTED'
WHERE  item_id = 1008
AND    student_id <> 5003
AND    claim_status = 'PENDING';

SELECT item_id, student_id, claim_status
FROM   claim
WHERE  item_id IN (1008, 1011)
ORDER  BY item_id, student_id;

ROLLBACK;

-- @@Q7
-- Q7  Reports per category (GROUP BY + HAVING)    JOINS: 1   (INNER)
-- WHERE filters rows before grouping; HAVING filters the groups after.
PROMPT Q7: reports per category
SELECT c.category_name,
       COUNT(*) AS total_reports,
       SUM(CASE WHEN i.item_status = 'LOST'  THEN 1 ELSE 0 END) AS lost,
       SUM(CASE WHEN i.item_status = 'FOUND' THEN 1 ELSE 0 END) AS found
FROM   item i
JOIN   category c ON c.category_id = i.category_id
WHERE  i.reported_date >= DATE '2026-09-29'
GROUP  BY c.category_name
HAVING COUNT(*) >= 2
ORDER  BY total_reports DESC, c.category_name;

-- @@Q8A
-- Q8a Found items nobody has claimed (outer join) JOINS: 2   (1 INNER + 1 LEFT)
PROMPT Q8a: unclaimed found items (LEFT JOIN)
SELECT i.item_id,
       i.item_name,
       c.category_name,
       i.reported_date
FROM   item i
JOIN   category c  ON c.category_id = i.category_id
LEFT   JOIN claim cl ON cl.item_id = i.item_id
WHERE  i.item_status = 'FOUND'
AND    cl.item_id IS NULL
ORDER  BY i.reported_date;

-- @@Q8B
-- Q8b Same result using a subquery                JOINS: 1   (+ 1 correlated subquery)
PROMPT Q8b: unclaimed found items (NOT EXISTS)
SELECT i.item_id,
       i.item_name,
       c.category_name,
       i.reported_date
FROM   item i
JOIN   category c ON c.category_id = i.category_id
WHERE  i.item_status = 'FOUND'
AND    NOT EXISTS (SELECT 1
                   FROM   claim cl
                   WHERE  cl.item_id = i.item_id)
ORDER  BY i.reported_date;

-- @@Q9
-- Q9  Top 3 reporters                             JOINS: 1   (INNER)
-- FETCH FIRST needs Oracle 12c+. On older versions wrap the query and
-- filter on ROWNUM <= 3 instead.
PROMPT Q9: top reporters
SELECT s.student_id,
       s.student_name,
       s.department,
       COUNT(*) AS reports
FROM   student s
JOIN   item i ON i.student_id = s.student_id
GROUP  BY s.student_id, s.student_name, s.department
ORDER  BY reports DESC, s.student_name
FETCH  FIRST 3 ROWS ONLY;

-- @@Q10
-- Q10 Activity summary across all six tables      JOINS: 5   (3 INNER + 2 LEFT)
-- COUNT(DISTINCT ...) stops claims and images multiplying each other's rows.
PROMPT Q10: item activity summary
SELECT i.item_id,
       i.item_name,
       i.item_status,
       c.category_name,
       l.location_name,
       s.student_name                 AS reported_by,
       COUNT(DISTINCT cl.student_id)  AS claims,
       COUNT(DISTINCT im.image_no)    AS images
FROM   item i
JOIN   category c    ON c.category_id = i.category_id
JOIN   location l    ON l.location_id = i.location_id
JOIN   student  s    ON s.student_id  = i.student_id
LEFT   JOIN claim cl       ON cl.item_id = i.item_id
LEFT   JOIN item_image im  ON im.item_id = i.item_id
GROUP  BY i.item_id, i.item_name, i.item_status,
          c.category_name, l.location_name, s.student_name
ORDER  BY i.item_id;
