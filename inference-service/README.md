# Form Template Conversion Service

This service provides form field extraction capabilities using a hybrid approach:
1. Primary: LayoutLMv3, a state-of-the-art document understanding model fine-tuned on the FUNSD dataset
2. Fallback: Tesseract OCR with smart heuristics for field type detection

## Features

- Support for multiple document formats (PDF, DOCX, XLSX, JPG, PNG)
- Automatic OCR and document conversion
- Smart field type detection (questions, answers, headers)
- Fallback processing if LayoutLMv3 is unavailable
- REST API endpoint for easy integration

## Setup

1. Install system dependencies:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y tesseract-ocr poppler-utils
   
   # Windows
   # Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
   # Add Tesseract to PATH
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the inference service:
   ```bash
   python app.py
   ```

The service will run on `http://localhost:8000` by default.

## API Usage

### POST /predict

Upload a document for form field extraction:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/document.pdf"
```

Response format:
```json
{
  "success": true,
  "model": "layoutlmv3",  // or "tesseract" if using fallback
  "fields": [
    {
      "text": "field_text",
      "type": "question|answer|header|other",
      "confidence": 0.95,
      "bbox": {
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 50
      }
    }
  ]
}
```

## Testing

Run the test suite:
```bash
pytest test_app.py
```

## Model Details

This service uses two approaches for form field extraction:

1. **LayoutLMv3 (Primary)**
   - Pre-trained model fine-tuned on FUNSD dataset
   - Combines layout information with text content
   - Better at understanding form structure
   - More accurate field type detection

2. **Tesseract OCR (Fallback)**
   - Uses pattern matching for field type detection
   - Looks for question patterns, headers, etc.
   - Groups text by line position
   - Less accurate but more reliable fallback

The service automatically falls back to Tesseract if:
- LayoutLMv3 model fails to load
- Processing with LayoutLMv3 fails
- Memory constraints prevent model loading
