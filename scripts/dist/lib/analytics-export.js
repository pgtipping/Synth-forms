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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAnalytics = exportAnalytics;
exports.generateAnalyticsReport = generateAnalyticsReport;
const prisma_1 = require("./prisma");
const date_fns_1 = require("date-fns");
const xlsx_1 = __importDefault(require("xlsx"));
function exportAnalytics(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {};
        if (options.includeTemplateStats) {
            // Fetch template statistics
            const templates = yield prisma_1.prisma.template.findMany({
                include: {
                    category: true,
                    createdBy: true
                },
                where: {
                    createdAt: {
                        gte: options.startDate,
                        lte: options.endDate
                    }
                }
            });
            data.templates = templates.map(template => {
                var _a, _b;
                return ({
                    id: template.id,
                    title: template.title,
                    category: ((_a = template.category) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
                    createdBy: ((_b = template.createdBy) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                    createdAt: (0, date_fns_1.format)(template.createdAt, 'yyyy-MM-dd HH:mm:ss'),
                    fileType: template.fileType,
                    size: template.size,
                    version: template.version
                });
            });
        }
        if (options.includeUsageStats) {
            // Fetch form responses
            const responses = yield prisma_1.prisma.formResponse.findMany({
                include: {
                    template: {
                        select: {
                            title: true
                        }
                    },
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
                where: {
                    createdAt: {
                        gte: options.startDate,
                        lte: options.endDate
                    }
                }
            });
            data.responses = responses.map(response => ({
                id: response.id,
                templateName: response.template.title,
                userName: response.user.name,
                userEmail: response.user.email,
                createdAt: (0, date_fns_1.format)(response.createdAt, 'yyyy-MM-dd HH:mm:ss'),
                status: response.status
            }));
            // Calculate daily statistics
            const dailyStats = yield prisma_1.prisma.formResponse.groupBy({
                by: ['createdAt'],
                _count: true,
                where: {
                    createdAt: {
                        gte: options.startDate,
                        lte: options.endDate
                    }
                }
            });
            data.dailyStats = dailyStats.map(stat => ({
                date: (0, date_fns_1.format)(stat.createdAt, 'yyyy-MM-dd'),
                responseCount: stat._count
            }));
        }
        // Format the data based on the requested format
        switch (options.format) {
            case 'xlsx': {
                const workbook = xlsx_1.default.utils.book_new();
                if (data.templates) {
                    const templateSheet = xlsx_1.default.utils.json_to_sheet(data.templates);
                    xlsx_1.default.utils.book_append_sheet(workbook, templateSheet, 'Templates');
                }
                if (data.responses) {
                    const responseSheet = xlsx_1.default.utils.json_to_sheet(data.responses);
                    xlsx_1.default.utils.book_append_sheet(workbook, responseSheet, 'Form Responses');
                    const statsSheet = xlsx_1.default.utils.json_to_sheet(data.dailyStats);
                    xlsx_1.default.utils.book_append_sheet(workbook, statsSheet, 'Daily Statistics');
                }
                return xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            }
            case 'csv': {
                // Convert the first available data to CSV
                const csvData = data.templates || data.responses || data.dailyStats;
                if (!csvData)
                    throw new Error('No data to export');
                const sheet = xlsx_1.default.utils.json_to_sheet(csvData);
                const csv = xlsx_1.default.utils.sheet_to_csv(sheet);
                return Buffer.from(csv);
            }
            case 'json':
            default:
                return Buffer.from(JSON.stringify(data, null, 2));
        }
    });
}
function generateAnalyticsReport(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get templates with metadata
        const templates = yield prisma_1.prisma.template.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                category: true,
                createdBy: true
            }
        });
        // Get users
        const users = yield prisma_1.prisma.user.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        // Calculate template statistics
        const templatesByType = templates.reduce((acc, template) => {
            const fileType = template.fileType || 'unknown';
            acc[fileType] = (acc[fileType] || 0) + 1;
            return acc;
        }, {});
        const totalSize = templates.reduce((sum, template) => sum + (template.size || 0), 0);
        const averageSize = templates.length > 0 ? totalSize / templates.length : 0;
        return {
            templates: templates.map(template => {
                var _a, _b;
                return ({
                    id: template.id,
                    title: template.title,
                    category: ((_a = template.category) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
                    createdBy: ((_b = template.createdBy) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                    createdAt: template.createdAt.toISOString(),
                    fileType: template.fileType,
                    size: template.size,
                    version: template.version
                });
            }),
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt.toISOString()
            })),
            summary: {
                totalTemplates: templates.length,
                totalUsers: users.length,
                averageTemplateSize: averageSize,
                templatesByType: Object.entries(templatesByType).map(([fileType, count]) => ({
                    fileType,
                    count
                }))
            }
        };
    });
}
