"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFormConverter = void 0;
var fs_1 = require("fs");
var axios_1 = require("axios");
var form_data_1 = require("form-data");
var uuid_1 = require("uuid");
var field_detection_1 = require("../shared/field-detection");
var form_structure_1 = require("../shared/form-structure");
var LocalFormConverter = /** @class */ (function () {
    function LocalFormConverter() {
        this.inferenceServiceUrl = process.env.INFERENCE_SERVICE_URL || 'http://localhost:8000';
    }
    LocalFormConverter.prototype.convert = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var fileContent, formData, response, fields, sections, mergedSections, isValid, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fs_1.promises.readFile(filePath)];
                    case 1:
                        fileContent = _a.sent();
                        formData = new form_data_1.default();
                        formData.append('file', fileContent, {
                            filename: filePath.split('/').pop() || 'document',
                            contentType: this.getContentType(filePath),
                        });
                        return [4 /*yield*/, axios_1.default.post("".concat(this.inferenceServiceUrl, "/predict"), formData, {
                                headers: __assign({}, formData.getHeaders()),
                            })];
                    case 2:
                        response = _a.sent();
                        fields = response.data.fields
                            .filter(function (field) { return _this.validateField(field); })
                            .map(function (field) { return ({
                            id: (0, uuid_1.v4)(),
                            type: (0, field_detection_1.detectFieldType)(field.label || '', field.text || ''),
                            label: field.label || 'unnamed_field',
                            required: (0, field_detection_1.detectValidationRules)(field.label || '', field.text || '').some(function (rule) { return rule.type === 'required'; }),
                            validation: (0, field_detection_1.detectValidationRules)(field.label || '', field.text || ''),
                            section: field.section,
                            ratingScale: (0, field_detection_1.detectRatingScale)(field.text || '')
                        }); });
                        sections = (0, form_structure_1.processFormStructure)(fields);
                        mergedSections = (0, form_structure_1.mergeSections)(sections);
                        isValid = (0, form_structure_1.validateFormStructure)(mergedSections);
                        return [2 /*return*/, {
                                success: true,
                                content: {
                                    text: fields.map(function (f) { return f.label; }).join(' '),
                                    fields: mergedSections
                                },
                                fields: mergedSections,
                                confidence: this.calculateConfidence(fields, isValid)
                            }];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Conversion error:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                content: null,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                                fields: [],
                                confidence: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LocalFormConverter.prototype.calculateConfidence = function (fields, isValid) {
        if (!isValid || fields.length === 0)
            return 0;
        var confidence = 0.5; // Base confidence
        // Add confidence based on field properties
        var validFields = fields.filter(function (f) {
            return f.type &&
                f.label &&
                f.validation &&
                f.validation.length > 0;
        });
        confidence += (validFields.length / fields.length) * 0.3;
        // Add confidence for non-default field types
        var nonDefaultTypes = fields.filter(function (f) { return f.type !== 'input'; }).length;
        confidence += (nonDefaultTypes / fields.length) * 0.2;
        return Math.min(confidence, 1);
    };
    LocalFormConverter.prototype.getContentType = function (filePath) {
        var _a;
        var ext = (_a = filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        switch (ext) {
            case 'pdf':
                return 'application/pdf';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            default:
                return 'application/octet-stream';
        }
    };
    LocalFormConverter.prototype.validateField = function (field) {
        return field &&
            typeof field === 'object' &&
            (field.label || field.text);
    };
    return LocalFormConverter;
}());
exports.LocalFormConverter = LocalFormConverter;
