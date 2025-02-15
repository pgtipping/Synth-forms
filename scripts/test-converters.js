import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import PDFParser from 'pdf2json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure font paths
const standardFontDataUrl = join(__dirname, 'fonts');

async function testPDFConversion(filePath) {
  console.log(`Testing PDF conversion for: ${basename(filePath)}`);
  
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataReady", pdfData => {
        try {
          // Convert PDF data to text
          let allText = '';
          for (const page of pdfData.Pages) {
            for (const text of page.Texts) {
              // Decode text content
              const decodedText = decodeURIComponent(text.R[0].T);
              allText += decodedText + '\n';
            }
          }

          // Enhanced field detection patterns with more types and better organization
          const patterns = {
            // Section patterns
            section: {
              main: /^(?:[A-Z][A-Za-z\s]*|[IVX]+)(?:\s*[:]\s*|\s*$)/gm,  // Main sections
              sub: /^(?:\d+\.|\w+\.)\s+[A-Z][A-Za-z\s]*(?:\s*[:]\s*|\s*$)/gm,  // Subsections
              numbered: /^\d+\.\d+\s+[A-Z][A-Za-z\s]*(?:\s*[:]\s*|\s*$)/gm  // Numbered sections
            },
            
            // Basic field types
            text: {
              single: /\b(?:Name|Title|Department|Position|Role|Location)[:_\s]*$/gmi,
              multiline: /\b(?:Statement|Comments?|Description|Details|Notes|Explanation)[:_\s]*(?:\n\s*[A-Za-z].*)*$/gmi,
              email: /\b(?:Email|E-mail)[\s_]*(?:Address)?[:_\s]*$/gmi,
              phone: /\b(?:Phone|Tel|Mobile|Fax)[\s_]*(?:Number)?[:_\s]*$/gmi,
              url: /\b(?:Website|URL|Link)[:_\s]*$/gmi
            },
            
            // Address fields
            address: {
              main: /\b(?:Address|Location)[:_\s]*$/gmi,
              street: /\b(?:Street|Avenue|Road)[\s_]*(?:Address)?[:_\s]*$/gmi,
              city: /\b(?:City|Town|Municipality)[:_\s]*$/gmi,
              state: /\b(?:State|Province|Region)[:_\s]*$/gmi,
              zip: /\b(?:ZIP|Postal\s*Code)[:_\s]*$/gmi,
              country: /\b(?:Country|Nation)[:_\s]*$/gmi
            },
            
            // Date and time fields
            date: {
              single: /\b(?:Date)[:_\s]*$/gmi,
              range: /\b(?:From|To|Start|End)[\s_]*(?:Date)?[:_\s]*$/gmi,
              period: /\b(?:Duration|Period|Timeline)[:_\s]*$/gmi,
              deadline: /\b(?:Due|Deadline|Target)[\s_]*(?:Date)?[:_\s]*$/gmi
            },
            
            // Numeric fields
            number: {
              integer: /\b(?:Count|Quantity|Number|Amount)[:_\s]*$/gmi,
              decimal: /\b(?:Rate|Percentage|Ratio)[:_\s]*$/gmi,
              currency: /\b(?:Cost|Price|Budget|Salary)[:_\s]*$/gmi,
              range: /\b(?:Minimum|Maximum|Min|Max)[:_\s]*$/gmi
            },
            
            // Selection fields
            selection: {
              single: /\b(?:Select|Choose|Pick)[\s_]*(?:One)?[:_\s]*$/gmi,
              multiple: /\b(?:Select|Choose|Pick)[\s_]*(?:Multiple|Many)[:_\s]*$/gmi,
              dropdown: /▼\s*[A-Z][^.!?]*$/gm
            },
            
            // Boolean fields
            boolean: {
              checkbox: /(?:□|\[\s*\]|☐)\s*[A-Z][^.!?]*$/gm,
              radio: /(?:○|⚪|\(\s*\))\s*[A-Z][^.!?]*$/gm,
              yesno: /\b(?:Yes|No)[:_\s]*$/gmi
            },
            
            // Special fields
            special: {
              required: /\*\s*[A-Z][^.!?]*[:_\s]*$/gm,  // Required fields (marked with asterisk)
              readonly: /\[Read[- ]?only\]\s*[A-Z][^.!?]*[:_\s]*$/gmi,  // Read-only fields
              calculated: /\[Auto[- ]?calculated\]\s*[A-Z][^.!?]*[:_\s]*$/gmi  // Auto-calculated fields
            },
            
            // Catch-all for other fields
            generic: /[A-Z][^.!?]*[:_]\s*$/gm
          };
          
          let formFields = {
            sections: [],
            fields: []
          };
          
          // Initialize current section
          let currentSection = null;
          
          // Calculate text metrics
          const textLength = allText.length;
          const lineCount = allText.split('\n').length;
          const wordCount = allText.split(/\s+/).length;
          
          // Helper function to process nested patterns
          function processPatterns(patterns, parentType = null) {
            for (const [key, value] of Object.entries(patterns)) {
              if (value instanceof RegExp) {
                // Direct pattern
                const matches = allText.match(value) || [];
                for (const match of matches) {
                  formFields.fields.push({
                    type: parentType || key,
                    subtype: parentType ? key : null,
                    label: match.trim(),
                    required: match.includes('*'),
                    readonly: match.toLowerCase().includes('readonly'),
                    section: currentSection
                  });
                }
              } else if (typeof value === 'object') {
                // Nested patterns
                processPatterns(value, key);
              }
            }
          }
          
          // Process sections first
          for (const [type, pattern] of Object.entries(patterns.section)) {
            const matches = allText.match(pattern) || [];
            for (const match of matches) {
              const section = {
                type: type,
                label: match.trim(),
                level: type === 'main' ? 1 : type === 'sub' ? 2 : 3
              };
              formFields.sections.push(section);
              currentSection = section;
            }
          }
          
          // Process all other patterns
          processPatterns(patterns);
          
          // Group related fields
          const groupedFields = formFields.fields.reduce((acc, field) => {
            // Group address fields
            if (field.type === 'address') {
              const addressGroup = acc.find(g => g.type === 'address' && 
                Math.abs(allText.indexOf(g.fields[0].label) - allText.indexOf(field.label)) < 500);
              if (addressGroup) {
                addressGroup.fields.push(field);
                return acc;
              }
              return [...acc, { type: 'address', fields: [field] }];
            }
            
            // Group date ranges
            if (field.type === 'date' && field.subtype === 'range') {
              const dateGroup = acc.find(g => g.type === 'dateRange' && 
                Math.abs(allText.indexOf(g.fields[0].label) - allText.indexOf(field.label)) < 200);
              if (dateGroup) {
                dateGroup.fields.push(field);
                return acc;
              }
              return [...acc, { type: 'dateRange', fields: [field] }];
            }
            
            return [...acc, { type: 'single', fields: [field] }];
          }, []);
          
          // Remove duplicates while preserving type information
          const uniqueFields = Array.from(new Set(formFields.fields.map(f => f.label)))
            .map(label => {
              const fields = formFields.fields.filter(f => f.label === label);
              // Prefer more specific field types over generic
              return fields.find(f => f.type !== 'generic') || fields[0];
            });
          
          console.log('\nResults:');
          console.log('- Text length:', textLength);
          console.log('- Line count:', lineCount);
          console.log('- Word count:', wordCount);
          console.log('- Sections found:', formFields.sections.length);
          console.log('- Form fields found:', uniqueFields.length);
          
          console.log('\nSections:');
          formFields.sections.forEach(section => {
            console.log(`  ${section.type} (Level ${section.level}): ${section.label}`);
          });
          
          console.log('\nField types found:');
          const fieldTypes = {};
          uniqueFields.forEach(field => {
            const type = field.subtype ? `${field.type}.${field.subtype}` : field.type;
            fieldTypes[type] = (fieldTypes[type] || 0) + 1;
          });
          Object.entries(fieldTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });
          
          console.log('\nField groups found:');
          const groupTypes = {};
          groupedFields.forEach(group => {
            groupTypes[group.type] = (groupTypes[group.type] || 0) + 1;
          });
          Object.entries(groupTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });
          
          resolve({
            success: true,
            metrics: {
              textLength,
              lineCount,
              wordCount,
              sectionCount: formFields.sections.length,
              fieldCount: uniqueFields.length,
              fields: uniqueFields,
              sections: formFields.sections,
              groups: groupedFields,
              fieldTypes,
              groupTypes
            }
          });
        } catch (error) {
          reject(error);
        }
      });

      pdfParser.on("pdfParser_dataError", errData => {
        reject(new Error(errData.parserError));
      });

      // Load and parse PDF file
      pdfParser.loadPDF(filePath);
      
    } catch (error) {
      reject(error);
    }
  });
}

async function findPDFFiles(dir) {
  const files = await fs.readdir(dir);
  const pdfFiles = [];
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      const subDirFiles = await findPDFFiles(fullPath);
      pdfFiles.push(...subDirFiles);
    } else if (extname(file).toLowerCase() === '.pdf') {
      pdfFiles.push(fullPath);
    }
  }
  
  return pdfFiles;
}

async function main() {
  const templatesDir = join(__dirname, '../../TM Forms');
  
  try {
    // Find all PDF files recursively
    const pdfFiles = await findPDFFiles(templatesDir);
    const results = [];
    
    console.log(`Found ${pdfFiles.length} PDF files to process`);
    
    for (const filePath of pdfFiles) {
      console.log('\n-----------------------------------');
      const result = await testPDFConversion(filePath);
      results.push({
        file: basename(filePath),
        path: filePath,
        ...result
      });
    }
    
    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      results
    };
    
    await fs.writeFile(
      join(__dirname, '../conversion-test-results.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n-----------------------------------');
    console.log('Test complete! Results saved to conversion-test-results.json');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

main();
