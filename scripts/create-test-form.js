import XLSX from 'xlsx';

// Create a new workbook
const wb = XLSX.utils.book_new();

// Create sample data
const data = [
  ['EMPLOYEE INFORMATION'],
  ['Full Name*:', 'Enter employee\'s full name'],
  ['Employee ID:', 'Format: EMP-XXXX'],
  ['Department:', ''],
  ['Date of Assessment*:', ''],
  [''],
  ['CORE COMPETENCIES'],
  ['Technical Skills*:', 'Rate employee\'s technical proficiency'],
  ['Communication:', 'Assess verbal and written communication skills'],
  ['Problem Solving:', 'Evaluate ability to resolve complex issues'],
  [''],
  ['LEADERSHIP ASSESSMENT'],
  ['Team Management:', 'Rate ability to lead and manage teams'],
  ['Decision Making*:', 'Assess quality of decisions and judgment'],
  ['Strategic Planning:', 'Evaluate long-term planning capabilities'],
  [''],
  ['OVERALL EVALUATION'],
  ['Performance Rating*:', 'Scale: 1-5 (1=Poor, 5=Excellent)'],
  ['Areas of Improvement:', 'List specific areas needing development'],
  ['Comments:', 'Additional observations or notes'],
  [''],
  ['ACKNOWLEDGMENT'],
  ['Manager Name*:', ''],
  ['Date*:', ''],
  ['Signature:', '']
];

// Convert data to worksheet
const ws = XLSX.utils.aoa_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Assessment');

// Write to file
XLSX.writeFile(wb, '__tests__/fixtures/job-assessment.xlsx');
console.log('Test form created: __tests__/fixtures/job-assessment.xlsx');
