"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFormStructure = processFormStructure;
exports.detectSectionLevel = detectSectionLevel;
exports.mergeSections = mergeSections;
exports.validateFormStructure = validateFormStructure;
var uuid_1 = require("uuid");
function processFormStructure(fields) {
    var sections = [];
    var currentSection = null;
    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
        var field = fields_1[_i];
        if (!field.section) {
            // Field doesn't belong to a section, add it to root level
            if (currentSection) {
                sections.push(currentSection);
                currentSection = null;
            }
            sections.push({
                id: (0, uuid_1.v4)(),
                title: 'Default Section',
                fields: [field],
                level: 0
            });
        }
        else {
            if (!currentSection || currentSection.title !== field.section) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    id: (0, uuid_1.v4)(),
                    title: field.section,
                    fields: [field],
                    level: detectSectionLevel(field.section)
                };
            }
            else {
                currentSection.fields.push(field);
            }
        }
    }
    if (currentSection) {
        sections.push(currentSection);
    }
    return sections;
}
function detectSectionLevel(title) {
    // Use heading markers to determine level
    if (title.startsWith('# '))
        return 0;
    if (title.startsWith('## '))
        return 1;
    if (title.startsWith('### '))
        return 2;
    if (title.startsWith('#### '))
        return 3;
    // Use text characteristics
    var words = title.trim().split(' ');
    if (words.length <= 2)
        return 0; // Short titles are likely main sections
    if (title.includes(':'))
        return 1; // Subsections often use colons
    if (title.length > 50)
        return 2; // Long titles are likely deeper subsections
    return 1; // Default to subsection level
}
function mergeSections(sections) {
    var merged = [];
    var sectionMap = new Map();
    for (var _i = 0, sections_1 = sections; _i < sections_1.length; _i++) {
        var section = sections_1[_i];
        var existing = sectionMap.get(section.title);
        if (existing) {
            // Merge fields into existing section
            existing.fields = __spreadArray(__spreadArray([], existing.fields, true), section.fields, true);
        }
        else {
            sectionMap.set(section.title, section);
            merged.push(section);
        }
    }
    // Sort sections by level
    return merged.sort(function (a, b) { return a.level - b.level; });
}
function validateFormStructure(sections) {
    for (var _i = 0, sections_2 = sections; _i < sections_2.length; _i++) {
        var section = sections_2[_i];
        // Check required properties
        if (!section.id || !section.title || !Array.isArray(section.fields)) {
            return false;
        }
        // Validate fields
        for (var _a = 0, _b = section.fields; _a < _b.length; _a++) {
            var field = _b[_a];
            if ('type' in field) { // FormField
                if (!validateFormField(field)) {
                    return false;
                }
            }
            else { // Nested FormSection
                if (!validateFormStructure([field])) {
                    return false;
                }
            }
        }
    }
    return true;
}
function validateFormField(field) {
    return !!(field.id &&
        field.type &&
        field.label &&
        typeof field.required === 'boolean');
}
