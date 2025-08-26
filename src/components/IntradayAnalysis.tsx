import React, { useRef, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, Download } from 'lucide-react';

interface IntradayAnalysisProps {
  data: any;
  darkMode: boolean;
}

const IntradayAnalysis: React.FC<IntradayAnalysisProps> = ({ data, darkMode }) => {
  const priceChartRef = useRef<HTMLCanvasElement>(null);
  const volumeChartRef = useRef<HTMLCanvasElement>(null);
  const factorChartRef = useRef<HTMLCanvasElement>(null);
  const factorRatioChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data) return;
    
    drawChart(priceChartRef.current, data.data, 'price', darkMode);
    drawChart(volumeChartRef.current, data.data, 'volume', darkMode);
    drawChart(factorChartRef.current, data.data, 'factor', darkMode);
    drawChart(factorRatioChartRef.current, data.data, 'factorRatio', darkMode);
  }, [data, darkMode]);

  const drawChart = (canvas: HTMLCanvasElement | null, chartData: any[], type: string, dark: boolean) => {
    if (!canvas || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 60;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = dark ? '#1f2937' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Get data values
    let values: number[];
    let maValues: number[];
    let color: string;
    let maColor: string;
    let yAxisLabel: string;

    switch (type) {
      case 'price':
        values = chartData.map(d => d.price);
        maValues = chartData.map(d => d.priceMA);
        color = '#3b82f6';
        maColor = '#f59e0b';
        yAxisLabel = 'Price ($)';
        break;
      case 'volume':
        values = chartData.map(d => d.volume);
        maValues = chartData.map(d => d.volumeMA);
        color = '#10b981';
        maColor = '#ef4444';
        yAxisLabel = 'Volume';
        break;
      case 'factor':
        values = chartData.map(d => d.factor);
        maValues = [];
        color = '#8b5cf6';
        maColor = '';
        yAxisLabel = 'Factor (Price × Volume)';
        break;
      case 'factorRatio':
        values = chartData.map(d => d.factorRatio);
        maValues = [];
        color = '#f59e0b';
        maColor = '';
        yAxisLabel = 'Factor Ratio';
        break;
      default:
        return;
    }

    const minValue = Math.min(...values, ...(maValues.length ? maValues : values));
    const maxValue = Math.max(...values, ...(maValues.length ? maValues : values));
    const valueRange = maxValue - minValue;

    // Draw main line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - minValue) / valueRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw MA line if available
    if (maValues.length) {
      ctx.strokeStyle = maColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      maValues.forEach((value, index) => {
        const x = padding + (index / (maValues.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((value - minValue) / valueRange) * (height - 2 * padding);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw axes
    ctx.strokeStyle = dark ? '#6b7280' : '#d1d5db';
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

    // Add reference line for factor ratio
    if (type === 'factorRatio') {
      const referenceY = height - padding - ((1 - minValue) / valueRange) * (height - 2 * padding);
      ctx.strokeStyle = dark ? '#6b7280' : '#9ca3af';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding, referenceY);
      ctx.lineTo(width - padding, referenceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Add "1.0" label for reference line
      ctx.fillStyle = dark ? '#9ca3af' : '#6b7280';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('1.0', padding + 5, referenceY - 5);
    }
    
    // Draw Y-axis labels and values
    ctx.fillStyle = dark ? '#d1d5db' : '#6b7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    // Y-axis values
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange / 5) * i;
      const y = height - padding - (i / 5) * (height - 2 * padding);
      
      let labelText: string;
      if (type === 'price') {
        labelText = `$${value.toFixed(2)}`;
      } else if (type === 'volume') {
        labelText = value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000).toFixed(0)}K`;
      } else if (type === 'factor') {
        labelText = value >= 1000000000 ? `${(value / 1000000000).toFixed(1)}B` : 
                   value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
                   `${(value / 1000).toFixed(0)}K`;
      } else {
        labelText = value.toFixed(3);
      }
      
      ctx.fillText(labelText, padding - 5, y + 4);
    }
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
    
    // X-axis labels (time)
    ctx.textAlign = 'center';
    ctx.font = '10px Inter, sans-serif';
    
    // Show time labels at regular intervals
    const timeInterval = Math.max(1, Math.floor(chartData.length / 6)); // Show ~6 time labels
    for (let i = 0; i < chartData.length; i += timeInterval) {
      const timestamp = new Date(chartData[i].timestamp);
      const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
      const timeLabel = timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      ctx.fillText(timeLabel, x, height - padding + 15);
    }
    
    // X-axis label
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('Time', width / 2, height - 10);
  };

  const downloadCSV = () => {
    if (!data) return;
    
    const headers = [
      'Timestamp', 'Price', 'Volume', 'Price_MA', 'Volume_MA',
      'Price_Trend', 'Volume_Trend', 'Combination', 'Behavior',
      'Factor', 'Factor_Ratio'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.data.map((row: any) => [
        new Date(row.timestamp).toLocaleString(),
        row.price.toFixed(2),
        row.volume,
        row.priceMA.toFixed(2),
        row.volumeMA.toFixed(0),
        row.priceTrend,
        row.volumeTrend,
        `"${row.combination}"`,
        `"${row.behavior}"`,
        row.factor.toFixed(0),
        row.factorRatio.toFixed(4)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.symbol}_intraday_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) return null;

  const currentData = data.data[data.data.length - 1];
  const previousData = data.data[data.data.length - 2];
  const priceChange = currentData.price - previousData.price;
  const priceChangePercent = (priceChange / previousData.price) * 100;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold">${currentData.price.toFixed(2)}</div>
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </div>
          <div className="text-xs text-gray-500">Current Price</div>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold">{currentData.volume.toLocaleString()}</div>
          <div className="text-sm text-blue-600">
            vs MA: {((currentData.volume / currentData.volumeMA - 1) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Current Volume</div>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="text-lg font-bold">{currentData.behavior}</div>
          <div className="text-sm text-gray-600">{currentData.combination}</div>
          <div className="text-xs text-gray-500">Market Behavior</div>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="text-2xl font-bold">{currentData.factorRatio.toFixed(3)}</div>
          <div className={`text-sm ${currentData.factorRatio > 1 ? 'text-green-600' : 'text-red-600'}`}>
            {((currentData.factorRatio - 1) * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">Factor Ratio</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Price vs Moving Average
          </h4>
          <canvas ref={priceChartRef} className="w-full h-64" />
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
            Volume vs Moving Average
          </h4>
          <canvas ref={volumeChartRef} className="w-full h-64" />
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-purple-600" />
            Factor (Price × Volume)
          </h4>
          <canvas ref={factorChartRef} className="w-full h-64" />
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-orange-600" />
            Factor Ratio
          </h4>
          <canvas ref={factorRatioChartRef} className="w-full h-64" />
        </div>
      </div>

      {/* Frequency Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-lg font-semibold mb-4">Price-Volume Combinations</h4>
          <div className="space-y-2">
            {Object.entries(data.summary.combinationCounts)
              .filter(([combo, count]) => count > 0)
              .map(([combo, count]) => (
              <div key={combo} className="flex items-center justify-between">
                <span className="text-sm">{combo}</span>
                <div className="flex items-center">
                  <div className={`w-20 h-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(count as number / data.summary.totalDataPoints) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h4 className="text-lg font-semibold mb-4">Market Behaviors</h4>
          <div className="space-y-2">
            {Object.entries(data.summary.behaviorCounts)
              .filter(([behavior, count]) => count > 0)
              .map(([behavior, count]) => {
              const colors: Record<string, string> = {
                'Buying Pressure': 'bg-green-600',
                'Selling Pressure': 'bg-red-600',
                'Mild Buying': 'bg-green-400',
                'Mild Selling': 'bg-red-400',
                'Stable Market': 'bg-gray-600',
                'Volume Spike': 'bg-yellow-600',
                'Low Activity': 'bg-gray-400',
                'Cautious Buying': 'bg-green-500',
                'Cautious Selling': 'bg-red-500',
                'Unknown': 'bg-gray-500'
              };
              
              return (
                <div key={behavior} className="flex items-center justify-between">
                  <span className="text-sm">{behavior}</span>
                  <div className="flex items-center">
                    <div className={`w-20 h-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-full rounded-full ${colors[behavior] || 'bg-blue-600'}`}
                        style={{ width: `${(count as number / data.summary.totalDataPoints) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-8">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Detailed Analysis Table</h4>
          <button
            onClick={downloadCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="text-left p-2 border-b">Time</th>
                <th className="text-right p-2 border-b">Price</th>
                <th className="text-right p-2 border-b">Volume</th>
                <th className="text-center p-2 border-b">Price Trend</th>
                <th className="text-center p-2 border-b">Volume Trend</th>
                <th className="text-left p-2 border-b">Behavior</th>
                <th className="text-right p-2 border-b">Factor</th>
                <th className="text-right p-2 border-b">Factor Ratio</th>
              </tr>
            </thead>
            <tbody>
              {data.data.slice(-20).map((row: any, index: number) => (
                <tr key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="p-2 font-mono text-xs">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2 text-right font-mono">${row.price.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">{row.volume.toLocaleString()}</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.priceTrend === 'Increase' ? 'bg-green-100 text-green-800' :
                      row.priceTrend === 'Decrease' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.priceTrend}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.volumeTrend === 'Increase' ? 'bg-green-100 text-green-800' :
                      row.volumeTrend === 'Decrease' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.volumeTrend}
                    </span>
                  </td>
                  <td className="p-2 text-sm">{row.behavior}</td>
                  <td className="p-2 text-right font-mono">{row.factor.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{row.factorRatio.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Insights */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h4 className="text-lg font-semibold mb-4">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.totalDataPoints}
            </div>
            <div className="text-sm text-gray-500">Total Data Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.summary.mostCommonBehavior}
            </div>
            <div className="text-sm text-gray-500">Dominant Behavior</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.interval}m
            </div>
            <div className="text-sm text-gray-500">Analysis Interval</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntradayAnalysis;