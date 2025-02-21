# Use conda-forge base image which includes scientific packages
FROM condaforge/miniforge3:latest

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/New_York
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    poppler-utils \
    libreoffice \
    locales \
    tzdata \
    tesseract-ocr \
    tesseract-ocr-eng \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

# Create and activate conda environment
RUN conda create -n app python=3.11 -y
SHELL ["conda", "run", "-n", "app", "/bin/bash", "-c"]

# Set working directory
WORKDIR /app

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir \
    torch==2.1.1 \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    transformers==4.35.2 \
    pdf2image==1.16.3 \
    python-multipart==0.0.6 \
    Pillow==10.1.0 \
    opencv-python-headless==4.8.1.78 \
    pytesseract==0.3.10 \
    pytest==7.4.3 \
    httpx==0.25.2 \
    numpy==1.24.3

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start the FastAPI application
CMD ["conda", "run", "--no-capture-output", "-n", "app", "python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
