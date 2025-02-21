"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFieldType = detectFieldType;
exports.detectValidationRules = detectValidationRules;
exports.detectRatingScale = detectRatingScale;
function detectFieldType(label, text) {
    var labelLower = label.toLowerCase();
    var textLower = text.toLowerCase();
    // Rating field detection
    if (labelLower.includes('rating') ||
        labelLower.includes('score') ||
        labelLower.includes('rank') ||
        textLower.includes('scale of') ||
        /rate.*[1-5]|[1-5].*rate/i.test(textLower)) {
        return 'rating';
    }
    // Date field detection
    if (labelLower.includes('date') ||
        labelLower.includes('when') ||
        /\d{2}[-/]\d{2}[-/]\d{4}/.test(text)) {
        return 'date';
    }
    // File upload detection
    if (labelLower.includes('upload') ||
        labelLower.includes('attachment') ||
        labelLower.includes('file')) {
        return 'file';
    }
    // Currency field detection
    if (labelLower.includes('cost') ||
        labelLower.includes('price') ||
        labelLower.includes('amount') ||
        labelLower.includes('budget') ||
        /[$€£¥]/.test(text)) {
        return 'currency';
    }
    // URL field detection
    if (labelLower.includes('url') ||
        labelLower.includes('website') ||
        labelLower.includes('link') ||
        /https?:\/\//.test(text)) {
        return 'url';
    }
    // Textarea detection
    if (labelLower.includes('description') ||
        labelLower.includes('comments') ||
        labelLower.includes('feedback') ||
        labelLower.includes('explain') ||
        text.length > 100) {
        return 'textarea';
    }
    // Default to input
    return 'input';
}
function detectValidationRules(label, text) {
    var rules = [];
    var labelLower = label.toLowerCase();
    // Required field detection
    if (labelLower.includes('*') ||
        labelLower.includes('required') ||
        text.includes('*required')) {
        rules.push({ type: 'required' });
    }
    // Email validation
    if (labelLower.includes('email') ||
        labelLower.includes('e-mail') ||
        /@/.test(text)) {
        rules.push({ type: 'email' });
    }
    // Phone validation
    if (labelLower.includes('phone') ||
        labelLower.includes('mobile') ||
        labelLower.includes('tel') ||
        /\+?\d{1,4}[-.\s]?\(?\d{1,}\)?/.test(text)) {
        rules.push({ type: 'phone' });
    }
    // Number validation
    if (labelLower.includes('number') ||
        labelLower.includes('amount') ||
        labelLower.includes('quantity') ||
        /^\d+$/.test(text)) {
        rules.push({ type: 'number' });
    }
    return rules;
}
function detectRatingScale(text) {
    var scaleMatch = text.match(/(\d+).*to.*(\d+)/i);
    if (scaleMatch) {
        var min = parseInt(scaleMatch[1]);
        var max = parseInt(scaleMatch[2]);
        return {
            min: min,
            max: max,
            step: 1,
            style: 'numeric'
        };
    }
    // Default 5-point scale
    return {
        min: 1,
        max: 5,
        step: 1,
        style: 'numeric'
    };
}
