// Initialize download functionality
document.addEventListener('DOMContentLoaded', function() {
  // PDF download buttons
  document.querySelectorAll('button#download-pdf').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        // Show loading state
        const originalText = button.textContent;
        button.textContent = 'Generating PDF...';
        button.disabled = true;

        const form = button.closest('form');
        if (!form) {
          throw new Error('Form not found');
        }

        // Get form title
        const titleElement = document.querySelector('h1');
        const title = titleElement?.textContent?.trim() || 'document';

        // Clone form and remove buttons
        const formClone = form.cloneNode(true);
        formClone.querySelectorAll('button').forEach(btn => btn.remove());

        // Add print styles
        const printStyles = `
          <style>
            @media print {
              body {
                font-size: 12pt;
                line-height: 1.5;
                color: #000;
              }
              .form-group {
                margin-bottom: 1em;
              }
              label {
                font-weight: bold;
              }
              input, textarea, select {
                border: 1px solid #ccc;
                padding: 0.5em;
                width: 100%;
              }
              @page {
                margin: 2cm;
              }
            }
          </style>
        `;
        formClone.insertAdjacentHTML('afterbegin', printStyles);

        // Generate PDF
        const response = await fetch('/api/templates/export/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: formClone.outerHTML,
            title: title,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate PDF');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Failed to download PDF:', error);
        alert('Failed to download PDF. Please try again.');
      } finally {
        // Reset button state
        button.textContent = originalText;
        button.disabled = false;
      }
    });
  });
});
