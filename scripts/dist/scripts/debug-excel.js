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
const xlsx_1 = __importDefault(require("xlsx"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = 'c:/Users/pgeor/OneDrive/Documents/Work/Documents/HR and Business Consulting/Project DIG inputs/Forms and templates/Free Templates and Forms/Competency Assessment/Job Competency Assessment Template_download.xlsx';
        console.log('Reading Excel file...');
        const workbook = xlsx_1.default.readFile(filePath);
        console.log('\nSheet Names:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx_1.default.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('\nFirst 10 rows:');
        data.slice(0, 10).forEach((row, i) => {
            console.log(`Row ${i}:`, row);
        });
    });
}
main().catch(console.error);
