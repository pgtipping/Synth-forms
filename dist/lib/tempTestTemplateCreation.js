import { fileWatcher } from './file-watcher';
async function testTemplateCreation() {
    try {
        // Use the public test method instead of the private handleFileAdd
        await fileWatcher.testHandleFileAdd('dummy.pdf');
        console.log('Template creation attempted successfully.');
    }
    catch (error) {
        console.error('Error in template creation:', error);
    }
}
// Execute the test
testTemplateCreation().then(() => process.exit());
