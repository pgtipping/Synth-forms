import { formConversionService } from '../lib/form-conversion';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '../lib/prisma';
import { PrismaClient } from '@prisma/client';

// Mock Azure Form Recognizer client
jest.mock('@azure/ai-form-recognizer', () => ({
  AzureKeyCredential: jest.fn(),
  DocumentAnalysisClient: jest.fn().mockImplementation(() => ({
    beginAnalyzeDocument: jest.fn().mockImplementation(() => ({
      pollUntilDone: jest.fn().mockResolvedValue({
        keyValuePairs: [
          {
            key: { content: 'name' },
            value: { content: 'John Doe' }
          },
          {
            key: { content: 'email' },
            value: { content: 'john@example.com' }
          }
        ]
      })
    }))
  }))
}));

// Mock Prisma client
const mockFormConversion = {
  update: jest.fn(),
  create: jest.fn(),
  findUnique: jest.fn()
};

const prismaMock = {
  formConversion: mockFormConversion
} as unknown as typeof prisma;

jest.mock('../lib/prisma', () => ({
  prisma: prismaMock
}));

describe('Form Conversion Service', () => {
  const mockUpdateProgress = mockFormConversion.update;

  beforeEach(() => {
    mockUpdateProgress.mockClear();
  });

  describe('PDF Conversion', () => {
    it('should convert PDF to form fields', async () => {
      // Load test PDF file
      const buffer = await readFile(join(__dirname, 'fixtures', 'test-form.pdf'));
      
      const result = await formConversionService.convertPDF(buffer);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        sections: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            fields: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                type: expect.any(String),
                label: expect.any(String)
              })
            ])
          })
        ]),
        metadata: expect.objectContaining({
          originalFormat: 'pdf',
          conversionDate: expect.any(Date),
          version: expect.any(Number)
        })
      });
    });

    it('should handle empty PDF files', async () => {
      const buffer = Buffer.from('');
      
      await expect(formConversionService.convertPDF(buffer))
        .rejects
        .toThrow();
    });
  });

  describe('DOCX Conversion', () => {
    it('should convert DOCX to form fields', async () => {
      const buffer = await readFile(join(__dirname, 'fixtures', 'test-form.docx'));
      
      const result = await formConversionService.convertDOCX(buffer);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        sections: expect.arrayContaining([
          expect.objectContaining({
            fields: expect.any(Array)
          })
        ])
      });
    });
  });

  describe('Excel Conversion', () => {
    it('should convert Excel to form fields', async () => {
      const buffer = await readFile(join(__dirname, 'fixtures', 'test-form.xlsx'));
      
      const result = await formConversionService.convertExcel(buffer);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        sections: expect.arrayContaining([
          expect.objectContaining({
            fields: expect.any(Array)
          })
        ])
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should update progress during conversion', async () => {
      const buffer = await readFile(join(__dirname, 'fixtures', 'test-form.pdf'));
      const formId = 'test-form-id';
      
      await formConversionService.convertForm(buffer, 'pdf', formId);
      
      expect(mockUpdateProgress).toHaveBeenCalledWith({
        where: { id: formId },
        data: expect.objectContaining({
          status: expect.any(String),
          progress: expect.any(Number)
        })
      });
    });

    it('should handle conversion failures', async () => {
      const buffer = Buffer.from('invalid data');
      const formId = 'test-form-id';
      
      await expect(formConversionService.convertForm(buffer, 'pdf', formId))
        .rejects
        .toThrow();
      
      expect(mockUpdateProgress).toHaveBeenCalledWith({
        where: { id: formId },
        data: expect.objectContaining({
          status: 'failed',
          error: expect.any(String)
        })
      });
    });
  });
});
