# Smart_Campus_Lab_App
# Smart Campus Lab & Payroll Management System

A full-stack relational database and role-based web application built with **MySQL 8.0** and **Node.js / Express**, integrating campus lab scheduling, equipment maintenance, employee attendance, leave management, and automated monthly payroll processing.

## Architecture & Phases
- **Phase 1 — Data Modeling & Normalization:** 15-table relational schema normalized to 3NF/BCNF with composite foreign keys, partial specialization (`Employee` → `Faculty`), and `CHECK` constraints.
- **Phase 2 — Procedural SQL:** 14 `BEFORE INSERT` / `BEFORE UPDATE` triggers (lab/faculty slot overlap prevention, leave overlap checks, auto-late marking after `09:15:00`, salary effective-period validation), progressive tax function (`fn_calculate_monthly_tax`), and automated payroll stored procedures.
- **Phase 3 — Reporting & Indexing:** Management queries for monthly attendance summaries, detailed salary slips, and late-mark analytics, optimized with composite indexes verified via `EXPLAIN`.
- **Phase 4 — Security & Transactions:** MySQL 8.0 RBAC (`hr_admin_role` vs. `employee_role`), row-level self-service views, and atomic leave approval transactions (`START TRANSACTION` / `COMMIT` / `ROLLBACK`).
- **Phase 5 — Web Application:** Dual-portal Express dashboard connecting via dedicated role-restricted MySQL user accounts.

## Quick Setup
1. Execute the SQL scripts in `sql/` sequentially (`01_schema_ddl.sql` through `06_phase4_security_and_transactions.sql`) inside **MySQL Workbench 8.0**.
2. Install Node dependencies and start the server:
   ```bash
   npm install
   node server.js
