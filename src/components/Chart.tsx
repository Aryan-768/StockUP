import React, { useEffect, useRef } from 'react';
import { StockData, ForecastModel, Anomaly } from '../types';

interface ChartProps {
  stockData: StockData;
  forecasts: ForecastModel[];
  anomalies: Anomaly[];
  darkMode: boolean;
}

const Chart: React.FC<ChartProps> = ({ stockData, forecasts, anomalies, darkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !stockData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 60;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = darkMode ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (stockData.prices.length === 0) return;

    // Calculate price range
    const prices = stockData.prices.map(p => p.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw price line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    stockData.prices.forEach((price, index) => {
      const x = padding + (index / (stockData.prices.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((price.close - minPrice) / priceRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw volume bars
    const maxVolume = Math.max(...stockData.prices.map(p => p.volume));
    ctx.fillStyle = darkMode ? '#4b5563' : '#e5e7eb';
    ctx.globalAlpha = 0.3;

    stockData.prices.forEach((price, index) => {
      const x = padding + (index / (stockData.prices.length - 1)) * (width - 2 * padding);
      const barHeight = (price.volume / maxVolume) * 30;
      ctx.fillRect(x - 1, height - padding, 2, -barHeight);
    });

    ctx.globalAlpha = 1;

    // Draw forecast lines
    forecasts.forEach((forecast, forecastIndex) => {
      const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      ctx.strokeStyle = colors[forecastIndex % colors.length];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      // Connect last historical point to first forecast point
      if (stockData.prices.length > 0) {
        const lastHistorical = stockData.prices[stockData.prices.length - 1];
        const firstForecast = forecast.predictions[0];
        
        const x1 = padding + (width - 2 * padding);
        const y1 = height - padding - ((lastHistorical.close - minPrice) / priceRange) * (height - 2 * padding);
        
        const x2 = padding + (width - 2 * padding) + 20;
        const y2 = height - padding - ((firstForecast.value - minPrice) / priceRange) * (height - 2 * padding);
        
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }

      // Draw forecast line
      forecast.predictions.forEach((pred, index) => {
        const x = padding + (width - 2 * padding) + 20 + (index / (forecast.predictions.length - 1)) * 100;
        const y = height - padding - ((pred.value - minPrice) / priceRange) * (height - 2 * padding);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });

    ctx.setLineDash([]);

    // Draw anomalies
    anomalies.forEach(anomaly => {
      const anomalyDate = new Date(anomaly.date);
      const priceIndex = stockData.prices.findIndex(p => 
        new Date(p.date).toDateString() === anomalyDate.toDateString()
      );
      
      if (priceIndex !== -1) {
        const x = padding + (priceIndex / (stockData.prices.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((anomaly.value - minPrice) / priceRange) * (height - 2 * padding);
        
        ctx.fillStyle = anomaly.severity === 'high' ? '#ef4444' : 
                        anomaly.severity === 'medium' ? '#f59e0b' : '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw axes
    ctx.strokeStyle = darkMode ? '#6b7280' : '#d1d5db';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = darkMode ? '#d1d5db' : '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // Price labels
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * i;
      const y = height - padding - (i / 5) * (height - 2 * padding);
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toFixed(2)}`, padding - 10, y + 4);
    }

    // Date labels
    ctx.textAlign = 'center';
    const dateInterval = Math.floor(stockData.prices.length / 5);
    for (let i = 0; i < stockData.prices.length; i += dateInterval) {
      const date = new Date(stockData.prices[i].date);
      const x = padding + (i / (stockData.prices.length - 1)) * (width - 2 * padding);
      ctx.fillText(date.toLocaleDateString(), x, height - padding + 20);
    }

  }, [stockData, forecasts, anomalies, darkMode]);

  return (
    <div className={`p-6 rounded-lg shadow-sm ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Price Chart & Forecasts</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
            <span>Historical Price</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
            <span>Forecast</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
            <span>Anomaly</span>
          </div>
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-96 rounded-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};

export default Chart;