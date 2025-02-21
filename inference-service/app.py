from fastapi import FastAPI, File, UploadFile, HTTPException
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
from pdf2image import convert_from_bytes
from PIL import Image
import numpy as np
from io import BytesIO
import uvicorn
import cv2
import pytesseract
import re
import subprocess
import tempfile
import os
from typing import List, Dict, Any, Tuple
import torch

app = FastAPI()

# Load the finetuned model and processor
try:
    processor = LayoutLMv3Processor.from_pretrained("nielsr/layoutlmv3-finetuned-funsd")
    model = LayoutLMv3ForTokenClassification.from_pretrained("nielsr/layoutlmv3-finetuned-funsd")
    print("Successfully loaded LayoutLMv3 model")
    USE_LAYOUTLM = True
except Exception as e:
    print(f"Failed to load LayoutLMv3 model: {e}")
    print("Falling back to Tesseract OCR only")
    USE_LAYOUTLM = False

# Set Tesseract path for Linux container
pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'

def preprocess_image(image: Image.Image) -> Image.Image:
    # Convert to numpy array
    img_array = np.array(image)
    
    # Convert to grayscale if needed
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array
        
    # Apply adaptive thresholding
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Detect and correct skew
    coords = np.column_stack(np.where(binary > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle
    
    # Rotate if needed
    if abs(angle) > 0.5:
        (h, w) = binary.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        binary = cv2.warpAffine(binary, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return Image.fromarray(binary)

def perform_ocr(image: Image.Image) -> Tuple[List[str], List[List[int]], List[float]]:
    """Perform OCR and return words, boxes, and confidence scores."""
    # Get OCR data from Tesseract
    ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    
    words = []
    boxes = []
    confidences = []
    
    width, height = image.size
    
    for i in range(len(ocr_data['text'])):
        # Skip empty text
        if not ocr_data['text'][i].strip():
            continue
            
        # Skip low confidence results
        if float(ocr_data['conf'][i]) < 30:
            continue
            
        words.append(ocr_data['text'][i])
        
        # Convert coordinates to normalized format (0-1000)
        x = ocr_data['left'][i]
        y = ocr_data['top'][i]
        w = ocr_data['width'][i]
        h = ocr_data['height'][i]
        
        # Normalize coordinates
        x_norm = int((x / width) * 1000)
        y_norm = int((y / height) * 1000)
        w_norm = int((w / width) * 1000)
        h_norm = int((h / height) * 1000)
        
        boxes.append([x_norm, y_norm, x_norm + w_norm, y_norm + h_norm])
        confidences.append(float(ocr_data['conf'][i]) / 100)
    
    return words, boxes, confidences

def process_with_layoutlm(image: Image.Image, words: List[str], boxes: List[List[int]]) -> List[Dict[str, Any]]:
    """Process the document using LayoutLMv3."""
    encoding = processor(
        image,
        words,
        boxes=boxes,
        return_tensors="pt",
        truncation=True,
        padding="max_length"
    )
    
    with torch.no_grad():
        outputs = model(**encoding)
    
    # Get predictions
    predictions = outputs.logits.argmax(-1).squeeze().tolist()
    if isinstance(predictions, int):
        predictions = [predictions]
    
    # Map label IDs to names
    id2label = model.config.id2label
    
    # Convert predictions to fields
    fields = []
    for word, box, pred in zip(words, boxes, predictions):
        label = id2label[pred]
        if label != "O":  # Skip tokens classified as "Outside"
            fields.append({
                "text": word,
                "type": label.split("-")[-1],  # Remove B- or I- prefix
                "confidence": float(outputs.logits.softmax(-1).max().item()),
                "bbox": {
                    "x": box[0],
                    "y": box[1],
                    "width": box[2] - box[0],
                    "height": box[3] - box[1]
                }
            })
    
    return fields

def process_with_tesseract(ocr_data: dict) -> List[Dict[str, Any]]:
    """Process the document using Tesseract OCR with heuristics."""
    fields = []
    n_boxes = len(ocr_data['text'])
    
    # Common patterns for form fields
    question_patterns = [
        r'^(what|who|when|where|why|how)',  # Question words
        r'\?$',  # Ends with question mark
        r':$',   # Ends with colon
        r'^[0-9]+\.',  # Numbered items
        r'please|specify|describe|explain|list'  # Common instruction words
    ]
    
    header_patterns = [
        r'^section|part \d+',  # Section headers
        r'[A-Z\s]{4,}',  # All caps text of 4+ chars
    ]
    
    # Group text boxes by their y-coordinate (same line)
    line_groups = {}
    for i in range(n_boxes):
        if not ocr_data['text'][i].strip():
            continue
            
        y_coord = ocr_data['top'][i]
        if y_coord not in line_groups:
            line_groups[y_coord] = []
        line_groups[y_coord].append({
            'text': ocr_data['text'][i],
            'conf': ocr_data['conf'][i],
            'bbox': {
                'x': ocr_data['left'][i],
                'y': ocr_data['top'][i],
                'width': ocr_data['width'][i],
                'height': ocr_data['height'][i]
            }
        })
    
    # Process each line
    for y_coord, line_items in sorted(line_groups.items()):
        line_text = ' '.join(item['text'] for item in line_items)
        
        # Determine field type
        field_type = 'other'
        confidence = sum(item['conf'] for item in line_items) / len(line_items)
        
        # Check for headers
        if any(re.search(pattern, line_text, re.IGNORECASE) for pattern in header_patterns):
            field_type = 'header'
        
        # Check for questions/labels
        elif any(re.search(pattern, line_text, re.IGNORECASE) for pattern in question_patterns):
            field_type = 'question'
            
            # Look for answer in the next line
            next_y = min((y for y in line_groups.keys() if y > y_coord), default=None)
            if next_y is not None:
                next_line_items = line_groups[next_y]
                next_line_text = ' '.join(item['text'] for item in next_line_items)
                
                # Add answer field if it doesn't look like another question
                if not any(re.search(pattern, next_line_text, re.IGNORECASE) for pattern in question_patterns):
                    fields.append({
                        'text': next_line_text,
                        'type': 'answer',
                        'confidence': sum(item['conf'] for item in next_line_items) / len(next_line_items),
                        'bbox': {
                            'x': min(item['bbox']['x'] for item in next_line_items),
                            'y': next_y,
                            'width': max(item['bbox']['x'] + item['bbox']['width'] for item in next_line_items) - 
                                   min(item['bbox']['x'] for item in next_line_items),
                            'height': max(item['bbox']['height'] for item in next_line_items)
                        }
                    })
        
        # Add the current field
        fields.append({
            'text': line_text,
            'type': field_type,
            'confidence': confidence,
            'bbox': {
                'x': min(item['bbox']['x'] for item in line_items),
                'y': y_coord,
                'width': max(item['bbox']['x'] + item['bbox']['width'] for item in line_items) - 
                       min(item['bbox']['x'] for item in line_items),
                'height': max(item['bbox']['height'] for item in line_items)
            }
        })
    
    return fields

def convert_excel_to_pdf(content: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_in:
        temp_in.write(content)
        temp_in_path = temp_in.name
    
    temp_out_path = temp_in_path.replace('.xlsx', '.pdf')
    
    try:
        # Convert Excel to PDF using LibreOffice
        cmd = ['soffice', '--headless', '--convert-to', 'pdf', '--outdir', 
               os.path.dirname(temp_out_path), temp_in_path]
        subprocess.run(cmd, check=True)
        
        # Read the PDF content
        with open(temp_out_path, 'rb') as f:
            pdf_content = f.read()
            
        return pdf_content
    finally:
        # Clean up temporary files
        os.unlink(temp_in_path)
        if os.path.exists(temp_out_path):
            os.unlink(temp_out_path)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read file content
        content = await file.read()
        
        # Handle Excel files
        if file.filename.lower().endswith(('.xlsx', '.xls')):
            try:
                content = convert_excel_to_pdf(content)
            except Exception as e:
                raise HTTPException(status_code=500, 
                                  detail=f"Failed to convert Excel to PDF: {str(e)}")
        
        # Convert to image
        try:
            pages = convert_from_bytes(content)
            image = pages[0]
        except Exception as e:
            try:
                image = Image.open(BytesIO(content)).convert("RGB")
            except Exception:
                raise HTTPException(status_code=400, 
                                  detail="Failed to convert file to image. Supported formats: PDF, Excel, or image files")
        
        # Preprocess image
        processed_image = preprocess_image(image)
        
        if USE_LAYOUTLM:
            try:
                # Perform OCR to get words and boxes
                words, boxes, confidences = perform_ocr(processed_image)
                
                # Process with LayoutLMv3
                fields = process_with_layoutlm(image, words, boxes)
                
                return {
                    "success": True,
                    "model": "layoutlmv3",
                    "fields": fields
                }
            except Exception as e:
                print(f"LayoutLMv3 processing failed: {e}")
                print("Falling back to Tesseract OCR")
        
        # Fallback to Tesseract
        ocr_data = pytesseract.image_to_data(processed_image, output_type=pytesseract.Output.DICT)
        fields = process_with_tesseract(ocr_data)
        
        return {
            "success": True,
            "model": "tesseract",
            "fields": fields
        }
        
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
