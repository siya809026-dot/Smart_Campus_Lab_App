# Lab and HR ER Model: Constraints and Relational Schema

The normalization proof (functional dependencies, 1NF, 2NF, 3NF) is in the separate file `Normalization_Proof.md`. The diagram is in `campus_lab_er.png` (also `.svg` and `.drawio`).

## 1. Subtype and special relationships

### 1.1 Employee -> Faculty (partial specialization)

- Employee: `PRIMARY KEY (emp_id)`, `UNIQUE (emp_id, role_type)`, `CHECK (role_type IN ('Faculty','Technician','Admin','Staff'))`.
- Faculty: `PRIMARY KEY (emp_id)`, `CHECK (role_type = 'Faculty')`, `FOREIGN KEY (emp_id, role_type) REFERENCES Employee (emp_id, role_type)`.
- Effect: a Faculty row can only exist for an employee whose role_type is 'Faculty'. Not every employee is faculty, so participation is optional on the Employee side `(0,1)` and mandatory on the Faculty side `(1,1)`.
- Faculty.role_type is a copy kept only so the composite FK can enforce the rule. It is always 'Faculty' and depends on emp_id (the key).

### 1.2 Department head (optional both ways, 0..1)

- `Department.head_id`: nullable, `UNIQUE`, `FOREIGN KEY (head_id) REFERENCES Faculty (emp_id)`.
- UNIQUE means a faculty member heads at most one department. NULL allows a department with no head yet.
- Business rule (trigger): the head's `Employee.dept_id` must equal `Department.dept_id`.
- Circular reference (Employee -> Department -> Faculty -> Employee): create the department with `head_id = NULL`, insert the employees and faculty, then set `head_id`.

### 1.3 Payroll uses only its own employee's salary

- Salary_Structure: `UNIQUE (salary_id, emp_id)` (called UQ1 on the diagram).
- Payroll: `FOREIGN KEY (salary_id, emp_id) REFERENCES Salary_Structure (salary_id, emp_id)`.
- Effect: Payroll.emp_id must match the owner of the chosen salary_id.
- Side effect: because of this foreign key, `salary_id -> emp_id` holds in Payroll. This makes Payroll fail BCNF, while it still satisfies 3NF for this dependency (see `Normalization_Proof.md`, sections 4.1 and 5.2).

### 1.4 Optional relationships (nullable foreign keys)

| Relationship | Nullable FK | Participation shown on the diagram |
|---|---|---|
| Maintenance - assigned to - Employee | `Maintenance.assigned_to` (NULL until a technician is assigned) | Maintenance (0,1); Employee (0,N) |
| Lab - in-charge of - Employee | `Lab.incharge_id` (NULL when no in-charge is assigned) | Lab (0,1); Employee (0,N) |
| Leave - approves - Employee | `Leave.approved_by` (NULL while the request is pending) | Leave (0,1); Employee (0,N) |
| Department - headed by - Faculty | `Department.head_id` (NULL until a head is appointed) | Department (0,1); Faculty (0,1) |

- Rule for Leave: `approved_by` must be NOT NULL when `status` is 'Approved' or 'Rejected' (CHECK).
- `reported_by` stays NOT NULL: every maintenance record has a reporter.

## 2. Overlap rules (trigger or exclusion constraint)

1. **Same lab:** two Lab_Allocation rows for the same lab_id on the same allocation_date must not overlap in time (`start_time` to `end_time`).
2. **Same faculty:** two Lab_Allocation rows for the same faculty_id on the same allocation_date must not overlap in time.
3. **Same employee:** two Salary_Structure rows for the same emp_id must not have overlapping `effective_from` to `effective_to` periods. A NULL `effective_to` means the period is still open, so only one open row per employee is allowed.
4. **Same employee, leave:** two Leave rows for the same emp_id with status = 'Approved' must not have overlapping `from_date` to `to_date` periods. Pending and rejected requests are not checked. Enforce with a trigger (or an exclusion constraint on the date range filtered by status = 'Approved'), not only in the diagram.

## 3. Constraints per table

| Table | UNIQUE | CHECK / business rules |
|---|---|---|
| Employee | email; (emp_id, role_type) | role_type and status in allowed lists; joining_date NOT NULL |
| Faculty | - | role_type = 'Faculty' |
| Department | dept_name; head_id (nullable) | head belongs to this department (trigger) |
| Student | roll_no; email | - |
| Lab | UQ* (floor, room_number) | incharge_id nullable; when set, it references an employee |
| Equipment | serial_no | equip_condition in allowed list |
| Maintenance | - | repair_date IS NULL OR repair_date >= request_date; status in allowed list; reported_by NOT NULL; assigned_to nullable; both reference employees |
| Lab_Allocation | UQ1 (lab_id, allocation_date, start_time); UQ2 (faculty_id, allocation_date, start_time) | end_time > start_time; overlap rules 1 and 2 |
| Student_Attendance | (student_id, allocation_id) | status in ('Present','Absent','Late'); check_in_time between the allocation's start_time and end_time (trigger) |
| Employee_Attendance | (emp_id, attendance_date) | check_out_time IS NULL OR check_out_time >= check_in_time; status in ('Present','Late','Absent','Half-day','On leave'); status = 'Late' when check_in_time is after the standard shift start (default 09:15, see section 7); the Phase 3 late-marks report reads status = 'Late' |
| Leave_Type | name | annual_quota >= 0; is_paid is boolean |
| Leave_Balance | PK (emp_id, leave_type_id, year) | allotted >= 0; used >= 0; used <= allotted |
| Leave | - | to_date >= from_date; status in ('Pending','Approved','Rejected'); approved_by nullable; NOT NULL when status in ('Approved','Rejected'); approved_by <> emp_id; overlap rule 4 |
| Salary_Structure | UQ1 (salary_id, emp_id), the target of Payroll's composite FK; UQ2 (emp_id, effective_from) | effective_to nullable (NULL = current), otherwise effective_to >= effective_from; overlap rule 3; **component validation:** basic > 0; hra >= 0; allowances >= 0; deductions >= 0; deductions <= basic + hra + allowances |
| Payroll | (emp_id, month, year) | month BETWEEN 1 AND 12; year in a sensible range; working_days, paid_days, lop_days >= 0; paid_days + lop_days = working_days; gross >= 0; tax_deduction >= 0; other_deductions >= 0; total_deductions = tax_deduction + other_deductions; total_deductions <= gross; net_pay = gross - total_deductions; payment_status in ('Pending','Paid','Failed'); payment_date NOT NULL when payment_status = 'Paid'; the pay month lies within the referenced salary's effective period (trigger) |

### 3.1 Salary_Structure.deductions versus Payroll.other_deductions

Definition used:

- `Salary_Structure.deductions` is the standing monthly deduction amount defined in the salary structure (for example provident fund or professional tax).
- `Payroll.other_deductions` is the monthly snapshot of all non-tax deductions for that payroll row. It **includes** the structure's standing `deductions` for that month, plus any one-off non-tax deductions.
- `Payroll.tax_deduction` is kept separate, so `total_deductions = tax_deduction + other_deductions` never counts the same amount twice.
- Payroll stores a snapshot, so later changes to Salary_Structure do not rewrite past payroll rows.
- Stored derived columns: `total_deductions`, `net_pay` and `working_days` are kept as snapshots (a documented denormalization). They are validated by the CHECK constraints in the Payroll row of section 3 and are checked when payroll is generated. If the faculty requires strict 3NF, they move to a view (see `Normalization_Proof.md`, section 5.2).

## 4. Notation used in the ER diagram

- ISA triangle between Employee and Faculty, with no circle. The specialization is partial (section 1.1). Employee side `(0,1)`, Faculty side `(1,1)`.
- `(min,max)` labels are used on every relationship. Each label shows how often the entity next to it takes part in that relationship, so `(1,1)` means mandatory and exactly one, and `(0,N)` means optional and many.
- Department-Faculty (`headed by`): `(0,1)` on both sides.
- `FK*` marks a column in a composite foreign key. `UQ*` marks a column in a composite UNIQUE constraint when the table has only one such constraint.
- `UQ1` and `UQ2` mark separate composite UNIQUE constraints in the same table (Lab_Allocation and Salary_Structure).
- Relationship names: Employee-Salary_Structure is `earns`. Employee-Employee_Attendance is `has`. Using different names avoids two relationships called `has`.
- Leave_Balance is drawn as a weak entity (double border); `year` is its partial key. It has no key of its own; its primary key is made from Employee, Leave_Type and the year. The links `holds` (Employee) and `defines` (Leave_Type) are its identifying relationships (double diamond).
- There is no direct Employee-Payroll relationship. A payroll row reaches its employee through the composite foreign key to Salary_Structure.

## 5. Relational schema (mapping from the ER diagram)

PK = primary key, FK = foreign key, UQ = unique. Composite keys are in brackets.

1. Department(**dept_id**, dept_name UQ, contact_email, office_location, head_id UQ nullable FK -> Faculty.emp_id)
2. Employee(**emp_id**, name, email UQ, phone, role_type, designation, dept_id FK -> Department, joining_date, status; UQ [emp_id, role_type])
3. Faculty(**emp_id**, role_type, specialization; FK [emp_id, role_type] -> Employee[emp_id, role_type])
4. Student(**student_id**, roll_no UQ, name, email UQ, dept_id FK -> Department)
5. Lab(**lab_id**, lab_name, floor, room_number, dept_id FK -> Department, incharge_id nullable FK -> Employee.emp_id; UQ [floor, room_number])
6. Equipment(**equip_id**, lab_id FK -> Lab, equip_name, serial_no UQ, equip_condition, purchase_date)
7. Maintenance(**maintenance_id**, equip_id FK -> Equipment, reported_by FK -> Employee, assigned_to nullable FK -> Employee, issue_description, request_date, repair_date, status)
8. Lab_Allocation(**allocation_id**, lab_id FK -> Lab, faculty_id FK -> Faculty.emp_id, subject_name, allocation_date, start_time, end_time; UQ1 [lab_id, allocation_date, start_time]; UQ2 [faculty_id, allocation_date, start_time])
9. Student_Attendance(**attendance_id**, student_id FK -> Student, allocation_id FK -> Lab_Allocation, check_in_time, status; UQ [student_id, allocation_id])
10. Employee_Attendance(**emp_att_id**, emp_id FK -> Employee, attendance_date, check_in_time, check_out_time, status; UQ [emp_id, attendance_date])
11. Leave_Type(**leave_type_id**, name UQ, annual_quota, is_paid)
12. Leave_Balance([**emp_id**, **leave_type_id**, **year**], allotted, used; FK emp_id -> Employee, FK leave_type_id -> Leave_Type) (weak entity: owners Employee and Leave_Type, partial key year)
13. Leave(**leave_id**, emp_id FK -> Employee, leave_type_id FK -> Leave_Type, from_date, to_date, reason, status, approved_by nullable FK -> Employee)
14. Salary_Structure(**salary_id**, emp_id FK -> Employee, basic, hra, allowances, deductions, effective_from, effective_to nullable; UQ1 [salary_id, emp_id]; UQ2 [emp_id, effective_from])
15. Payroll(**payroll_id**, emp_id, salary_id, month, year, working_days, paid_days, lop_days, gross, tax_deduction, other_deductions, total_deductions, net_pay, payment_date, payment_status; FK [salary_id, emp_id] -> Salary_Structure[salary_id, emp_id]; UQ [emp_id, month, year])

## 6. Design decisions and alternatives considered

Each decision is explained in `Normalization_Proof.md`, section 5.

1. **Entity names:** `Employee_Attendance` and `Salary_Structure` are used because they are descriptive and distinguish employee attendance from `Student_Attendance`. Alternative: `Attendance` and `Salary`; renaming changes no dependency or normal form.
2. **designation and role_type:** designation is a descriptive attribute that does not determine role_type, so Employee stays in BCNF. Alternative: if one designation always implies one role_type, add a `Designation` lookup table.
3. **Payroll derived columns:** `total_deductions`, `net_pay` and `working_days` are stored as snapshots so past payroll never changes when salary rules change. Alternative: strict 3NF with these columns provided by a view.
4. **Late marks:** Employee_Attendance.status includes 'Late' so the late-marks report is a simple query on status.

## 7. Assumptions behind the keys

These are stated so the keys and the proof can be checked against them.

1. **Lab location:** `UQ* (floor, room_number)` assumes one campus building, so floor and room number identify a lab room. If the campus has several buildings, add a `building` attribute to Lab and change the key to (building, floor, room_number). The proof, section 5.4, covers the effect.
2. **Lab_Allocation keys:** UQ1 (lab_id, allocation_date, start_time) means one lab cannot have two allocations starting at the same moment. UQ2 (faculty_id, allocation_date, start_time) means one faculty member cannot start two allocations at the same moment. Partly overlapping slots are blocked by overlap rules 1 and 2, because a UNIQUE key cannot see overlap.
3. **Leave_Balance:** one row per employee, leave type and year, so (emp_id, leave_type_id, year) is the primary key.
4. **Weak entity notation:** if the assignment or faculty does not expect weak-entity notation, draw Leave_Balance as an ordinary entity with a composite primary key. The table is identical either way.
5. **Shift start for late marks:** the standard shift start is a configurable value (default 09:15). A check-in after it is stored as status = 'Late'. Other statuses are set by the attendance process.
