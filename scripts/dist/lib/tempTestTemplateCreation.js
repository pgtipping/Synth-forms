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
Object.defineProperty(exports, "__esModule", { value: true });
const file_watcher_1 = require("./file-watcher");
function testTemplateCreation() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Use the public test method instead of the private handleFileAdd
            yield file_watcher_1.fileWatcher.testHandleFileAdd('dummy.pdf');
            console.log('Template creation attempted successfully.');
        }
        catch (error) {
            console.error('Error in template creation:', error);
        }
    });
}
// Execute the test
testTemplateCreation().then(() => process.exit());
