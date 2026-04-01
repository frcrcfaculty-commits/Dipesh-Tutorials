-- ============================================================
-- Dipesh Tutorials – SAFE Seed Data (no DO blocks)
-- Paste this entire file into Supabase SQL Editor and click Run.
-- Run AFTER schema.sql has been executed successfully.
-- ============================================================

-- ─── PART 1: INSERT 20 STUDENTS ─────────────────────────────
INSERT INTO students (name, roll_no, gender, standard_id, parent_name, parent_phone, date_of_birth, address) VALUES
('Aarav Sharma', 1, 'Male', 1, 'Mr. Rajesh Sharma', '+919876543210', '2012-03-15', 'Palghar'),
('Priya Patel', 2, 'Female', 1, 'Mrs. Sunita Patel', '+919876543211', '2012-07-22', 'Palghar'),
('Rohan Desai', 3, 'Male', 1, 'Mr. Vijay Desai', '+919876543212', '2012-01-10', 'Boisar'),
('Ananya Joshi', 1, 'Female', 2, 'Mr. Suresh Joshi', '+919876543213', '2011-05-18', 'Palghar'),
('Dhruv Gupta', 2, 'Male', 2, 'Mrs. Meena Gupta', '+919876543214', '2011-11-30', 'Kelva'),
('Kavya Mehta', 3, 'Female', 2, 'Mr. Hemant Mehta', '+919876543215', '2011-08-09', 'Palghar'),
('Arjun Singh', 1, 'Male', 3, 'Mr. Ranjit Singh', '+919876543216', '2010-04-25', 'Boisar'),
('Sneha Kulkarni', 2, 'Female', 3, 'Mrs. Asha Kulkarni', '+919876543217', '2010-12-03', 'Palghar'),
('Yash Patil', 3, 'Male', 3, 'Mr. Manoj Patil', '+919876543218', '2010-06-14', 'Safala'),
('Ishita Verma', 4, 'Female', 3, 'Mr. Alok Verma', '+919876543219', '2010-09-28', 'Palghar'),
('Karan Nair', 1, 'Male', 4, 'Mrs. Lakshmi Nair', '+919876543220', '2009-02-11', 'Palghar'),
('Riya Chauhan', 2, 'Female', 4, 'Mr. Deepak Chauhan', '+919876543221', '2009-10-07', 'Boisar'),
('Tanmay Sawant', 3, 'Male', 4, 'Mrs. Neha Sawant', '+919876543222', '2009-07-19', 'Palghar'),
('Divya More', 1, 'Female', 6, 'Mr. Prakash More', '+919876543223', '2009-01-05', 'Kelva'),
('Sahil Rane', 2, 'Male', 6, 'Mrs. Sujata Rane', '+919876543224', '2009-03-22', 'Palghar'),
('Meera Thakur', 3, 'Female', 6, 'Mr. Rajendra Thakur', '+919876543225', '2009-08-16', 'Boisar'),
('Varun Mishra', 1, 'Male', 7, 'Mrs. Kavita Mishra', '+919876543226', '2008-05-30', 'Palghar'),
('Pooja Yadav', 2, 'Female', 7, 'Mr. Ramesh Yadav', '+919876543227', '2008-11-12', 'Safala'),
('Nikhil Pandey', 3, 'Male', 5, 'Mrs. Pushpa Pandey', '+919876543228', '2008-04-08', 'Palghar'),
('Sakshi Iyer', 4, 'Female', 5, 'Mr. Venkat Iyer', '+919876543229', '2008-09-25', 'Boisar')
ON CONFLICT DO NOTHING;

-- ─── PART 2: TESTS ──────────────────────────────────────────
INSERT INTO tests (id, name, standard_id, test_date) VALUES
('aaaaaaaa-0001-0001-0001-000000000001', 'Unit Test 1 - March 2026', 1, '2026-03-15'),
('aaaaaaaa-0001-0001-0001-000000000002', 'Unit Test 1 - March 2026', 2, '2026-03-15'),
('aaaaaaaa-0001-0001-0001-000000000003', 'Unit Test 1 - March 2026', 3, '2026-03-15')
ON CONFLICT DO NOTHING;

-- ─── PART 3: TEST RESULTS (plain INSERTs, no DO block) ──────
-- Aarav Sharma marks
INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 78, 100
FROM students s, subjects sub
WHERE s.name = 'Aarav Sharma' AND s.standard_id = 1
  AND sub.name = 'Mathematics' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 85, 100
FROM students s, subjects sub
WHERE s.name = 'Aarav Sharma' AND s.standard_id = 1
  AND sub.name = 'Science' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 92, 100
FROM students s, subjects sub
WHERE s.name = 'Aarav Sharma' AND s.standard_id = 1
  AND sub.name = 'English' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

-- Priya Patel marks
INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 65, 100
FROM students s, subjects sub
WHERE s.name = 'Priya Patel' AND s.standard_id = 1
  AND sub.name = 'Mathematics' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 42, 100
FROM students s, subjects sub
WHERE s.name = 'Priya Patel' AND s.standard_id = 1
  AND sub.name = 'Science' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 71, 100
FROM students s, subjects sub
WHERE s.name = 'Priya Patel' AND s.standard_id = 1
  AND sub.name = 'English' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

-- Rohan Desai marks
INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 88, 100
FROM students s, subjects sub
WHERE s.name = 'Rohan Desai' AND s.standard_id = 1
  AND sub.name = 'Mathematics' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 91, 100
FROM students s, subjects sub
WHERE s.name = 'Rohan Desai' AND s.standard_id = 1
  AND sub.name = 'Science' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

INSERT INTO test_results (test_id, student_id, subject_id, marks_obtained, max_marks)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', s.id, sub.id, 76, 100
FROM students s, subjects sub
WHERE s.name = 'Rohan Desai' AND s.standard_id = 1
  AND sub.name = 'English' AND sub.standard_id = 1
ON CONFLICT DO NOTHING;

-- ─── PART 4: ATTENDANCE (flat INSERTs, no DO block) ─────────
-- 8th std students: last 5 weekdays
INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '1 day', 'present'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 1
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '2 days', 'present'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 1
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '3 days', 'late'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 1
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '4 days', 'present'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 1
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '5 days', 'absent'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 1
ON CONFLICT (student_id, date) DO NOTHING;

-- 9th std students: last 5 weekdays
INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '1 day', 'present'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 2
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '2 days', 'late'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 2
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '3 days', 'present'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 2
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '4 days', 'present'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 2
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO attendance (student_id, date, status, method)
SELECT s.id, CURRENT_DATE - interval '5 days', 'absent'::attendance_status, 'manual'
FROM students s WHERE s.standard_id = 2
ON CONFLICT (student_id, date) DO NOTHING;

-- ─── PART 5: FEE PAYMENTS ───────────────────────────────────
-- Aarav fully paid
INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, payment_date)
SELECT id, 15000, 'upi', 'RCP-001', '2025-06-20'::date FROM students WHERE name = 'Aarav Sharma' LIMIT 1;
INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, payment_date)
SELECT id, 10000, 'cash', 'RCP-002', '2025-10-15'::date FROM students WHERE name = 'Aarav Sharma' LIMIT 1;

-- Priya partial
INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, payment_date)
SELECT id, 10000, 'bank_transfer', 'RCP-003', '2025-07-01'::date FROM students WHERE name = 'Priya Patel' LIMIT 1;

-- Arjun paid in full
INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, payment_date)
SELECT id, 25000, 'cheque', 'RCP-004', '2025-06-15'::date FROM students WHERE name = 'Arjun Singh' LIMIT 1;

-- Karan partial
INSERT INTO fee_payments (student_id, amount, payment_method, receipt_no, payment_date)
SELECT id, 20000, 'upi', 'RCP-005', '2025-07-10'::date FROM students WHERE name = 'Karan Nair' LIMIT 1;

-- ─── PART 6: NOTIFICATIONS ──────────────────────────────────
INSERT INTO notifications (title, message, type, target_roles) VALUES
('Welcome to Dipesh Tutorials App', 'We are excited to launch our new digital platform. You can now view attendance, test scores, and more from your phone!', 'general', '{student,parent,admin,superadmin}'),
('Unit Test 1 Results Published', 'March 2026 Unit Test results have been uploaded. Check your Analytics page for detailed scores.', 'exam', '{student,parent}'),
('Fee Payment Reminder', 'Kindly clear any pending fee dues before April 15, 2026. Contact office for installment plans.', 'fee', '{parent}'),
('New Study Materials Uploaded', 'New Mathematics and Science notes have been added to the Resource Hub for 8th, 9th, and 10th standard students.', 'resource', '{student}');

-- ─── PART 7: RESOURCES ──────────────────────────────────────
INSERT INTO resources (title, type, standard_id, subject_id, tags, is_missed_lecture) VALUES
('Algebra Basics - Chapter 1 Notes', 'PDF Notes', 1, (SELECT id FROM subjects WHERE name='Mathematics' AND standard_id=1 LIMIT 1), '{algebra,basics,chapter1}', false),
('Cell Biology Video Lecture', 'Video', 1, (SELECT id FROM subjects WHERE name='Science' AND standard_id=1 LIMIT 1), '{biology,cells,video}', false),
('Grammar Practice MCQs', 'MCQ Set', 1, (SELECT id FROM subjects WHERE name='English' AND standard_id=1 LIMIT 1), '{grammar,practice,mcq}', false),
('Quadratic Equations - Missed Lecture', 'PDF Notes', 2, (SELECT id FROM subjects WHERE name='Mathematics' AND standard_id=2 LIMIT 1), '{quadratic,equations}', true),
('Chemical Reactions PPT', 'PPT', 3, (SELECT id FROM subjects WHERE name='Science' AND standard_id=3 LIMIT 1), '{chemistry,reactions}', false);

-- ─── DONE ───────────────────────────────────────────────────
-- Verify: SELECT count(*) FROM students; → should be 20
-- Verify: SELECT count(*) FROM test_results; → should be 9
-- Verify: SELECT count(*) FROM attendance; → should be ~30
