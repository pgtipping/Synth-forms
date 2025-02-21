"use strict";
/**
 * Utility functions for exporting templates to different formats
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
exports.initializeDownloadHandlers = initializeDownloadHandlers;
/**
 * Generate and download a PDF from template HTML
 */
function generatePDF(html, title) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/templates/export/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html, title }),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || 'Failed to generate PDF');
            }
            // Get the PDF blob
            const blob = yield response.blob();
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
        }
        catch (error) {
            console.error('PDF generation failed:', error);
            throw error;
        }
    });
}
/**
 * Add download handlers to template buttons
 */
function initializeDownloadHandlers() {
    // PDF download buttons
    document.querySelectorAll('button#download-pdf').forEach((button) => {
        button.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const form = button.closest('form');
                if (!form)
                    return;
                // Get form title
                const titleElement = document.querySelector('h1');
                const title = (titleElement === null || titleElement === void 0 ? void 0 : titleElement.textContent) || 'document';
                // Clone form and remove buttons
                const formClone = form.cloneNode(true);
                formClone.querySelectorAll('button').forEach(btn => btn.remove());
                // Generate PDF
                yield generatePDF(formClone.outerHTML, title);
            }
            catch (error) {
                console.error('Failed to download PDF:', error);
                alert('Failed to download PDF. Please try again.');
            }
        }));
    });
}
