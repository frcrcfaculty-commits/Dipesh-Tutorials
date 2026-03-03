// Mock data for Dipesh Tutorials Demo
// ~200 students across 8th to 12th standards

// ─── Standards & Subjects ─────────────────────────
export const STANDARDS = [
    '8th', '9th', '10th', '11th Commerce', '12th Commerce', '11th Science', '12th Science'
];

export const SUBJECTS_BY_STANDARD = {
    '8th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '9th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '10th': ['Mathematics', 'Science', 'English', 'Hindi', 'Marathi', 'Social Studies'],
    '11th Commerce': ['Accountancy', 'Economics', 'Business Studies', 'English', 'Maths/SP'],
    '12th Commerce': ['Accountancy', 'Economics', 'Business Studies', 'English', 'Maths/SP'],
    '11th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
    '12th Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
};

// ─── Name pools for realistic Indian names ─────────────────────────
const firstNamesMale = ['Aarav', 'Arjun', 'Dhruv', 'Eshan', 'Harsh', 'Jay', 'Krish', 'Manav', 'Om', 'Rahul', 'Sai', 'Tanmay', 'Varun', 'Yash', 'Aditya', 'Chirag', 'Farhan', 'Hemant', 'Jai', 'Laksh', 'Nikhil', 'Rohit', 'Tushar', 'Vikram', 'Akash', 'Rohan', 'Sahil', 'Karan', 'Dev', 'Pranav', 'Shubham', 'Vishal', 'Amit', 'Ankit', 'Gaurav'];
const firstNamesFemale = ['Aditi', 'Ananya', 'Divya', 'Gauri', 'Ishita', 'Kavya', 'Lavanya', 'Neha', 'Pooja', 'Riya', 'Shreya', 'Urvi', 'Vidhi', 'Zara', 'Bhavna', 'Diya', 'Gita', 'Isha', 'Komal', 'Meera', 'Pallavi', 'Sakshi', 'Uma', 'Yamini', 'Priya', 'Sneha', 'Tanvi', 'Aisha', 'Nisha', 'Swati', 'Megha', 'Simran', 'Kritika', 'Ankita', 'Payal'];
const lastNames = ['Sharma', 'Patel', 'Desai', 'Joshi', 'Gupta', 'Singh', 'Mehta', 'Shah', 'More', 'Patil', 'Kulkarni', 'Verma', 'Nair', 'Reddy', 'Kumar', 'Chauhan', 'Rane', 'Sawant', 'Bhosale', 'Jadhav', 'Pawar', 'Thakur', 'Mishra', 'Yadav', 'Tiwari', 'Pandey', 'Shetty', 'Iyer', 'Menon', 'Pillai'];

// Seeded random for consistent data
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateStudents() {
    const students = [];
    let id = 1;
    
    // Distribution: ~200 students across 8th-12th
    const studentsPerStandard = { 
        '8th': 35,           // 35
        '9th': 38,           // 38
        '10th': 42,          // 42 (more for SSC)
        '11th Commerce': 22, // 22
        '12th Commerce': 20, // 20
        '11th Science': 25,  // 25
        '12th Science': 22   // 22
        // Total: 204 students
    };

    for (const std of STANDARDS) {
        const count = studentsPerStandard[std];
        for (let i = 0; i < count; i++) {
            const seed = id * 31;
            const isFemale = seededRandom(seed) > 0.5;
            const fnPool = isFemale ? firstNamesFemale : firstNamesMale;
            const fn = fnPool[Math.floor(seededRandom(seed + 1) * fnPool.length)];
            const ln = lastNames[Math.floor(seededRandom(seed + 2) * lastNames.length)];
            
            const feeStatusRand = seededRandom(seed + 3);
            const feeStatus = feeStatusRand > 0.65 ? 'paid' : feeStatusRand > 0.25 ? 'pending' : 'overdue';
            const totalFees = std.includes('11th') || std.includes('12th') ? 35000 : 25000;
            
            let paidFees;
            if (feeStatus === 'paid') paidFees = totalFees;
            else if (feeStatus === 'pending') paidFees = Math.floor(totalFees * (0.3 + seededRandom(seed + 4) * 0.4));
            else paidFees = 0;

            const attendancePercent = Math.floor(65 + seededRandom(seed + 5) * 35);
            
            students.push({
                id: `STU${String(id).padStart(4, '0')}`,
                name: `${fn} ${ln}`,
                gender: isFemale ? 'Female' : 'Male',
                standard: std,
                rollNo: i + 1,
                parentId: `PAR${String(id).padStart(4, '0')}`,
                parentName: `${isFemale ? 'Mrs.' : 'Mr.'} ${lastNames[Math.floor(seededRandom(seed + 6) * lastNames.length)]}`,
                parentPhone: `+919${Math.floor(100000000 + seededRandom(seed + 7) * 900000000)}`,
                email: `${fn.toLowerCase()}.${ln.toLowerCase()}${id}@email.com`,
                dateOfBirth: generateDOB(std, seed + 8),
                address: generateAddress(seed + 9),
                attendancePercent,
                feeStatus,
                totalFees,
                paidFees,
                enrollmentDate: generateEnrollmentDate(seed + 10),
                subjects: SUBJECTS_BY_STANDARD[std],
            });
            id++;
        }
    }
    return students;
}

function generateDOB(standard, seed) {
    const currentYear = 2026;
    const ageByStandard = {
        '8th': 13, '9th': 14, '10th': 15,
        '11th Commerce': 16, '11th Science': 16,
        '12th Commerce': 17, '12th Science': 17
    };
    const age = ageByStandard[standard] || 15;
    const birthYear = currentYear - age - Math.floor(seededRandom(seed) * 2);
    const month = Math.floor(1 + seededRandom(seed + 1) * 12);
    const day = Math.floor(1 + seededRandom(seed + 2) * 28);
    return `${birthYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateAddress(seed) {
    const areas = ['Andheri', 'Bandra', 'Malad', 'Goregaon', 'Borivali', 'Kandivali', 'Dahisar', 'Jogeshwari', 'Vile Parle', 'Santacruz', 'Khar', 'Juhu', 'Versova', 'Lokhandwala'];
    const area = areas[Math.floor(seededRandom(seed) * areas.length)];
    const houseNo = Math.floor(1 + seededRandom(seed + 1) * 500);
    return `${houseNo}, ${area}, Mumbai - 400${Math.floor(50 + seededRandom(seed + 2) * 50)}`;
}

function generateEnrollmentDate(seed) {
    const year = seededRandom(seed) > 0.7 ? 2025 : 2024;
    const month = year === 2025 ? Math.floor(1 + seededRandom(seed + 1) * 6) : Math.floor(6 + seededRandom(seed + 1) * 7);
    const day = Math.floor(1 + seededRandom(seed + 2) * 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const STUDENTS = generateStudents();
export const TOTAL_STUDENTS = STUDENTS.length;

// ─── Summary by Standard ─────────────────────────
export const STUDENTS_BY_STANDARD = STANDARDS.reduce((acc, std) => {
    acc[std] = STUDENTS.filter(s => s.standard === std);
    return acc;
}, {});

export const STUDENT_COUNTS = STANDARDS.reduce((acc, std) => {
    acc[std] = STUDENTS.filter(s => s.standard === std).length;
    return acc;
}, {});

// ─── Users (login credentials) ─────────────────────────
// NOTE: Names must match the generated STUDENTS data for STU0001
const stu0001 = STUDENTS.find(s => s.id === 'STU0001');
export const DEMO_USERS = {
    'parent@demo.com': { password: 'parent123', role: 'parent', name: stu0001 ? stu0001.parentName : 'Mr. Sharma', childId: 'STU0001' },
    'student@demo.com': { password: 'student123', role: 'student', name: stu0001 ? stu0001.name : 'Student', studentId: 'STU0001', standard: stu0001 ? stu0001.standard : '8th' },
    'admin@demo.com': { password: 'admin123', role: 'admin', name: 'Sunita Deshmukh', designation: 'Admin Staff' },
    'superadmin@demo.com': { password: 'super123', role: 'superadmin', name: 'Dipesh Sir', designation: 'Director' },
};

// ─── Attendance Records ─────────────────────────
// Timezone-safe date formatter (avoids UTC offset issues with toISOString)
function formatLocalDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTodayStr() {
    return formatLocalDate(new Date());
}

function generateAttendance() {
    const records = [];
    const now = new Date(2026, 1, 28); // Feb 28, 2026
    
    for (let d = 30; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        if (date.getDay() === 0) continue; // Skip Sundays

        // Generate for all students
        for (const student of STUDENTS) {
            const seed = student.id.charCodeAt(4) * 100 + d;
            const rand = seededRandom(seed);
            
            let status, arrivalTime = null;
            if (rand > 0.12) {
                status = 'present';
                const hour = 8 + Math.floor(seededRandom(seed + 1) * 2);
                const minute = Math.floor(seededRandom(seed + 2) * 60);
                arrivalTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            } else if (rand > 0.04) {
                status = 'late';
                const hour = 9 + Math.floor(seededRandom(seed + 1));
                const minute = Math.floor(seededRandom(seed + 2) * 30);
                arrivalTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            } else {
                status = 'absent';
            }
            
            records.push({
                studentId: student.id,
                studentName: student.name,
                standard: student.standard,
                date: formatLocalDate(date),
                status,
                arrivalTime,
                method: seededRandom(seed + 3) > 0.4 ? 'face_detection' : 'manual',
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
    { id: 'R010', title: 'Hindi Vyakaran - Revision PPT', type: 'ppt', standard: '8th', subject: 'Hindi', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-01', size: '5.2 MB', tags: ['hindi', 'grammar'], missedLecture: true, lectureDate: '2026-01-31' },
    { id: 'R011', title: 'Organic Chemistry - Hydrocarbons', type: 'video', standard: '11th Science', subject: 'Chemistry', uploadedBy: 'Dipesh Sir', uploadDate: '2026-01-30', tags: ['organic'], missedLecture: true, lectureDate: '2026-01-29' },
    { id: 'R012', title: 'Marathi Nibandh Collection', type: 'notes', standard: '9th', subject: 'Marathi', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-01-28', size: '980 KB', tags: ['marathi', 'essay'], missedLecture: false },
    { id: 'R013', title: 'SSC Board Previous Year Papers (Maths)', type: 'pdf', standard: '10th', subject: 'Mathematics', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-12', size: '15 MB', tags: ['ssc', 'board', 'practice'], missedLecture: false },
    { id: 'R014', title: 'Partnership Accounts - Full Chapter', type: 'video', standard: '12th Commerce', subject: 'Accountancy', uploadedBy: 'Sunita Deshmukh', uploadDate: '2026-02-11', size: '180 MB', tags: ['partnership', 'accounts'], missedLecture: false },
    { id: 'R015', title: 'Physics Numericals - Electricity', type: 'pdf', standard: '10th', subject: 'Science', uploadedBy: 'Dipesh Sir', uploadDate: '2026-02-13', size: '3.2 MB', tags: ['physics', 'electricity', 'numericals'], missedLecture: false },
];

// ─── Notifications ─────────────────────────
export const NOTIFICATIONS = [
    { id: 'N001', title: 'Fee Payment Reminder', message: 'Term 2 fees of ₹12,500 are due by Feb 20, 2026.', type: 'fee', time: '2 hours ago', read: false, for: ['parent'] },
    { id: 'N002', title: 'New Resource Uploaded', message: 'Algebra Fundamentals chapter notes have been uploaded for 9th Standard.', type: 'resource', time: '5 hours ago', read: false, for: ['student'] },
    { id: 'N003', title: 'Attendance Alert', message: 'Your child was marked late today at 09:15 AM.', type: 'attendance', time: '1 day ago', read: true, for: ['parent'] },
    { id: 'N004', title: 'MCQ Test Scheduled', message: 'Chemistry MCQ test for 11th Science scheduled for Feb 18.', type: 'exam', time: '1 day ago', read: false, for: ['student', 'parent'] },
    { id: 'N005', title: 'Holiday Notice', message: 'Tutorials will remain closed on Feb 19 (Shivaji Jayanti).', type: 'general', time: '2 days ago', read: true, for: ['parent', 'student', 'admin'] },
    { id: 'N006', title: 'Pending Payments Report', message: '32 students have outstanding fees for this term.', type: 'fee', time: '3 days ago', read: false, for: ['admin', 'superadmin'] },
    { id: 'N007', title: 'New Enrollment', message: 'New student Priya Patil enrolled in 8th Standard batch.', type: 'general', time: '4 days ago', read: true, for: ['admin', 'superadmin'] },
    { id: 'N008', title: 'Monthly Report Ready', message: 'January 2026 attendance & financial report is ready for review.', type: 'report', time: '5 days ago', read: false, for: ['superadmin'] },
    { id: 'N009', title: 'SSC Board Exam Schedule', message: '10th standard board exams start from March 1, 2026.', type: 'exam', time: '6 days ago', read: false, for: ['student', 'parent'] },
    { id: 'N010', title: 'New Batch Starting', message: 'Special batch for JEE/NEET crash course starting March 5.', type: 'general', time: '1 week ago', read: true, for: ['student', 'parent'] },
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
    '8th': {
        'Mathematics': [
            { id: 'CO1', description: 'Solve linear equations in one variable', attainment: 82 },
            { id: 'CO2', description: 'Understand quadrilaterals and polygons', attainment: 78 },
            { id: 'CO3', description: 'Apply ratio and proportion concepts', attainment: 85 },
        ],
        'Science': [
            { id: 'CO1', description: 'Understand microorganisms and their effects', attainment: 76 },
            { id: 'CO2', description: 'Explain force and pressure concepts', attainment: 72 },
        ],
    },
    '9th': {
        'Mathematics': [
            { id: 'CO1', description: 'Apply number system concepts', attainment: 79 },
            { id: 'CO2', description: 'Solve polynomial equations', attainment: 74 },
            { id: 'CO3', description: 'Understand coordinate geometry basics', attainment: 71 },
        ],
        'Science': [
            { id: 'CO1', description: 'Explain cell structure and functions', attainment: 80 },
            { id: 'CO2', description: 'Apply laws of motion', attainment: 68 },
        ],
    },
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
    '11th Science': {
        'Physics': [
            { id: 'CO1', description: 'Apply kinematics and dynamics concepts', attainment: 73 },
            { id: 'CO2', description: 'Understand work, energy, and power', attainment: 70 },
        ],
        'Chemistry': [
            { id: 'CO1', description: 'Master atomic structure and periodic table', attainment: 75 },
            { id: 'CO2', description: 'Understand chemical bonding', attainment: 68 },
        ],
        'Mathematics': [
            { id: 'CO1', description: 'Apply sets and functions concepts', attainment: 77 },
            { id: 'CO2', description: 'Understand trigonometric functions', attainment: 72 },
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
    '11th Commerce': {
        'Accountancy': [
            { id: 'CO1', description: 'Understand accounting fundamentals', attainment: 80 },
            { id: 'CO2', description: 'Prepare trial balance and financial statements', attainment: 75 },
        ],
        'Economics': [
            { id: 'CO1', description: 'Apply microeconomic principles', attainment: 78 },
            { id: 'CO2', description: 'Understand market structures', attainment: 72 },
        ],
    },
    '12th Commerce': {
        'Accountancy': [
            { id: 'CO1', description: 'Prepare financial statements for partnerships', attainment: 85 },
            { id: 'CO2', description: 'Analyze company accounts and balance sheets', attainment: 78 },
            { id: 'CO3', description: 'Apply cost accounting principles', attainment: 70 },
        ],
        'Economics': [
            { id: 'CO1', description: 'Understand macroeconomic concepts', attainment: 76 },
            { id: 'CO2', description: 'Analyze Indian economy developments', attainment: 72 },
        ],
    },
};

// ─── Topics by Subject (for test marking) ─────────────────────────
export const TOPICS_BY_SUBJECT = {
    'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Statistics & Probability', 'Number Systems', 'Mensuration'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
    'English': ['Grammar', 'Comprehension', 'Writing', 'Literature'],
    'Hindi': ['Vyakaran', 'Gadya', 'Padya', 'Lekhan'],
    'Marathi': ['Vyakaran', 'Gadya', 'Padya', 'Lekhan'],
    'Social Studies': ['History', 'Geography', 'Civics', 'Economics'],
    'Physics': ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity & Magnetism', 'Modern Physics'],
    'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
    'Biology': ['Botany', 'Zoology', 'Genetics', 'Ecology'],
    'Accountancy': ['Journal Entries', 'Ledger & Trial Balance', 'Financial Statements', 'Partnership Accounts'],
    'Economics': ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'Statistics for Economics'],
    'Business Studies': ['Business Environment', 'Management Principles', 'Marketing', 'Finance & Trade'],
    'Maths/SP': ['Algebra', 'Calculus', 'Statistics', 'Probability'],
};

// ─── Tests ─────────────────────────
export const TESTS = [
    { id: 'T001', name: 'Unit Test 1', date: '2025-08-15', maxMarksPerTopic: 25, type: 'unit' },
    { id: 'T002', name: 'Mid-Term Exam', date: '2025-11-10', maxMarksPerTopic: 25, type: 'midterm' },
    { id: 'T003', name: 'Unit Test 2', date: '2026-01-20', maxMarksPerTopic: 25, type: 'unit' },
];

// ─── Generate Test Results ─────────────────────────
function generateTestResults() {
    const results = [];
    let resultId = 1;

    for (const student of STUDENTS) {
        const subjects = SUBJECTS_BY_STANDARD[student.standard] || [];

        for (const test of TESTS) {
            for (const subject of subjects) {
                const topics = TOPICS_BY_SUBJECT[subject] || ['General'];
                const baseSeed = student.id.charCodeAt(4) * 1000 + resultId;

                // Generate topic-wise marks (each out of maxMarksPerTopic)
                const topicMarks = topics.map((topic, ti) => {
                    const seed = baseSeed + ti * 7 + test.id.charCodeAt(3) * 13;
                    // Create varied performance: some students strong in some topics, weak in others
                    const studentStrength = seededRandom(baseSeed + ti) * 0.4 + 0.3; // 0.3–0.7 base
                    const topicDifficulty = seededRandom(seed + 100) * 0.3; // 0–0.3 variance
                    const testVariance = seededRandom(seed + 200) * 0.2 - 0.1; // -0.1 to 0.1
                    const rawPercent = Math.min(1, Math.max(0.08, studentStrength + topicDifficulty + testVariance));
                    const marks = Math.round(rawPercent * test.maxMarksPerTopic);
                    return { topic, marks, maxMarks: test.maxMarksPerTopic };
                });

                const totalMarks = topicMarks.reduce((s, t) => s + t.marks, 0);
                const maxTotal = topicMarks.reduce((s, t) => s + t.maxMarks, 0);
                const percentage = Math.round((totalMarks / maxTotal) * 100);
                const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 35 ? 'D' : 'F';

                results.push({
                    id: `TR${String(resultId).padStart(5, '0')}`,
                    studentId: student.id,
                    studentName: student.name,
                    standard: student.standard,
                    testId: test.id,
                    testName: test.name,
                    testDate: test.date,
                    subject,
                    topicMarks,
                    totalMarks,
                    maxTotal,
                    percentage,
                    grade,
                });
                resultId++;
            }
        }
    }
    return results;
}

export const TEST_RESULTS = generateTestResults();

// ─── Helper functions ─────────────────────────
export const getStudentById = (id) => STUDENTS.find(s => s.id === id);
export const getStudentsByStandard = (std) => STUDENTS.filter(s => s.standard === std);
export const getAttendanceByStudent = (id) => ATTENDANCE_RECORDS.filter(a => a.studentId === id);
export const getAttendanceByDate = (date) => ATTENDANCE_RECORDS.filter(a => a.date === date);
export const getResourcesByStandard = (std) => RESOURCES.filter(r => r.standard === std);
export const getTestResultsByStudent = (id) => TEST_RESULTS.filter(r => r.studentId === id);
export const getTestResultsByStandard = (std) => TEST_RESULTS.filter(r => r.standard === std);

// Get weak topics for a student (topics where they scored < 50% in latest test)
export function getWeakTopics(studentId) {
    const student = STUDENTS.find(s => s.id === studentId);
    if (!student) return [];
    const latestTest = TESTS[TESTS.length - 1];
    const results = TEST_RESULTS.filter(r => r.studentId === studentId && r.testId === latestTest.id);
    const weakTopics = [];
    for (const result of results) {
        for (const tm of result.topicMarks) {
            const pct = (tm.marks / tm.maxMarks) * 100;
            if (pct < 50) {
                weakTopics.push({
                    subject: result.subject,
                    topic: tm.topic,
                    marks: tm.marks,
                    maxMarks: tm.maxMarks,
                    percentage: Math.round(pct),
                    grade: result.grade,
                });
            }
        }
    }
    return weakTopics.sort((a, b) => a.percentage - b.percentage);
}

// Get improvement suggestions for weak topics
export function getImprovementSuggestions(studentId) {
    const weakTopics = getWeakTopics(studentId);
    const student = STUDENTS.find(s => s.id === studentId);
    if (!student) return [];
    const resources = RESOURCES.filter(r => r.standard === student.standard);

    return weakTopics.map(wt => {
        const relatedResources = resources.filter(r =>
            r.subject.toLowerCase() === wt.subject.toLowerCase() ||
            r.tags.some(t => wt.topic.toLowerCase().includes(t.toLowerCase()))
        );
        const suggestions = [];
        if (wt.percentage < 30) suggestions.push(`Needs urgent attention — scored only ${wt.marks}/${wt.maxMarks}`);
        else suggestions.push(`Scored ${wt.marks}/${wt.maxMarks} — needs more practice`);
        suggestions.push(`Revise ${wt.topic} concepts in ${wt.subject}`);
        if (relatedResources.length > 0) suggestions.push(`Check resource: "${relatedResources[0].title}"`);
        return { ...wt, suggestions, relatedResources };
    });
}

// Console log for verification
console.log(`📚 Dipesh Tutorials - Loaded ${TOTAL_STUDENTS} students across ${STANDARDS.length} standards`);
console.log(`📊 Distribution:`, STUDENT_COUNTS);
console.log(`📝 Test Results: ${TEST_RESULTS.length} records across ${TESTS.length} tests`);
