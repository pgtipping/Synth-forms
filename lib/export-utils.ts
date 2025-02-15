/**
 * Utility functions for exporting templates to different formats
 */

/**
 * Generate and download a PDF from template HTML
 */
export async function generatePDF(html: string, title: string): Promise<void> {
  try {
    const response = await fetch('/api/templates/export/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate PDF');
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
    console.error('PDF generation failed:', error);
    throw error;
  }
}

/**
 * Add download handlers to template buttons
 */
export function initializeDownloadHandlers(): void {
  // PDF download buttons
  document.querySelectorAll('button#download-pdf').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        const form = button.closest('form');
        if (!form) return;

        // Get form title
        const titleElement = document.querySelector('h1');
        const title = titleElement?.textContent || 'document';

        // Clone form and remove buttons
        const formClone = form.cloneNode(true) as HTMLFormElement;
        formClone.querySelectorAll('button').forEach(btn => btn.remove());

        // Generate PDF
        await generatePDF(formClone.outerHTML, title);
      } catch (error) {
        console.error('Failed to download PDF:', error);
        alert('Failed to download PDF. Please try again.');
      }
    });
  });
}
