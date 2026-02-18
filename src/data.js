// Mock data for demo — replaces Firebase for local development
// When Firebase is configured, import from firebase.js instead

// ─── Students (450+ across 5th-12th) ─────────────────────────
export const STANDARDS = [
    '5th', '6th', '7th', '8th', '9th', '10th', '11th Commerce', '12th Commerce', '11th Science', '12th Science'
];

export const SUBJECTS_BY_STANDARD = {
    '5th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '6th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '7th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '8th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '9th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '10th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '11th Commerce': ['Accountancy', 'Economics', 'Business Studies', 'English', 'Maths/SP'],
    '12th Commerce': ['Accountancy', 'Economics', 'Business Studies', 'English', 'Maths/SP'],
    '11th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
    '12th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
};

const firstNames = ['Aarav', 'Aditi', 'Arjun', 'Ananya', 'Dhruv', 'Divya', 'Eshan', 'Gauri', 'Harsh', 'Ishita', 'Jay', 'Kavya', 'Krish', 'Lavanya', 'Manav', 'Neha', 'Om', 'Pooja', 'Rahul', 'Riya', 'Sai', 'Shreya', 'Tanmay', 'Urvi', 'Varun', 'Vidhi', 'Yash', 'Zara', 'Aditya', 'Bhavna', 'Chirag', 'Diya', 'Farhan', 'Gita', 'Hemant', 'Isha', 'Jai', 'Komal', 'Laksh', 'Meera', 'Nikhil', 'Pallavi', 'Rohit', 'Sakshi', 'Tushar', 'Uma', 'Vikram', 'Yamini', 'Akash', 'Priya'];
const lastNames = ['Sharma', 'Patel', 'Desai', 'Joshi', 'Gupta', 'Singh', 'Mehta', 'Shah', 'More', 'Patil', 'Kulkarni', 'Verma', 'Nair', 'Reddy', 'Kumar', 'Chauhan', 'Rane', 'Sawant', 'Bhosale', 'Jadhav'];

function generateStudents() {
    const students = [];
    let id = 1;
    const studentsPerStandard = { '5th': 45, '6th': 50, '7th': 48, '8th': 52, '9th': 55, '10th': 60, '11th Commerce': 35, '12th Commerce': 30, '11th Science': 40, '12th Science': 35 };

    for (const std of STANDARDS) {
        const count = studentsPerStandard[std];
        for (let i = 0; i < count; i++) {
            const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
            const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
            students.push({
                id: `STU${String(id).padStart(4, '0')}`,
                name: `${fn} ${ln}`,
                standard: std,
                rollNo: i + 1,
                parentId: `PAR${String(id).padStart(4, '0')}`,
                parentName: `Mr. ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                parentPhone: `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
                email: `${fn.toLowerCase()}.${ln.toLowerCase()}${id}@email.com`,
                attendancePercent: Math.floor(70 + Math.random() * 30),
                feeStatus: ['paid', 'pending', 'overdue'][Math.floor(Math.random() * 3)],
                totalFees: std.includes('11th') || std.includes('12th') ? 35000 : 25000,
                paidFees: 0,
            });
            students[students.length - 1].paidFees =
                students[students.length - 1].feeStatus === 'paid' ? students[students.length - 1].totalFees :
                    students[students.length - 1].feeStatus === 'pending' ? Math.floor(students[students.length - 1].totalFees * 0.5) : 0;
            id++;
        }
    }
    return students;
}

export const STUDENTS = generateStudents();
export const TOTAL_STUDENTS = STUDENTS.length;

// ─── Users (login credentials) ─────────────────────────
export const DEMO_USERS = {
    'parent@demo.com': { password: 'parent123', role: 'parent', name: 'Mr. Rakesh Sharma', childId: 'STU0001' },
    'student@demo.com': { password: 'student123', role: 'student', name: 'Aarav Sharma', studentId: 'STU0001', standard: '5th' },
    'admin@demo.com': { password: 'admin123', role: 'admin', name: 'Sunita Deshmukh', designation: 'Admin Staff' },
    'superadmin@demo.com': { password: 'super123', role: 'superadmin', name: 'Dipesh Sir', designation: 'Director' },
};

// ─── Attendance Records ─────────────────────────
function generateAttendance() {
    const records = [];
    const now = new Date();
    for (let d = 30; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        if (date.getDay() === 0) continue; // Skip Sundays

        for (const student of STUDENTS.slice(0, 50)) { // First 50 for perf
            const rand = Math.random();
            records.push({
                studentId: student.id,
                studentName: student.name,
                standard: student.standard,
                date: date.toISOString().split('T')[0],
                status: rand > 0.15 ? 'present' : rand > 0.05 ? 'late' : 'absent',
                arrivalTime: rand > 0.15 ? `${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
                method: rand > 0.5 ? 'face_detection' : 'manual',
            });
        }
    }
    return records;
}

export const ATTENDANCE_RECORDS = generateAttendance();

// ─── Resources ─────────────────────────
export const RESOURCES = [
    { id: 'R001', title: 'Algebra Fundamentals - Chapter 1', type: 'pdf', standard: '9th', subject: 'Mathematics', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-10', size: '2.4 MB', tags: ['algebra', 'fundamentals'], missedLecture: false },
    { id: 'R002', title: 'Chemical Bonding - Video Lecture', type: 'video', standard: '11th Science', subject: 'Chemistry', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-09', size: '125 MB', url: 'https://youtube.com/watch?v=demo', tags: ['bonding', 'chemistry'], missedLecture: true, lectureDate: '2026-02-08' },
    { id: 'R003', title: 'Accountancy Practice MCQs - Set 1', type: 'mcq', standard: '12th Commerce', subject: 'Accountancy', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-08', questions: 50, tags: ['mcq', 'practice'], missedLecture: false },
    { id: 'R004', title: 'Newton\'s Laws - PPT Presentation', type: 'ppt', standard: '10th', subject: 'Science', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-07', size: '8.1 MB', tags: ['physics', 'newton'], missedLecture: true, lectureDate: '2026-02-06' },
    { id: 'R005', title: 'Essay Writing Guide', type: 'notes', standard: '8th', subject: 'English', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-06', size: '1.1 MB', tags: ['essay', 'writing'], missedLecture: false },
    { id: 'R006', title: 'Trigonometry Formulae Summary', type: 'pdf', standard: '10th', subject: 'Mathematics', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-05', size: '890 KB', tags: ['trigonometry'], missedLecture: false },
    { id: 'R007', title: 'JEE Main 2025 Paper Analysis', type: 'video', standard: '12th Science', subject: 'Physics', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-04', size: '210 MB', tags: ['jee', 'paper analysis'], missedLecture: true, lectureDate: '2026-02-03' },
    { id: 'R008', title: 'Economics - Demand & Supply Notes', type: 'notes', standard: '11th Commerce', subject: 'Economics', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-03', size: '1.5 MB', tags: ['economics', 'micro'], missedLecture: false },
    { id: 'R009', title: 'NEET Biology MCQ Set - Genetics', type: 'mcq', standard: '12th Science', subject: 'Biology', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-02', questions: 75, tags: ['neet', 'genetics'], missedLecture: false },
    { id: 'R010', title: 'Hindi Vyakaran - Revision PPT', type: 'ppt', standard: '7th', subject: 'Hindi', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-01', size: '5.2 MB', tags: ['hindi', 'grammar'], missedLecture: true, lectureDate: '2026-01-31' },
    { id: 'R011', title: 'Organic Chemistry - Hydrocarbons', type: 'video', standard: '11th Science', subject: 'Chemistry', uploadedBy: 'Dipesh Sir', uploadDate: '2026-01-30', tags: ['organic'], missedLecture: true, lectureDate: '2026-01-29' },
    { id: 'R012', title: 'Marathi Nibandh Collection', type: 'notes', standard: '9th', subject: 'Marathi', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-01-28', size: '980 KB', tags: ['marathi', 'essay'], missedLecture: false },
];

// ─── Notifications ─────────────────────────
export const NOTIFICATIONS = [
    { id: 'N001', title: 'Fee Payment Reminder', message: 'Term 2 fees of ₹12,500 are due by Feb 20, 2026.', type: 'fee', time: '2 hours ago', read: false, for: ['parent'] },
    { id: 'N002', title: 'New Resource Uploaded', message: 'Algebra Fundamentals chapter notes have been uploaded for 9th Standard.', type: 'resource', time: '5 hours ago', read: false, for: ['student'] },
    { id: 'N003', title: 'Attendance Alert', message: 'Your child Aarav was marked late today at 09:15 AM.', type: 'attendance', time: '1 day ago', read: true, for: ['parent'] },
    { id: 'N004', title: 'MCQ Test Scheduled', message: 'Chemistry MCQ test for 11th Science scheduled for Feb 18.', type: 'exam', time: '1 day ago', read: false, for: ['student', 'parent'] },
    { id: 'N005', title: 'Holiday Notice', message: 'Tutorials will remain closed on Feb 19 (Shivaji Jayanti).', type: 'general', time: '2 days ago', read: true, for: ['parent', 'student', 'admin'] },
    { id: 'N006', title: 'Pending Payments Report', message: '32 students have outstanding fees for this term.', type: 'fee', time: '3 days ago', read: false, for: ['admin', 'superadmin'] },
    { id: 'N007', title: 'New Enrollment', message: 'New student Priya Patil enrolled in 7th Standard batch.', type: 'general', time: '4 days ago', read: true, for: ['admin', 'superadmin'] },
    { id: 'N008', title: 'Monthly Report Ready', message: 'January 2026 attendance & financial report is ready for review.', type: 'report', time: '5 days ago', read: false, for: ['superadmin'] },
];

// ─── Financial Data ─────────────────────────
export const FINANCIAL_DATA = {
    totalRevenue: 1125000,
    totalExpenses: 485000,
    netProfit: 640000,
    pendingFees: 375000,
    collectedThisMonth: 280000,
    monthlyRevenue: [
        { month: 'Sep', revenue: 320000, expenses: 145000 },
        { month: 'Oct', revenue: 285000, expenses: 138000 },
        { month: 'Nov', revenue: 265000, expenses: 142000 },
        { month: 'Dec', revenue: 195000, expenses: 130000 },
        { month: 'Jan', revenue: 340000, expenses: 148000 },
        { month: 'Feb', revenue: 280000, expenses: 152000 },
    ],
    expenses: [
        { category: 'Rent', amount: 45000, percentage: 29 },
        { category: 'Salaries', amount: 65000, percentage: 42 },
        { category: 'Utilities', amount: 12000, percentage: 8 },
        { category: 'Study Material', amount: 18000, percentage: 12 },
        { category: 'Misc', amount: 12000, percentage: 9 },
    ],
};

export const INVENTORY = [
    { id: 'INV001', name: 'Mathematics Textbooks (10th)', category: 'Books', quantity: 65, sold: 48, price: 350, cost: 200 },
    { id: 'INV002', name: 'Science Lab Manual (9th)', category: 'Books', quantity: 55, sold: 42, price: 280, cost: 150 },
    { id: 'INV003', name: 'Commerce Guide (12th)', category: 'Books', quantity: 30, sold: 25, price: 420, cost: 250 },
    { id: 'INV004', name: 'JEE Practice Papers Set', category: 'Courses', quantity: 40, sold: 35, price: 1500, cost: 400 },
    { id: 'INV005', name: 'NEET Crash Course Module', category: 'Courses', quantity: 35, sold: 28, price: 2500, cost: 600 },
    { id: 'INV006', name: 'Notebooks (Pack of 6)', category: 'Stationery', quantity: 200, sold: 150, price: 180, cost: 120 },
    { id: 'INV007', name: 'Geometry Box Set', category: 'Stationery', quantity: 80, sold: 62, price: 250, cost: 140 },
    { id: 'INV008', name: 'SSC Board Prep Kit', category: 'Courses', quantity: 60, sold: 52, price: 800, cost: 250 },
];

// ─── Course Outcomes ─────────────────────────
export const COURSE_OUTCOMES = {
    '10th': {
        'Mathematics': [
            { id: 'CO1', description: 'Apply algebraic techniques to solve equations', attainment: 78 },
            { id: 'CO2', description: 'Understand geometric proofs and theorems', attainment: 72 },
            { id: 'CO3', description: 'Solve problems using trigonometric ratios', attainment: 65 },
            { id: 'CO4', description: 'Analyze data using statistics and probability', attainment: 81 },
        ],
        'Science': [
            { id: 'CO1', description: 'Understand chemical reactions and equations', attainment: 74 },
            { id: 'CO2', description: 'Apply laws of motion and energy conservation', attainment: 69 },
            { id: 'CO3', description: 'Explain biological processes in living organisms', attainment: 82 },
        ],
    },
    '12th Science': {
        'Physics': [
            { id: 'CO1', description: 'Apply electrostatics and current electricity concepts', attainment: 71 },
            { id: 'CO2', description: 'Solve optics problems using wave and ray theory', attainment: 68 },
            { id: 'CO3', description: 'Understand modern physics and nuclear reactions', attainment: 62 },
        ],
        'Chemistry': [
            { id: 'CO1', description: 'Master organic reaction mechanisms', attainment: 66 },
            { id: 'CO2', description: 'Apply electrochemistry principles', attainment: 73 },
            { id: 'CO3', description: 'Understand coordination compounds', attainment: 59 },
        ],
    },
    '12th Commerce': {
        'Accountancy': [
            { id: 'CO1', description: 'Prepare financial statements for partnerships', attainment: 85 },
            { id: 'CO2', description: 'Analyze company accounts and balance sheets', attainment: 78 },
            { id: 'CO3', description: 'Apply cost accounting principles', attainment: 70 },
        ],
    },
};
