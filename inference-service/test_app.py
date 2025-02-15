import pytest
from fastapi.testclient import TestClient
from PIL import Image
import io
import numpy as np
from app import app, process_with_tesseract, perform_ocr

client = TestClient(app)

def create_test_image(text="Test Form", size=(800, 600)):
    """Create a test image with text for testing."""
    image = Image.new('RGB', size, color='white')
    # You would add text here using PIL's ImageDraw
    # For now, just return the blank image
    return image

def test_perform_ocr():
    """Test OCR functionality."""
    image = create_test_image()
    words, boxes, confidences = perform_ocr(image)
    
    assert isinstance(words, list)
    assert isinstance(boxes, list)
    assert isinstance(confidences, list)
    assert len(words) == len(boxes) == len(confidences)

def test_process_with_tesseract():
    """Test Tesseract processing."""
    # Mock OCR data
    ocr_data = {
        'text': ['Question 1:', 'Answer here', 'HEADER'],
        'conf': [90, 85, 95],
        'left': [10, 20, 30],
        'top': [10, 50, 100],
        'width': [100, 100, 100],
        'height': [30, 30, 30]
    }
    
    fields = process_with_tesseract(ocr_data)
    
    assert isinstance(fields, list)
    assert len(fields) > 0
    assert all(isinstance(f, dict) for f in fields)
    assert all('text' in f and 'type' in f and 'confidence' in f and 'bbox' in f for f in fields)

def test_predict_endpoint():
    """Test the predict endpoint."""
    # Create a test image
    image = create_test_image()
    
    # Convert image to bytes
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    # Create test file
    files = {
        'file': ('test.png', img_byte_arr, 'image/png')
    }
    
    response = client.post("/predict", files=files)
    
    assert response.status_code == 200
    assert "success" in response.json()
    assert "fields" in response.json()
    assert isinstance(response.json()["fields"], list)

def test_predict_endpoint_invalid_file():
    """Test the predict endpoint with invalid file."""
    # Send invalid file
    files = {
        'file': ('test.txt', b'not an image', 'text/plain')
    }
    
    response = client.post("/predict", files=files)
    
    assert response.status_code == 500  # Should fail gracefully

def test_predict_endpoint_no_file():
    """Test the predict endpoint with no file."""
    response = client.post("/predict")
    
    assert response.status_code == 422  # FastAPI validation error
