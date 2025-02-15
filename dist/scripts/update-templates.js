"use strict";
const fs = require('fs');
const path = require('path');
const templatesDir = path.join(__dirname, '..', 'templates');
const scriptTag = '\n    <script src="/js/template-download.js"></script>\n  </body>';
// Read all HTML files in the templates directory
fs.readdir(templatesDir, (err, files) => {
    if (err) {
        console.error('Error reading templates directory:', err);
        process.exit(1);
    }
    files.filter(file => file.endsWith('.html')).forEach(file => {
        const filePath = path.join(templatesDir, file);
        // Read file content
        let content = fs.readFileSync(filePath, 'utf8');
        // Check if script is already added
        if (!content.includes('template-download.js')) {
            // Replace closing body tag with script tag and closing body tag
            content = content.replace('</body>', scriptTag);
            // Write updated content back to file
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
        else {
            console.log(`${file} already has the script`);
        }
    });
});
