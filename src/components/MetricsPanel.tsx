import React from 'react';
import { ForecastModel, StockData } from '../types';
import { BarChart3, TrendingUp, Activity, Calculator } from 'lucide-react';

interface MetricsPanelProps {
  forecasts: ForecastModel[];
  stockData: StockData;
  darkMode: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ forecasts, stockData, darkMode }) => {
  const calculateVolatility = () => {
    if (stockData.prices.length < 2) return 0;
    
    const returns = stockData.prices.slice(1).map((price, index) => {
      const prevPrice = stockData.prices[index].close;
      return (price.close - prevPrice) / prevPrice;
    });
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
  };

  const calculateSharpeRatio = () => {
    if (stockData.prices.length < 2) return 0;
    
    const returns = stockData.prices.slice(1).map((price, index) => {
      const prevPrice = stockData.prices[index].close;
      return (price.close - prevPrice) / prevPrice;
    });
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length);
    
    const riskFreeRate = 0.02 / 252; // Assuming 2% annual risk-free rate
    return stdDev === 0 ? 0 : (meanReturn - riskFreeRate) / stdDev;
  };

  const calculateMaxDrawdown = () => {
    if (stockData.prices.length === 0) return 0;
    
    let maxDrawdown = 0;
    let peak = stockData.prices[0].close;
    
    for (const price of stockData.prices) {
      if (price.close > peak) {
        peak = price.close;
      }
      const drawdown = (peak - price.close) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown * 100;
  };

  const averageMetrics = forecasts.length > 0 ? {
    rmse: forecasts.reduce((sum, f) => sum + f.metrics.rmse, 0) / forecasts.length,
    mae: forecasts.reduce((sum, f) => sum + f.metrics.mae, 0) / forecasts.length,
    mape: forecasts.reduce((sum, f) => sum + f.metrics.mape, 0) / forecasts.length,
  } : null;

  const volatility = calculateVolatility();
  const sharpeRatio = calculateSharpeRatio();
  const maxDrawdown = calculateMaxDrawdown();

  const metrics = [
    {
      label: 'Volatility',
      value: `${volatility.toFixed(2)}%`,
      icon: <Activity className="h-5 w-5" />,
      description: 'Annual price volatility',
      color: volatility > 30 ? 'text-red-600' : volatility > 20 ? 'text-yellow-600' : 'text-green-600'
    },
    {
      label: 'Sharpe Ratio',
      value: sharpeRatio.toFixed(3),
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Risk-adjusted return',
      color: sharpeRatio > 1 ? 'text-green-600' : sharpeRatio > 0 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      label: 'Max Drawdown',
      value: `${maxDrawdown.toFixed(2)}%`,
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Maximum decline from peak',
      color: maxDrawdown > 20 ? 'text-red-600' : maxDrawdown > 10 ? 'text-yellow-600' : 'text-green-600'
    },
    {
      label: 'Avg Model RMSE',
      value: averageMetrics ? averageMetrics.rmse.toFixed(4) : 'N/A',
      icon: <Calculator className="h-5 w-5" />,
      description: 'Average forecast error',
      color: 'text-blue-600'
    }
  ];

  return (
    <div className={`p-6 rounded-lg shadow-sm ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center mb-6">
        <Calculator className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`${metric.color} mr-2`}>
                  {metric.icon}
                </div>
                <span className="font-medium">{metric.label}</span>
              </div>
              <span className={`text-lg font-bold ${metric.color}`}>
                {metric.value}
              </span>
            </div>
            <p className="text-sm text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>

      {averageMetrics && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-3">Model Performance Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {averageMetrics.rmse.toFixed(3)}
              </div>
              <div className="text-sm text-gray-500">Avg RMSE</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {averageMetrics.mae.toFixed(3)}
              </div>
              <div className="text-sm text-gray-500">Avg MAE</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {averageMetrics.mape.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Avg MAPE</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;