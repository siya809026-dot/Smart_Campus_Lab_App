# Normalization Proof: 1NF, 2NF and 3NF

This proof applies to the relational schema in `ER_constraints_and_3NF.md` (section 5), 15 tables.

## 1. First normal form (1NF)

- Every attribute holds one atomic value. There are no repeating groups and no multi-valued columns.
- Every table has a primary key.
- Result: all 15 tables are in 1NF.

## 2. Functional dependencies and candidate keys

Rule used for 2NF and 3NF: for every non-trivial FD X -> A, either X is a superkey (BCNF), or A is a prime attribute (part of some candidate key) (3NF).

| Table | Candidate keys | Non-trivial FDs |
|---|---|---|
| Department | dept_id; dept_name; head_id (non-NULL values only) | dept_id -> dept_name, contact_email, office_location, head_id; dept_name -> dept_id; head_id -> dept_id (when head_id is not NULL) |
| Employee | emp_id; email | emp_id -> name, email, phone, role_type, designation, dept_id, joining_date, status; email -> emp_id |
| Faculty | emp_id | emp_id -> role_type, specialization |
| Student | student_id; roll_no; email | student_id -> roll_no, name, email, dept_id; roll_no -> student_id; email -> student_id |
| Lab | lab_id; (floor, room_number) | lab_id -> lab_name, floor, room_number, dept_id, incharge_id; (floor, room_number) -> lab_id |
| Equipment | equip_id; serial_no | equip_id -> lab_id, equip_name, serial_no, equip_condition, purchase_date; serial_no -> equip_id |
| Maintenance | maintenance_id | maintenance_id -> equip_id, reported_by, assigned_to, issue_description, request_date, repair_date, status |
| Lab_Allocation | allocation_id; UQ1 (lab_id, allocation_date, start_time); UQ2 (faculty_id, allocation_date, start_time) | allocation_id -> all other attributes; each composite key -> allocation_id and the rest |
| Student_Attendance | attendance_id; (student_id, allocation_id) | attendance_id -> student_id, allocation_id, check_in_time, status; (student_id, allocation_id) -> attendance_id and the rest |
| Employee_Attendance | emp_att_id; (emp_id, attendance_date) | emp_att_id -> emp_id, attendance_date, check_in_time, check_out_time, status; (emp_id, attendance_date) -> emp_att_id and the rest |
| Leave_Type | leave_type_id; name | leave_type_id -> name, annual_quota, is_paid; name -> leave_type_id |
| Leave_Balance | (emp_id, leave_type_id, year) | key -> allotted, used |
| Leave | leave_id | leave_id -> emp_id, leave_type_id, from_date, to_date, reason, status, approved_by |
| Salary_Structure | salary_id; UQ2 (emp_id, effective_from) (UQ1 (salary_id, emp_id) is a superkey) | salary_id -> emp_id, basic, hra, allowances, deductions, effective_from, effective_to; (emp_id, effective_from) -> salary_id and the rest |
| Payroll | payroll_id; (emp_id, month, year) | payroll_id -> all other attributes; (emp_id, month, year) -> payroll_id and the rest; salary_id -> emp_id (enforced by the composite FK to Salary_Structure, see 4.1); plus the arithmetic dependencies in section 5.2 |

## 3. Second normal form (2NF)

2NF needs checking only where a candidate key is composite.

- **Leave_Balance**, key (emp_id, leave_type_id, year): `allotted` and `used` are values for one employee, one leave type and one year. Neither depends on a proper subset of the key, so there is no partial dependency. (Leave_Balance is a weak entity on the diagram; as a table it is the same, so this check does not change.) (`allotted` is not derived from Leave_Type.annual_quota, because carry-forward and special grants can differ per employee and year.)
- **Other composite candidate keys** (Lab, Lab_Allocation, Student_Attendance, Employee_Attendance, Salary_Structure, Payroll): each table also has a single-column key that determines every attribute, and no attribute depends on only part of a composite key. For example, in Lab_Allocation, `end_time` needs the lab, date and start time together.
- Result: all 15 tables are in 2NF.

## 4. Third normal form (3NF)

- In every table in section 2, each non-trivial FD has a candidate key on the left side, so the table is in BCNF, with one exception: Payroll (section 4.1).
- Result: 14 of 15 tables are in 3NF and BCNF as designed. Employee depends on the assumption in section 5.1. Payroll is not in BCNF (section 4.1). With respect to `salary_id -> emp_id` it is in 3NF, but its stored derived columns make it fall short of strict 3NF as drawn; this is a documented denormalization (section 5.2).

### 4.1 Payroll: salary_id -> emp_id

- Payroll has a composite foreign key (salary_id, emp_id) to Salary_Structure, and salary_id is unique in Salary_Structure. So every payroll row with a given salary_id has the same emp_id: the dependency `salary_id -> emp_id` holds.
- salary_id is not a superkey of Payroll, because one salary row is used by many monthly payroll rows. So Payroll is **not in BCNF**.
- With respect to this dependency it is still in **3NF**: emp_id is a prime attribute, because it belongs to the candidate key (emp_id, month, year). The stored derived columns are a separate, documented denormalization (section 5.2).
- This is a deliberate trade-off. Keeping emp_id in Payroll lets the database enforce UNIQUE (emp_id, month, year), one payroll row per employee per month, and the composite foreign key guarantees that the redundant emp_id can never disagree with the salary row.
- Alternative: remove emp_id from Payroll and reach the employee through Salary_Structure. That gives BCNF, but the one-payroll-per-month rule then needs a trigger.

## 5. Design decisions and alternatives considered

### 5.1 Employee: designation and role_type

- As designed, `designation` is a descriptive attribute that does not determine `role_type`. Under that assumption Employee is in BCNF.
- If every designation implies one role_type (for example 'Professor' always means 'Faculty'), then emp_id -> designation -> role_type is a transitive dependency and Employee is not in 3NF. In that case add `Designation(designation_id, title, role_type)` and keep only `designation_id` in Employee.
- Decision: designation does **not** determine role_type (a job designation and an employee category need not map one-to-one). Alternative: if the institution defines a one-to-one mapping, use the Designation lookup table.

### 5.2 Payroll: derived columns

Payroll contains three columns that can be calculated from other columns in the same row:

- `total_deductions = tax_deduction + other_deductions`
- `net_pay = gross - total_deductions`
- `working_days = paid_days + lop_days`

The determinants {tax_deduction, other_deductions}, {gross, total_deductions} and {paid_days, lop_days} are not candidate keys, and the determined attributes are not prime. Strictly, these are 3NF violations.

- **Strict 3NF version:** remove `total_deductions`, `net_pay` and `working_days` from Payroll and provide them through a view. Payroll(**payroll_id**, emp_id, salary_id, month, year, paid_days, lop_days, gross, tax_deduction, other_deductions, payment_date, payment_status) is then in 3NF (and still not BCNF, see 4.1).
- **Stored-snapshot version (as currently drawn):** keep the columns, because payroll amounts must not change if salary rules change later. State this as a deliberate, documented denormalization protected by the CHECK constraints in `ER_constraints_and_3NF.md`.
- Decision: keep the stored-snapshot version, as drawn. Historical payroll must stay consistent when salary policies change. The calculation rules are documented as CHECK constraints, and the values are validated when payroll is generated. The strict version above is the documented alternative.

### 5.3 Entity names

- The diagram uses the descriptive names `Employee_Attendance` and `Salary_Structure`.
- If the assignment requires the exact names `Attendance` and `Salary`, rename them in the diagram, the schema, the constraints document and this proof. The renaming does not change any functional dependency or normal form.
- Decision: keep the descriptive names. Renaming to `Attendance` and `Salary` changes no dependency.

### 5.4 Lab and Lab_Allocation key assumptions

- `(floor, room_number) -> lab_id` in section 2 assumes one campus building. If there are several buildings, add `building` to Lab and use (building, floor, room_number) as the candidate key. Lab stays in BCNF either way, because lab_id and the composite key both determine every attribute.
- UQ1 and UQ2 in Lab_Allocation are the two composite keys listed in `ER_constraints_and_3NF.md`, section 7. If the institution allows two allocations to start at the same moment for the same lab or faculty, drop that key; the table stays in BCNF through allocation_id.
- Decision: single building, UQ1 and UQ2 as drawn.

## 6. Design decisions that keep the schema normalized

- Leave types and quotas are stored once in Leave_Type, not repeated in Leave or Leave_Balance.
- Salary_Structure history is stored in Salary_Structure rows with effective dates, so Payroll does not repeat salary components.
- Department data is stored once in Department; Employee, Student and Lab reference it by dept_id.
- Faculty-only data (specialization) is in Faculty, not as mostly-empty columns in Employee.
