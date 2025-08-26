# Setup Instructions for Streamlit Stock Market Analyzer

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Internet connection for data fetching

## Step-by-Step Setup

### 1. Create Project Directory
```bash
mkdir streamlit-stock-analyzer
cd streamlit-stock-analyzer
```

### 2. Create Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Save the Application Files
Save the following files in your project directory:
- `streamlit_app.py` (main application)
- `requirements.txt` (dependencies)
- `README.md` (documentation)

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Run the Application
```bash
streamlit run streamlit_app.py
```

The application will automatically open in your default web browser at `http://localhost:8501`

## Alternative Installation Methods

### Using conda
```bash
# Create conda environment
conda create -n stock-analyzer python=3.9
conda activate stock-analyzer

# Install packages
conda install streamlit pandas numpy
pip install yfinance plotly
```

### Using Docker (Optional)
Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

Build and run:
```bash
docker build -t stock-analyzer .
docker run -p 8501:8501 stock-analyzer
```

## Deployment Options

### 1. Streamlit Cloud (Free)
1. Push your code to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub repository
4. Deploy with one click

### 2. Heroku
Create `Procfile`:
```
web: sh setup.sh && streamlit run streamlit_app.py
```

Create `setup.sh`:
```bash
mkdir -p ~/.streamlit/
echo "\
[server]\n\
port = $PORT\n\
enableCORS = false\n\
headless = true\n\
\n\
" > ~/.streamlit/config.toml
```

### 3. Local Network Access
To access from other devices on your network:
```bash
streamlit run streamlit_app.py --server.address 0.0.0.0
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found Error
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2. yfinance Data Issues
- Check internet connection
- Verify stock symbol format
- Ensure market is open for intraday data

#### 3. Plotly Display Issues
```bash
pip install --upgrade plotly
```

#### 4. Streamlit Port Already in Use
```bash
streamlit run streamlit_app.py --server.port 8502
```

### Performance Optimization

#### 1. Enable Caching
The app already uses Streamlit's caching for better performance.

#### 2. Reduce Data Points
For slower connections, consider reducing the time range or increasing the interval.

#### 3. Memory Management
For long-running sessions, restart the app periodically.

## Configuration Options

### Streamlit Configuration
Create `.streamlit/config.toml`:
```toml
[theme]
primaryColor = "#1f77b4"
backgroundColor = "#ffffff"
secondaryBackgroundColor = "#f0f2f6"
textColor = "#262730"

[server]
maxUploadSize = 200
enableCORS = false
```

### Environment Variables
Create `.env` file for sensitive configurations:
```
YAHOO_FINANCE_TIMEOUT=30
DEFAULT_SYMBOL=AAPL
DEFAULT_INTERVAL=5
```

## Development Setup

### For Development
```bash
# Install development dependencies
pip install streamlit pandas numpy yfinance plotly jupyter black flake8

# Run with auto-reload
streamlit run streamlit_app.py --server.runOnSave true
```

### Code Formatting
```bash
black streamlit_app.py
flake8 streamlit_app.py
```

## Security Considerations

1. **API Limits**: yfinance has rate limits; avoid excessive requests
2. **Data Privacy**: No personal data is stored by the application
3. **Network Security**: Use HTTPS in production deployments
4. **Input Validation**: The app validates stock symbols and parameters

## Support and Updates

### Getting Help
1. Check the Streamlit documentation: [docs.streamlit.io](https://docs.streamlit.io)
2. yfinance documentation: [pypi.org/project/yfinance](https://pypi.org/project/yfinance/)
3. Plotly documentation: [plotly.com/python](https://plotly.com/python/)

### Updating the Application
```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Pull latest code changes
git pull origin main
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License and Disclaimer

This application is for educational purposes. Always verify data accuracy and consult financial professionals for investment decisions. The developers are not responsible for any financial losses incurred from using this application.