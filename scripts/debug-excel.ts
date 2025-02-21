import xlsx from 'xlsx';

async function main() {
  const filePath = 'c:/Users/pgeor/OneDrive/Documents/Work/Documents/HR and Business Consulting/Project DIG inputs/Forms and templates/Free Templates and Forms/Competency Assessment/Job Competency Assessment Template_download.xlsx';
  
  console.log('Reading Excel file...');
  const workbook = xlsx.readFile(filePath);
  
  console.log('\nSheet Names:', workbook.SheetNames);
  
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('\nFirst 10 rows:');
  data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });
}

main().catch(console.error);
