"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateDeduplicate = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("./prisma");
const conversion_rules_1 = __importDefault(require("../config/conversion-rules"));
class TemplateDeduplicate {
    calculateFileHash(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield fs_1.promises.readFile(filePath);
            const hash = crypto_1.default.createHash('sha256');
            hash.update(buffer);
            return hash.digest('hex');
        });
    }
    getFileInfo(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = yield fs_1.promises.stat(filePath);
            const hash = yield this.calculateFileHash(filePath);
            return {
                path: filePath,
                hash,
                size: stats.size,
                lastModified: stats.mtime
            };
        });
    }
    isExcluded(filePath) {
        return conversion_rules_1.default.excludePatterns.some(pattern => filePath.toLowerCase().includes(pattern.toLowerCase()));
    }
    findDuplicates(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const duplicateGroups = new Map();
            function walkDirectory(dir) {
                return __asyncGenerator(this, arguments, function* walkDirectory_1() {
                    const files = yield __await(fs_1.promises.readdir(dir, { withFileTypes: true }));
                    for (const file of files) {
                        const fullPath = path_1.default.join(dir, file.name);
                        if (file.isDirectory()) {
                            yield __await(yield* __asyncDelegator(__asyncValues(walkDirectory(fullPath))));
                        }
                        else {
                            yield yield __await(fullPath);
                        }
                    }
                });
            }
            try {
                // Walk through directory and collect file info
                for (var _d = true, _e = __asyncValues(walkDirectory(directory)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const filePath = _c;
                    if (this.isExcluded(filePath))
                        continue;
                    const fileInfo = yield this.getFileInfo(filePath);
                    const existingGroup = duplicateGroups.get(fileInfo.hash) || [];
                    duplicateGroups.set(fileInfo.hash, [...existingGroup, fileInfo]);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Filter out unique files and format results
            return Array.from(duplicateGroups.entries())
                .filter(([_, files]) => files.length > 1)
                .map(([hash, files]) => ({ hash, files }));
        });
    }
    cleanupDuplicates(duplicates) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleanupDir = path_1.default.join(process.cwd(), 'duplicates_backup');
            yield fs_1.promises.mkdir(cleanupDir, { recursive: true });
            for (const group of duplicates) {
                // Sort files by last modified date, keeping the newest
                const sortedFiles = group.files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
                // Keep the newest file, move others to backup
                const [keep, ...toMove] = sortedFiles;
                for (const file of toMove) {
                    const backupPath = path_1.default.join(cleanupDir, path_1.default.basename(file.path));
                    // Move to backup directory
                    yield fs_1.promises.rename(file.path, backupPath);
                    // Log the operation in the database
                    yield prisma_1.prisma.auditLog.create({
                        data: {
                            action: 'TEMPLATE_UPDATE',
                            entityType: 'TEMPLATE',
                            entityId: path_1.default.basename(file.path),
                            metadata: {
                                originalPath: file.path,
                                backupPath: backupPath,
                                operation: 'duplicate_cleanup'
                            }
                        }
                    });
                }
            }
        });
    }
    generateReport(duplicates) {
        return __awaiter(this, void 0, void 0, function* () {
            let report = '# Template Duplication Report\n\n';
            report += `Generated: ${new Date().toISOString()}\n\n`;
            for (const group of duplicates) {
                report += `## Duplicate Group (Hash: ${group.hash.slice(0, 8)})\n\n`;
                for (const file of group.files) {
                    report += `- ${file.path}\n`;
                    report += `  Size: ${(file.size / 1024).toFixed(2)}KB\n`;
                    report += `  Last Modified: ${file.lastModified.toISOString()}\n\n`;
                }
                report += '\n';
            }
            return report;
        });
    }
}
exports.TemplateDeduplicate = TemplateDeduplicate;
