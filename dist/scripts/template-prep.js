import fs from 'fs/promises';
import path from 'path';
import { detectPDFWatermark } from '../lib/pdf-watermark';
import config from '../config/conversion-rules';
async function* walkFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkFiles(entryPath);
        }
        else if (entry.isFile()) {
            yield entryPath;
        }
    }
}
async function main() {
    console.log('Starting template preparation...');
    for (const dir of config.directories) {
        console.log(`Processing directory: ${dir}`);
        for await (const filePath of walkFiles(dir)) {
            if (config.excludePatterns.some((p) => filePath.includes(p))) {
                continue;
            }
            const ext = path.extname(filePath).toLowerCase();
            let isWatermarked = false;
            if (ext === '.pdf') {
                isWatermarked = await detectPDFWatermark(filePath);
            }
            if (isWatermarked) {
                console.log(`Removing watermarked file: ${filePath}`);
                await fs.unlink(filePath);
            }
        }
    }
    console.log('Template preparation complete!');
}
main().catch(console.error);
