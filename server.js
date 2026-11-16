const express = require('express');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const { fmtCurrency, fmtDate, badge, pageShell, authShell } = require('./ui');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const pools = {
  admin: mysql.createPool({ host: 'localhost', user: 'suresh.menon', password: 'Admin@2026!', database: 'campus_lab_hr', connectionLimit: 5 }),
  employee: mysql.createPool({ host: 'localhost', user: 'rohan.verma', password: 'Emp@2026!', database: 'campus_lab_hr', connectionLimit: 5 })
};

// Session middleware
function requireRole(role) {
  return (req, res, next) => {
    const raw = req.cookies.campus_user;
    if (!raw) return res.redirect('/login');
    try {
      const user = JSON.parse(raw);
      if (role && user.role !== role) {
        return res.redirect(user.role === 'admin' ? '/admin' : '/employee');
      }
      req.user = user;
      next();
    } catch {
      res.clearCookie('campus_user');
      res.redirect('/login');
    }
  };
}

// ============================================================================
// AUTH ROUTES: ROLE LOGIN, SIGN UP & LOGOUT
// ============================================================================
app.get('/', (req, res) => {
  if (!req.cookies.campus_user) return res.redirect('/login');
  const user = JSON.parse(req.cookies.campus_user);
  res.redirect(user.role === 'admin' ? '/admin' : '/employee');
});

app.get('/login', (req, res) => {
  res.send(authShell(req.query.msg || '', req.query.err === '1'));
});

app.post('/login', async (req, res) => {
  const { role, email, password } = req.body;
  try {
    if (role === 'admin') {
      const [rows] = await pools.admin.query(
        "SELECT emp_id, name, email, role_type FROM Employee WHERE email = ? AND role_type = 'Admin' AND status = 'Active'",
        [email.trim()]
      );
      if (!rows.length || password !== 'Admin@2026!') {
        return res.redirect('/login?err=1&msg=' + encodeURIComponent('Invalid Admin credentials. Use suresh.menon@campus.edu / Admin@2026!'));
      }
      res.cookie('campus_user', JSON.stringify({ role: 'admin', emp_id: rows[0].emp_id, name: rows[0].name, email: rows[0].email }));
      return res.redirect('/admin');
    } else {
      const [rows] = await pools.admin.query(
        "SELECT emp_id, name, email, role_type FROM Employee WHERE email = ? AND status = 'Active'",
        [email.trim()]
      );
      if (!rows.length || password.length < 4) {
        return res.redirect('/login?err=1&msg=' + encodeURIComponent('Employee email not found or invalid password.'));
      }
      res.cookie('campus_user', JSON.stringify({ role: 'employee', emp_id: rows[0].emp_id, name: rows[0].name, email: rows[0].email }));
      return res.redirect('/employee');
    }
  } catch (err) {
    res.redirect('/login?err=1&msg=' + encodeURIComponent(err.message));
  }
});

app.post('/signup', async (req, res) => {
  const { name, email, phone, role_type, dept_id, designation } = req.body;
  try {
    const [result] = await pools.admin.query(
      `INSERT INTO Employee (name, email, phone, role_type, designation, dept_id, joining_date, status)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Active')`,
      [name.trim(), email.trim(), phone.trim(), role_type, designation.trim(), Number(dept_id)]
    );
    const newId = result.insertId;
    if (role_type === 'Faculty') {
      await pools.admin.query('INSERT INTO Faculty (emp_id, role_type, specialization) VALUES (?, ?, ?)', [newId, 'Faculty', designation.trim()]);
    }
    // Initialize default 2026 leave balances & baseline salary structure
    await pools.admin.query(
      `INSERT INTO Leave_Balance (emp_id, leave_type_id, year, allotted, used)
       SELECT ?, leave_type_id, 2026, annual_quota, 0 FROM Leave_Type WHERE annual_quota > 0`,
      [newId]
    );
    await pools.admin.query(
      `INSERT INTO Salary_Structure (emp_id, basic, hra, allowances, deductions, effective_from)
       VALUES (?, 45000.00, 15000.00, 8000.00, 2000.00, '2026-10-01')`,
      [newId]
    );
    res.cookie('campus_user', JSON.stringify({ role: role_type === 'Admin' ? 'admin' : 'employee', emp_id: newId, name: name.trim(), email: email.trim() }));
    res.redirect(role_type === 'Admin' ? '/admin?msg=' + encodeURIComponent('Admin account created!') : '/employee?msg=' + encodeURIComponent('Welcome! Your employee account, salary structure & leave balances are ready.'));
  } catch (err) {
    res.redirect('/login?err=1&msg=' + encodeURIComponent('Sign up failed: ' + err.message));
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('campus_user');
  res.redirect('/login?msg=' + encodeURIComponent('You have been logged out securely.'));
});

// ============================================================================
// HR / ADMIN PORTAL (/admin)
// ============================================================================
app.get('/admin', requireRole('admin'), async (req, res) => {
  try {
    const db = pools.admin;
    const [employees] = await db.query('SELECT emp_id, name, role_type, designation FROM Employee ORDER BY emp_id');
    const [faculties] = await db.query("SELECT emp_id, name FROM Employee WHERE role_type = 'Faculty' ORDER BY emp_id");
    const [labList] = await db.query('SELECT lab_id, lab_name, room_number FROM Lab ORDER BY lab_id');

    const [attendance] = await db.query(`
      SELECT e.emp_id, e.name, e.role_type, d.dept_name,
        COUNT(CASE WHEN ea.status = 'Present' THEN 1 END) AS present_days,
        COUNT(CASE WHEN ea.status = 'Late' THEN 1 END) AS late_days,
        COUNT(CASE WHEN ea.status = 'Half-day' THEN 1 END) AS half_days,
        COUNT(CASE WHEN ea.status = 'On leave' THEN 1 END) AS leave_days,
        COUNT(CASE WHEN ea.status = 'Absent' THEN 1 END) AS absent_days
      FROM Employee e JOIN Department d ON e.dept_id = d.dept_id
      LEFT JOIN Employee_Attendance ea ON e.emp_id = ea.emp_id AND MONTH(ea.attendance_date) = 10 AND YEAR(ea.attendance_date) = 2026
      GROUP BY e.emp_id, e.name, e.role_type, d.dept_name ORDER BY e.emp_id
    `);
    const [payroll] = await db.query(`
      SELECT p.payroll_id, e.name, d.dept_name, CONCAT(LPAD(p.month,2,'0'), '-', p.year) AS period,
             p.paid_days, p.lop_days, p.gross, p.tax_deduction, p.other_deductions, p.net_pay, p.payment_status
      FROM Payroll p JOIN Employee e ON p.emp_id = e.emp_id JOIN Department d ON e.dept_id = d.dept_id
      WHERE p.month = 10 AND p.year = 2026 ORDER BY e.emp_id
    `);
    const [lateReport] = await db.query(`
      SELECT e.emp_id, e.name, d.dept_name, COUNT(ea.emp_att_id) AS total_late, MAX(ea.check_in_time) AS latest_checkin,
             SEC_TO_TIME(ROUND(AVG(TIME_TO_SEC(TIMEDIFF(ea.check_in_time, '09:15:00'))))) AS avg_late_by
      FROM Employee_Attendance ea JOIN Employee e ON ea.emp_id = e.emp_id JOIN Department d ON e.dept_id = d.dept_id
      WHERE ea.status = 'Late' GROUP BY e.emp_id, e.name, d.dept_name ORDER BY total_late DESC, e.emp_id
    `);
    const [leaves] = await db.query(`
      SELECT l.leave_id, e.name, lt.name AS leave_type, l.from_date, l.to_date, l.reason, l.status
      FROM \`Leave\` l JOIN Employee e ON l.emp_id = e.emp_id JOIN Leave_Type lt ON l.leave_type_id = lt.leave_type_id
      ORDER BY l.leave_id DESC
    `);
    const [labs] = await db.query(`
      SELECT la.allocation_id, l.lab_name, l.room_number, e.name AS faculty, la.subject_name, la.allocation_date, la.start_time, la.end_time
      FROM Lab_Allocation la JOIN Lab l ON la.lab_id = l.lab_id JOIN Employee e ON la.faculty_id = e.emp_id
      ORDER BY la.allocation_date DESC, la.start_time
    `);
    const [maintenance] = await db.query(`
      SELECT m.maintenance_id, eq.equip_name, l.lab_name, m.issue_description, m.request_date, m.status
      FROM Maintenance m JOIN Equipment eq ON m.equip_id = eq.equip_id JOIN Lab l ON eq.lab_id = l.lab_id
      ORDER BY m.maintenance_id
    `);

    const totalNet = payroll.reduce((sum, r) => sum + Number(r.net_pay), 0);
    const totalLate = lateReport.reduce((sum, r) => sum + Number(r.total_late), 0);
    const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;

    const body = `
      <div class="page-header">
        <div>
          <h1>HR &amp; Campus Lab Command Center</h1>
          <p>Create schedules, mark attendance, approve leaves atomically &amp; disburse monthly payroll</p>
        </div>
        <div class="action-bar">
          <button class="btn" onclick="openModal('modalLab')">+ Allocate Lab Slot</button>
          <button class="btn btn-outline" onclick="openModal('modalAtt')">+ Mark Attendance</button>
          <button class="btn btn-outline" onclick="openModal('modalEmp')">+ Add Staff</button>
        </div>
      </div>

      <section class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Active Workforce</div><div class="kpi-value">${employees.length}</div><div class="kpi-sub">Across 3 campus departments</div></div>
        <div class="kpi-card"><div class="kpi-label">Oct 2026 Net Payroll</div><div class="kpi-value">${fmtCurrency(totalNet)}</div><div class="kpi-sub">${payroll.length} generated salary slips</div></div>
        <div class="kpi-card"><div class="kpi-label">Auto-Flagged Late Marks</div><div class="kpi-value">${totalLate}</div><div class="kpi-sub">Trigger cutoff after 09:15:00</div></div>
        <div class="kpi-card"><div class="kpi-label">Pending Leave Requests</div><div class="kpi-value">${pendingLeaves}</div><div class="kpi-sub">${labs.length} active lab bookings</div></div>
      </section>

      <div class="tabs">
        <button class="tab-btn active" onclick="showTab('all', this)">All Modules</button>
        <button class="tab-btn" onclick="showTab('payroll', this)">Payroll &amp; Slips</button>
        <button class="tab-btn" onclick="showTab('attendance', this)">Attendance &amp; Late Marks</button>
        <button class="tab-btn" onclick="showTab('leaves', this)">Leave Approvals (${pendingLeaves})</button>
        <button class="tab-btn" onclick="showTab('labs', this)">Labs &amp; Maintenance</button>
      </div>

      <div class="section-panel" data-tab="payroll">
        <div class="card">
          <div class="card-header">
            <h2>Automated Monthly Payroll Batch (<code>sp_generate_monthly_payroll_all</code>)</h2>
            <form class="form-inline" method="POST" action="/admin/run-payroll">
              <input type="number" name="month" value="10" min="1" max="12" style="width:90px;" required />
              <input type="number" name="year" value="2026" min="2020" max="2030" style="width:110px;" required />
              <button class="btn" type="submit">Run Batch Payroll</button>
            </form>
          </div>
          <div class="card-header">
            <h2>October 2026 Salary Slips</h2>
            <input id="searchPayroll" onkeyup="filterTable('searchPayroll', 'tblPayroll')" placeholder="Search employee or dept..." />
          </div>
          <div class="table-wrap"><table id="tblPayroll">
            <thead><tr><th>Slip</th><th>Employee</th><th>Department</th><th>Paid</th><th>LOP</th><th>Gross</th><th>Tax</th><th>Other</th><th>Net Pay</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${payroll.map((p) => `<tr>
              <td>#${p.payroll_id}</td><td><strong>${p.name}</strong></td><td>${p.dept_name}</td><td>${p.paid_days}</td><td>${p.lop_days}</td>
              <td>${fmtCurrency(p.gross)}</td><td>${fmtCurrency(p.tax_deduction)}</td><td>${fmtCurrency(p.other_deductions)}</td>
              <td><strong>${fmtCurrency(p.net_pay)}</strong></td><td>${badge(p.payment_status)}</td>
              <td>${p.payment_status === 'Pending'
                ? `<form method="POST" action="/admin/pay-slip" style="margin:0;"><input type="hidden" name="payroll_id" value="${p.payroll_id}"/><button class="btn btn-sm" type="submit">Mark Paid</button></form>`
                : '✓ Paid'}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <div class="section-panel" data-tab="attendance">
        <div class="card">
          <div class="card-header">
            <h2>October 2026 Attendance Summary</h2>
            <input id="searchAtt" onkeyup="filterTable('searchAtt', 'tblAtt')" placeholder="Search employee..." />
          </div>
          <div class="table-wrap"><table id="tblAtt">
            <thead><tr><th>ID</th><th>Employee</th><th>Role</th><th>Department</th><th>Present</th><th>Late</th><th>Half-day</th><th>On Leave</th><th>Absent</th></tr></thead>
            <tbody>${attendance.map((r) => `<tr><td>${r.emp_id}</td><td><strong>${r.name}</strong></td><td>${r.role_type}</td><td>${r.dept_name}</td><td>${r.present_days}</td><td>${r.late_days > 0 ? badge(r.late_days + ' Late') : '0'}</td><td>${r.half_days}</td><td>${r.leave_days}</td><td>${r.absent_days > 0 ? badge(r.absent_days + ' Absent') : '0'}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="card-header"><h2>Late Marks Analytics (Trigger-Flagged &gt; 09:15:00)</h2></div>
          <div class="table-wrap"><table>
            <thead><tr><th>ID</th><th>Employee</th><th>Department</th><th>Total Late</th><th>Latest Check-In</th><th>Avg Delay</th></tr></thead>
            <tbody>${lateReport.map((l) => `<tr><td>${l.emp_id}</td><td><strong>${l.name}</strong></td><td>${l.dept_name}</td><td>${badge(l.total_late + ' Marks')}</td><td>${l.latest_checkin}</td><td>${l.avg_late_by}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <div class="section-panel" data-tab="leaves">
        <div class="card">
          <div class="card-header"><h2>Leave Approval Queue (Atomic Transaction)</h2></div>
          <div class="table-wrap"><table>
            <thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${leaves.map((l) => `<tr>
              <td>#${l.leave_id}</td><td><strong>${l.name}</strong></td><td>${l.leave_type}</td>
              <td>${fmtDate(l.from_date)}</td><td>${fmtDate(l.to_date)}</td><td>${l.reason || '—'}</td><td>${badge(l.status)}</td>
              <td>${l.status === 'Pending'
                ? `<form method="POST" action="/admin/approve-leave" style="margin:0;"><input type="hidden" name="leave_id" value="${l.leave_id}"/><button class="btn btn-sm" type="submit">Approve</button></form>`
                : '—'}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <div class="section-panel" data-tab="labs">
        <div class="card">
          <div class="card-header">
            <h2>Smart Campus Lab Allocations (Overlap-Protected by Trigger)</h2>
            <button class="btn btn-sm" onclick="openModal('modalLab')">+ New Allocation</button>
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>ID</th><th>Lab</th><th>Room</th><th>Faculty</th><th>Subject</th><th>Date</th><th>Time Slot</th></tr></thead>
            <tbody>${labs.map((a) => `<tr><td>#${a.allocation_id}</td><td><strong>${a.lab_name}</strong></td><td>${a.room_number}</td><td>${a.faculty}</td><td>${a.subject_name}</td><td>${fmtDate(a.allocation_date)}</td><td>${a.start_time} – ${a.end_time}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="card-header"><h2>Equipment Maintenance Tickets</h2></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Ticket</th><th>Equipment</th><th>Lab</th><th>Issue</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>${maintenance.map((m) => `<tr><td>#${m.maintenance_id}</td><td><strong>${m.equip_name}</strong></td><td>${m.lab_name}</td><td>${m.issue_description}</td><td>${fmtDate(m.request_date)}</td><td>${badge(m.status)}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>
      </div>

      <!-- MODAL 1: ALLOCATE LAB SLOT -->
      <div id="modalLab" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-head"><h3>Allocate Smart Campus Lab</h3><button class="close-x" onclick="closeModal('modalLab')">&times;</button></div>
          <form class="form-grid" method="POST" action="/admin/create-lab-slot">
            <label>Select Lab
              <select name="lab_id" required>${labList.map((l) => `<option value="${l.lab_id}">${l.lab_name} (${l.room_number})</option>`).join('')}</select>
            </label>
            <label>Assign Faculty
              <select name="faculty_id" required>${faculties.map((f) => `<option value="${f.emp_id}">${f.name}</option>`).join('')}</select>
            </label>
            <label>Subject / Lab Course Name
              <input type="text" name="subject_name" placeholder="e.g. Cloud & Distributed Systems Lab" required />
            </label>
            <label>Date
              <input type="date" name="allocation_date" value="2026-10-15" required />
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <label>Start Time <input type="time" name="start_time" value="10:00" required /></label>
              <label>End Time <input type="time" name="end_time" value="12:00" required /></label>
            </div>
            <button type="submit" class="btn">Save Lab Booking</button>
          </form>
        </div>
      </div>

      <!-- MODAL 2: MARK ATTENDANCE -->
      <div id="modalAtt" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-head"><h3>Record Employee Attendance</h3><button class="close-x" onclick="closeModal('modalAtt')">&times;</button></div>
          <form class="form-grid" method="POST" action="/admin/mark-attendance">
            <label>Employee
              <select name="emp_id" required>${employees.map((e) => `<option value="${e.emp_id}">#${e.emp_id} — ${e.name} (${e.role_type})</option>`).join('')}</select>
            </label>
            <label>Date
              <input type="date" name="attendance_date" value="2026-10-30" required />
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <label>Check-In (After 09:15 = Auto Late) <input type="time" name="check_in_time" value="09:22" /></label>
              <label>Check-Out <input type="time" name="check_out_time" value="17:15" /></label>
            </div>
            <label>Initial Status
              <select name="status">
                <option value="Present">Present (Trigger auto-marks Late if &gt; 09:15)</option>
                <option value="Half-day">Half-day</option>
                <option value="On leave">On leave</option>
                <option value="Absent">Absent</option>
              </select>
            </label>
            <button type="submit" class="btn">Save Attendance Log</button>
          </form>
        </div>
      </div>

      <!-- MODAL 3: ADD NEW STAFF -->
      <div id="modalEmp" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-head"><h3>Onboard New Campus Staff</h3><button class="close-x" onclick="closeModal('modalEmp')">&times;</button></div>
          <form class="form-grid" method="POST" action="/admin/add-employee">
            <label>Full Name <input type="text" name="name" placeholder="Dr. Kabir Verma" required /></label>
            <label>Email <input type="email" name="email" placeholder="kabir.verma@campus.edu" required /></label>
            <label>Phone <input type="text" name="phone" placeholder="9810010055" required /></label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <label>Role
                <select name="role_type">
                  <option value="Faculty">Faculty</option>
                  <option value="Technician">Technician</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
              <label>Department
                <select name="dept_id">
                  <option value="1">Computer Science &amp; AI</option>
                  <option value="2">Electronics &amp; IoT</option>
                  <option value="3">Campus Administration</option>
                </select>
              </label>
            </div>
            <label>Designation <input type="text" name="designation" placeholder="Assistant Professor" required /></label>
            <label>Monthly Basic Salary (₹) <input type="number" name="basic" value="50000" min="1000" required /></label>
            <button type="submit" class="btn">Create Staff &amp; Salary Structure</button>
          </form>
        </div>
      </div>
    `;
    res.send(pageShell('HR / Admin Command Center', req.user, body, req.query.msg || '', req.query.err === '1'));
  } catch (err) {
    res.status(500).send(pageShell('Error', req.user, '', err.message, true));
  }
});

// ADMIN POST ACTIONS
app.post('/admin/run-payroll', requireRole('admin'), async (req, res) => {
  try {
    await pools.admin.query('CALL sp_generate_monthly_payroll_all(?, ?)', [Number(req.body.month), Number(req.body.year)]);
    res.redirect('/admin?msg=' + encodeURIComponent(`Batch payroll generated for ${req.body.month}/${req.body.year}.`));
  } catch (err) {
    res.redirect('/admin?err=1&msg=' + encodeURIComponent(err.message));
  }
});

app.post('/admin/pay-slip', requireRole('admin'), async (req, res) => {
  try {
    await pools.admin.query("UPDATE Payroll SET payment_status = 'Paid', payment_date = CURDATE() WHERE payroll_id = ?", [Number(req.body.payroll_id)]);
    res.redirect('/admin?msg=' + encodeURIComponent(`Salary Slip #${req.body.payroll_id} marked as Paid!`));
  } catch (err) {
    res.redirect('/admin?err=1&msg=' + encodeURIComponent(err.message));
  }
});

app.post('/admin/approve-leave', requireRole('admin'), async (req, res) => {
  try {
    await pools.admin.query('CALL sp_approve_leave_request(?, ?)', [Number(req.body.leave_id), req.user.emp_id]);
    res.redirect('/admin?msg=' + encodeURIComponent(`Leave #${req.body.leave_id} approved atomically & leave balance deducted!`));
  } catch (err) {
    res.redirect('/admin?err=1&msg=' + encodeURIComponent('Transaction Rolled Back: ' + err.message));
  }
});

app.post('/admin/create-lab-slot', requireRole('admin'), async (req, res) => {
  const { lab_id, faculty_id, subject_name, allocation_date, start_time, end_time } = req.body;
  try {
    await pools.admin.query(
      'INSERT INTO Lab_Allocation (lab_id, faculty_id, subject_name, allocation_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [Number(lab_id), Number(faculty_id), subject_name.trim(), allocation_date, start_time, end_time]
    );
    res.redirect('/admin?msg=' + encodeURIComponent('New lab slot allocated successfully!'));
  } catch (err) {
    // Catches MySQL Trigger trg_lab_alloc_insert overlap violation!
    res.redirect('/admin?err=1&msg=' + encodeURIComponent('MySQL Trigger Blocked Booking: ' + err.message));
  }
});

app.post('/admin/mark-attendance', requireRole('admin'), async (req, res) => {
  const { emp_id, attendance_date, check_in_time, check_out_time, status } = req.body;
  try {
    await pools.admin.query(
      `INSERT INTO Employee_Attendance (emp_id, attendance_date, check_in_time, check_out_time, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE check_in_time = VALUES(check_in_time), check_out_time = VALUES(check_out_time), status = VALUES(status)`,
      [Number(emp_id), attendance_date, check_in_time || null, check_out_time || null, status]
    );
    res.redirect('/admin?msg=' + encodeURIComponent('Attendance saved! (Check-ins after 09:15 are auto-flagged Late by trigger).'));
  } catch (err) {
    res.redirect('/admin?err=1&msg=' + encodeURIComponent(err.message));
  }
});

app.post('/admin/add-employee', requireRole('admin'), async (req, res) => {
  const { name, email, phone, role_type, dept_id, designation, basic } = req.body;
  try {
    const [r] = await pools.admin.query(
      'INSERT INTO Employee (name, email, phone, role_type, designation, dept_id, joining_date, status) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), "Active")',
      [name.trim(), email.trim(), phone.trim(), role_type, designation.trim(), Number(dept_id)]
    );
    const id = r.insertId;
    if (role_type === 'Faculty') {
      await pools.admin.query('INSERT INTO Faculty (emp_id, role_type, specialization) VALUES (?, "Faculty", ?)', [id, designation.trim()]);
    }
    await pools.admin.query('INSERT INTO Salary_Structure (emp_id, basic, hra, allowances, deductions, effective_from) VALUES (?, ?, ?, ?, 2000.00, "2026-10-01")', [id, Number(basic), Math.round(Number(basic) * 0.4), Math.round(Number(basic) * 0.2)]);
    await pools.admin.query('INSERT INTO Leave_Balance (emp_id, leave_type_id, year, allotted, used) SELECT ?, leave_type_id, 2026, annual_quota, 0 FROM Leave_Type WHERE annual_quota > 0', [id]);
    res.redirect('/admin?msg=' + encodeURIComponent(`${name} onboarded with Salary Structure & 2026 Leave Quotas!`));
  } catch (err) {
    res.redirect('/admin?err=1&msg=' + encodeURIComponent(err.message));
  }
});

// ============================================================================
// EMPLOYEE SELF-SERVICE PORTAL (/employee)
// ============================================================================
app.get('/employee', requireRole('employee'), async (req, res) => {
  try {
    // Uses restricted RBAC connection for rohan.verma, or scoped query for newly signed-up employees
    const isDemoRohan = req.user.email === 'rohan.verma@campus.edu';
    const [slips] = isDemoRohan
      ? await pools.employee.query('SELECT * FROM vw_employee_self_payroll ORDER BY year DESC, month DESC')
      : await pools.admin.query('SELECT * FROM Payroll WHERE emp_id = ? ORDER BY year DESC, month DESC', [req.user.emp_id]);

    const [balances] = isDemoRohan
      ? await pools.employee.query('SELECT * FROM vw_employee_self_leave_balance')
      : await pools.admin.query('SELECT lt.name AS leave_type, lb.allotted, lb.used, (lb.allotted - lb.used) AS remaining FROM Leave_Balance lb JOIN Leave_Type lt ON lb.leave_type_id = lt.leave_type_id WHERE lb.emp_id = ?', [req.user.emp_id]);

    const [recentAtt] = isDemoRohan
      ? await pools.employee.query('SELECT * FROM vw_employee_self_attendance ORDER BY attendance_date DESC LIMIT 20')
      : await pools.admin.query('SELECT * FROM Employee_Attendance WHERE emp_id = ? ORDER BY attendance_date DESC LIMIT 20', [req.user.emp_id]);

    const [myLeaves] = await pools.admin.query(
      'SELECT l.leave_id, lt.name AS leave_type, l.from_date, l.to_date, l.reason, l.status FROM `Leave` l JOIN Leave_Type lt ON l.leave_type_id = lt.leave_type_id WHERE l.emp_id = ? ORDER BY l.leave_id DESC',
      [req.user.emp_id]
    );
    const [leaveTypes] = await pools.admin.query('SELECT leave_type_id, name FROM Leave_Type ORDER BY leave_type_id');

    const latestNet = slips.length ? fmtCurrency(slips[0].net_pay) : 'Pending Run';
    const totalRemainingLeaves = balances.reduce((s, b) => s + Number(b.remaining), 0);
    const lateCount = recentAtt.filter((a) => a.status === 'Late').length;

    const body = `
      <div class="page-header">
        <div>
          <h1>Welcome, ${req.user.name}</h1>
          <p>Personal Self-Service Portal — Salary slips, leave balances, attendance &amp; leave applications</p>
        </div>
        <div class="action-bar">
          <button class="btn" onclick="openModal('modalApplyLeave')">+ Apply for Leave</button>
        </div>
      </div>

      <section class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Latest Net Salary</div><div class="kpi-value">${latestNet}</div><div class="kpi-sub">${slips.length ? `${String(slips[0].month).padStart(2, '0')}-${slips[0].year}` : 'Awaiting payroll cycle'}</div></div>
        <div class="kpi-card"><div class="kpi-label">Available Leave Balance</div><div class="kpi-value">${totalRemainingLeaves} Days</div><div class="kpi-sub">2026 annual remaining quota</div></div>
        <div class="kpi-card"><div class="kpi-label">Recent Late Marks</div><div class="kpi-value">${lateCount}</div><div class="kpi-sub">In last ${recentAtt.length} attendance logs</div></div>
      </section>

      <div class="card">
        <div class="card-header"><h2>My Salary Slips</h2></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Period</th><th>Working</th><th>Paid</th><th>LOP</th><th>Gross</th><th>Tax</th><th>Other Ded.</th><th>Net Pay</th><th>Status</th></tr></thead>
          <tbody>${slips.length ? slips.map((s) => `<tr><td><strong>${String(s.month).padStart(2, '0')}-${s.year}</strong></td><td>${s.working_days}</td><td>${s.paid_days}</td><td>${s.lop_days}</td><td>${fmtCurrency(s.gross)}</td><td>${fmtCurrency(s.tax_deduction)}</td><td>${fmtCurrency(s.other_deductions)}</td><td><strong>${fmtCurrency(s.net_pay)}</strong></td><td>${badge(s.payment_status)}</td></tr>`).join('') : '<tr><td colspan="9">No salary slips generated yet.</td></tr>'}</tbody>
        </table></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>My Leave Applications &amp; 2026 Quotas</h2>
          <button class="btn btn-sm" onclick="openModal('modalApplyLeave')">+ New Leave Request</button>
        </div>
        <div class="table-wrap" style="margin-bottom:16px;"><table>
          <thead><tr><th>Leave Type</th><th>Allotted</th><th>Used</th><th>Remaining</th></tr></thead>
          <tbody>${balances.map((b) => `<tr><td><strong>${b.leave_type}</strong></td><td>${b.allotted}</td><td>${b.used}</td><td><strong>${b.remaining}</strong></td></tr>`).join('')}</tbody>
        </table></div>
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>${myLeaves.length ? myLeaves.map((l) => `<tr><td>#${l.leave_id}</td><td><strong>${l.leave_type}</strong></td><td>${fmtDate(l.from_date)}</td><td>${fmtDate(l.to_date)}</td><td>${l.reason || '—'}</td><td>${badge(l.status)}</td></tr>`).join('') : '<tr><td colspan="6">No leave requests submitted yet.</td></tr>'}</tbody>
        </table></div>
      </div>

      <div class="card">
        <div class="card-header"><h2>My Recent Attendance Logs</h2></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
          <tbody>${recentAtt.length ? recentAtt.map((a) => `<tr><td>${fmtDate(a.attendance_date)}</td><td>${a.check_in_time || '—'}</td><td>${a.check_out_time || '—'}</td><td>${badge(a.status)}</td></tr>`).join('') : '<tr><td colspan="4">No attendance logs recorded yet.</td></tr>'}</tbody>
        </table></div>
      </div>

      <!-- MODAL: APPLY FOR LEAVE -->
      <div id="modalApplyLeave" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-head"><h3>Submit Leave Request</h3><button class="close-x" onclick="closeModal('modalApplyLeave')">&times;</button></div>
          <form class="form-grid" method="POST" action="/employee/apply-leave">
            <label>Leave Category
              <select name="leave_type_id" required>${leaveTypes.map((lt) => `<option value="${lt.leave_type_id}">${lt.name}</option>`).join('')}</select>
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <label>From Date <input type="date" name="from_date" value="2026-11-05" required /></label>
              <label>To Date <input type="date" name="to_date" value="2026-11-06" required /></label>
            </div>
            <label>Reason
              <textarea name="reason" rows="3" placeholder="Conference travel / personal work..." required></textarea>
            </label>
            <button type="submit" class="btn">Submit Leave Application</button>
          </form>
        </div>
      </div>
    `;
    res.send(pageShell('Employee Self-Service', req.user, body, req.query.msg || '', req.query.err === '1'));
  } catch (err) {
    res.status(500).send(pageShell('Error', req.user, '', err.message, true));
  }
});

app.post('/employee/apply-leave', requireRole('employee'), async (req, res) => {
  const { leave_type_id, from_date, to_date, reason } = req.body;
  try {
    await pools.admin.query(
      "INSERT INTO `Leave` (emp_id, leave_type_id, from_date, to_date, reason, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
      [req.user.emp_id, Number(leave_type_id), from_date, to_date, reason.trim()]
    );
    res.redirect('/employee?msg=' + encodeURIComponent('Leave request submitted! HR Admin can now approve it from the Admin portal.'));
  } catch (err) {
    res.redirect('/employee?err=1&msg=' + encodeURIComponent(err.message));
  }
});

app.listen(3000, () => console.log('Smart Campus Emerald UI running at http://localhost:3000'));