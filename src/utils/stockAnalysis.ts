import { StockData, StockPrice, ForecastModel, TradingSignal, Anomaly } from '../types';

// Mock data generator for demonstration
const generateMockStockData = (ticker: string, range: string): StockData => {
  const days = range === '1mo' ? 30 : range === '3mo' ? 90 : range === '6mo' ? 180 : 
                range === '1y' ? 365 : range === '2y' ? 730 : 1825;
  
  const prices: StockPrice[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let basePrice = 100 + Math.random() * 200; // Random base price between $100-$300
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Add some realistic price movement
    const change = (Math.random() - 0.5) * 0.1; // ±5% daily change
    const trend = Math.sin(i / 30) * 0.02; // Longer-term trend
    basePrice *= (1 + change + trend);
    
    const open = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const close = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      adjClose: close,
      volume
    });
  }
  
  return {
    symbol: ticker,
    prices,
    lastUpdated: new Date().toISOString()
  };
};

export const fetchStockData = async (ticker: string, range: string): Promise<StockData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would call the actual API
  // For demo purposes, we'll generate mock data
  return generateMockStockData(ticker, range);
};

// Moving Average Model
const generateMovingAverageForecasts = (stockData: StockData, window: number = 20): ForecastModel => {
  const prices = stockData.prices.map(p => p.close);
  const predictions = [];
  
  // Calculate moving average
  const movingAverage = prices.slice(-window).reduce((sum, price) => sum + price, 0) / window;
  
  // Generate 30-day forecast
  for (let i = 1; i <= 30; i++) {
    const date = new Date(stockData.prices[stockData.prices.length - 1].date);
    date.setDate(date.getDate() + i);
    
    // Add some trend and randomness
    const trend = 0.001 * i; // Slight upward trend
    const noise = (Math.random() - 0.5) * 0.02; // ±1% noise
    const value = movingAverage * (1 + trend + noise);
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      value,
      confidence: {
        lower: value * 0.95,
        upper: value * 1.05
      }
    });
  }
  
  // Calculate metrics (simplified)
  const rmse = Math.sqrt(prices.slice(-10).reduce((sum, price) => {
    const predicted = movingAverage;
    return sum + Math.pow(price - predicted, 2);
  }, 0) / 10);
  
  const mae = prices.slice(-10).reduce((sum, price) => {
    return sum + Math.abs(price - movingAverage);
  }, 0) / 10;
  
  const mape = (mae / movingAverage) * 100;
  
  return {
    name: `Moving Average (${window})`,
    type: 'moving_average',
    predictions,
    metrics: { rmse, mae, mape },
    parameters: { window }
  };
};

// Linear Regression Model
const generateLinearRegressionForecasts = (stockData: StockData): ForecastModel => {
  const prices = stockData.prices.map(p => p.close);
  const n = prices.length;
  
  // Simple linear regression
  const x = Array.from({length: n}, (_, i) => i);
  const y = prices;
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const predictions = [];
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date(stockData.prices[stockData.prices.length - 1].date);
    date.setDate(date.getDate() + i);
    
    const value = slope * (n + i) + intercept;
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value), // Ensure positive price
      confidence: {
        lower: Math.max(0, value * 0.9),
        upper: value * 1.1
      }
    });
  }
  
  // Calculate metrics
  const predicted = prices.map((_, i) => slope * i + intercept);
  const rmse = Math.sqrt(prices.reduce((sum, price, i) => {
    return sum + Math.pow(price - predicted[i], 2);
  }, 0) / prices.length);
  
  const mae = prices.reduce((sum, price, i) => {
    return sum + Math.abs(price - predicted[i]);
  }, 0) / prices.length;
  
  const mape = (mae / (prices.reduce((sum, price) => sum + price, 0) / prices.length)) * 100;
  
  return {
    name: 'Linear Regression',
    type: 'linear_regression',
    predictions,
    metrics: { rmse, mae, mape },
    parameters: { slope, intercept }
  };
};

// ARIMA-like Model (simplified)
const generateARIMAForecasts = (stockData: StockData): ForecastModel => {
  const prices = stockData.prices.map(p => p.close);
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  
  // Simple AR(1) model
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const phi = returns.slice(1).reduce((sum, ret, i) => {
    return sum + ret * returns[i];
  }, 0) / returns.slice(0, -1).reduce((sum, ret) => sum + ret * ret, 0);
  
  const predictions = [];
  let lastPrice = prices[prices.length - 1];
  let lastReturn = returns[returns.length - 1];
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date(stockData.prices[stockData.prices.length - 1].date);
    date.setDate(date.getDate() + i);
    
    const predictedReturn = meanReturn + phi * (lastReturn - meanReturn);
    const value = lastPrice * (1 + predictedReturn);
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value),
      confidence: {
        lower: Math.max(0, value * 0.92),
        upper: value * 1.08
      }
    });
    
    lastPrice = value;
    lastReturn = predictedReturn;
  }
  
  // Calculate metrics
  const predicted = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    const predictedReturn = meanReturn + phi * (returns[i-1] - meanReturn);
    predicted.push(predicted[i-1] * (1 + predictedReturn));
  }
  
  const rmse = Math.sqrt(prices.reduce((sum, price, i) => {
    return sum + Math.pow(price - predicted[i], 2);
  }, 0) / prices.length);
  
  const mae = prices.reduce((sum, price, i) => {
    return sum + Math.abs(price - predicted[i]);
  }, 0) / prices.length;
  
  const mape = (mae / (prices.reduce((sum, price) => sum + price, 0) / prices.length)) * 100;
  
  return {
    name: 'ARIMA(1,1,0)',
    type: 'arima',
    predictions,
    metrics: { rmse, mae, mape },
    parameters: { phi, meanReturn }
  };
};

export const generateForecasts = async (stockData: StockData): Promise<ForecastModel[]> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return [
    generateMovingAverageForecasts(stockData, 20),
    generateLinearRegressionForecasts(stockData),
    generateARIMAForecasts(stockData)
  ];
};

export const detectAnomalies = (stockData: StockData): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  const prices = stockData.prices.map(p => p.close);
  const volumes = stockData.prices.map(p => p.volume);
  
  // Calculate rolling statistics
  const priceStd = Math.sqrt(prices.reduce((sum, price) => {
    const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
    return sum + Math.pow(price - mean, 2);
  }, 0) / prices.length);
  
  const priceMean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const volumeMean = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const volumeStd = Math.sqrt(volumes.reduce((sum, vol) => {
    return sum + Math.pow(vol - volumeMean, 2);
  }, 0) / volumes.length);
  
  // Detect price anomalies
  stockData.prices.forEach((price, index) => {
    const zScore = Math.abs(price.close - priceMean) / priceStd;
    const volumeZScore = Math.abs(price.volume - volumeMean) / volumeStd;
    
    if (zScore > 2.5) {
      anomalies.push({
        date: price.date,
        type: 'price_spike',
        severity: zScore > 3 ? 'high' : 'medium',
        description: `Unusual price movement: ${price.close > priceMean ? 'spike' : 'drop'} of ${(zScore * priceStd).toFixed(2)}`,
        value: price.close,
        threshold: priceMean + 2.5 * priceStd
      });
    }
    
    if (volumeZScore > 2) {
      anomalies.push({
        date: price.date,
        type: 'volume_spike',
        severity: volumeZScore > 3 ? 'high' : 'medium',
        description: `Unusual trading volume: ${((price.volume / volumeMean - 1) * 100).toFixed(1)}% above average`,
        value: price.volume,
        threshold: volumeMean + 2 * volumeStd
      });
    }
    
    // Detect trend reversals
    if (index >= 5) {
      const recentPrices = prices.slice(index - 5, index + 1);
      const earlySlope = (recentPrices[2] - recentPrices[0]) / 2;
      const lateSlope = (recentPrices[5] - recentPrices[3]) / 2;
      
      if (earlySlope > 0 && lateSlope < 0 || earlySlope < 0 && lateSlope > 0) {
        anomalies.push({
          date: price.date,
          type: 'trend_reversal',
          severity: 'low',
          description: `Trend reversal detected: ${earlySlope > 0 ? 'uptrend to downtrend' : 'downtrend to uptrend'}`,
          value: price.close,
          threshold: priceMean
        });
      }
    }
  });
  
  return anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateTradingSignals = (stockData: StockData, forecasts: ForecastModel[]): TradingSignal[] => {
  const signals: TradingSignal[] = [];
  const currentPrice = stockData.prices[stockData.prices.length - 1].close;
  
  // Analyze forecasts for consensus
  const forecastPrices = forecasts.map(f => f.predictions[0]?.value || currentPrice);
  const avgForecast = forecastPrices.reduce((sum, price) => sum + price, 0) / forecastPrices.length;
  const priceChange = (avgForecast - currentPrice) / currentPrice;
  
  // Calculate technical indicators
  const prices = stockData.prices.map(p => p.close);
  const sma20 = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
  const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
  
  // Volume analysis
  const volumes = stockData.prices.map(p => p.volume);
  const avgVolume = volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) / 20;
  const currentVolume = stockData.prices[stockData.prices.length - 1].volume;
  const volumeRatio = currentVolume / avgVolume;
  
  // Generate signals based on multiple factors
  let signalStrength = 0;
  let signalType: 'buy' | 'sell' | 'hold' = 'hold';
  let reason = '';
  
  // Forecast-based signal
  if (priceChange > 0.03) {
    signalStrength += 0.3;
    signalType = 'buy';
    reason += 'Strong bullish forecast consensus. ';
  } else if (priceChange < -0.03) {
    signalStrength += 0.3;
    signalType = 'sell';
    reason += 'Strong bearish forecast consensus. ';
  }
  
  // Moving average signal
  if (currentPrice > sma20 && sma20 > sma50) {
    signalStrength += 0.2;
    if (signalType !== 'sell') signalType = 'buy';
    reason += 'Price above moving averages (bullish). ';
  } else if (currentPrice < sma20 && sma20 < sma50) {
    signalStrength += 0.2;
    if (signalType !== 'buy') signalType = 'sell';
    reason += 'Price below moving averages (bearish). ';
  }
  
  // Volume confirmation
  if (volumeRatio > 1.5) {
    signalStrength += 0.2;
    reason += 'High volume confirms signal. ';
  }
  
  // Volatility adjustment
  const recentPrices = prices.slice(-10);
  const volatility = Math.sqrt(recentPrices.reduce((sum, price, i) => {
    if (i === 0) return sum;
    const change = (price - recentPrices[i-1]) / recentPrices[i-1];
    return sum + change * change;
  }, 0) / recentPrices.length);
  
  if (volatility > 0.05) {
    signalStrength *= 0.8; // Reduce signal strength in high volatility
    reason += 'High volatility reduces signal confidence. ';
  }
  
  // Ensure signal strength is between 0 and 1
  signalStrength = Math.min(1, Math.max(0, signalStrength));
  
  if (signalStrength > 0.3) {
    const targetPrice = signalType === 'buy' ? currentPrice * 1.1 : currentPrice * 0.9;
    const stopLoss = signalType === 'buy' ? currentPrice * 0.95 : currentPrice * 1.05;
    
    signals.push({
      type: signalType,
      strength: signalStrength,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
      targetPrice,
      stopLoss
    });
  } else {
    signals.push({
      type: 'hold',
      strength: 0.5,
      reason: 'Mixed signals, recommend holding current position',
      timestamp: new Date().toISOString()
    });
  }
  
  return signals;
};

// Intraday Analysis Functions
export const fetchIntradayData = async (ticker: string, interval: number, maWindow: number) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate realistic intraday data
  const data = [];
  const now = new Date();
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 30, 0, 0); // 9:30 AM market open
  
  let basePrice = 150 + Math.random() * 100; // Random base price
  let baseVolume = 1000000 + Math.random() * 2000000; // Random base volume
  
  // Generate data points for the trading day
  for (let i = 0; i < 78; i++) { // ~6.5 hours of trading in 5-min intervals
    const timestamp = new Date(marketOpen.getTime() + i * interval * 60000);
    
    // Add realistic price movement
    const priceChange = (Math.random() - 0.5) * 0.02; // ±1% change per interval
    const trend = Math.sin(i / 20) * 0.005; // Longer trend
    basePrice *= (1 + priceChange + trend);
    
    // Add realistic volume patterns
    const volumeMultiplier = 0.5 + Math.random() * 1.5; // 0.5x to 2x base volume
    const volume = Math.floor(baseVolume * volumeMultiplier);
    
    data.push({
      timestamp: timestamp.toISOString(),
      price: basePrice,
      volume: volume
    });
  }
  
  // Calculate moving averages
  const processedData = data.map((point, index) => {
    const startIndex = Math.max(0, index - maWindow + 1);
    const priceWindow = data.slice(startIndex, index + 1).map(d => d.price);
    const volumeWindow = data.slice(startIndex, index + 1).map(d => d.volume);
    
    const priceMA = priceWindow.reduce((sum, p) => sum + p, 0) / priceWindow.length;
    const volumeMA = volumeWindow.reduce((sum, v) => sum + v, 0) / volumeWindow.length;
    
    // Classify trends
    const priceTrend = classifyTrend(point.price, priceMA);
    const volumeTrend = classifyTrend(point.volume, volumeMA);
    
    // Create combination and behavior
    const combination = `Price ${priceTrend} & Volume ${volumeTrend}`;
    const behavior = getMarketBehavior(priceTrend, volumeTrend);
    
    // Calculate factor metrics
    const factor = point.price * point.volume;
    const prevFactor = index > 0 ? data[index - 1].price * data[index - 1].volume : factor;
    const factorRatio = prevFactor > 0 ? factor / prevFactor : 1;
    
    return {
      ...point,
      priceMA,
      volumeMA,
      priceTrend,
      volumeTrend,
      combination,
      behavior,
      factor,
      factorRatio
    };
  });
  
  return {
    symbol: ticker,
    interval,
    maWindow,
    data: processedData,
    summary: calculateSummaryStats(processedData)
  };
};

const classifyTrend = (current: number, ma: number, threshold: number = 0.001): string => {
  const ratio = (current - ma) / ma;
  if (ratio > threshold) return "Increase";
  if (ratio < -threshold) return "Decrease";
  return "Stable";
};

const getMarketBehavior = (priceTrend: string, volumeTrend: string): string => {
  // Use a more robust mapping approach
  if (priceTrend === "Increase" && volumeTrend === "Increase") {
    return "Buying Pressure";
  } else if (priceTrend === "Increase" && volumeTrend === "Decrease") {
    return "Mild Buying";
  } else if (priceTrend === "Increase" && volumeTrend === "Stable") {
    return "Cautious Buying";
  } else if (priceTrend === "Decrease" && volumeTrend === "Increase") {
    return "Selling Pressure";
  } else if (priceTrend === "Decrease" && volumeTrend === "Decrease") {
    return "Mild Selling";
  } else if (priceTrend === "Decrease" && volumeTrend === "Stable") {
    return "Cautious Selling";
  } else if (priceTrend === "Stable" && volumeTrend === "Increase") {
    return "Volume Spike";
  } else if (priceTrend === "Stable" && volumeTrend === "Decrease") {
    return "Low Activity";
  } else if (priceTrend === "Stable" && volumeTrend === "Stable") {
    return "Stable Market";
  } else {
    return "Unknown";
  }
};

const calculateSummaryStats = (data: any[]) => {
  const behaviors = data.map(d => d.behavior);
  const combinations = data.map(d => d.combination);
  
  // Initialize all possible behaviors with 0 counts
  const allBehaviors = [
    'Buying Pressure', 'Selling Pressure', 'Mild Buying', 'Mild Selling',
    'Stable Market', 'Volume Spike', 'Low Activity', 'Cautious Buying', 'Cautious Selling'
  ];
  
  const allCombinations = [
    'Price Increase & Volume Increase', 'Price Increase & Volume Decrease', 'Price Increase & Volume Stable',
    'Price Decrease & Volume Increase', 'Price Decrease & Volume Decrease', 'Price Decrease & Volume Stable',
    'Price Stable & Volume Increase', 'Price Stable & Volume Decrease', 'Price Stable & Volume Stable'
  ];
  
  // Initialize with 0 counts
  const behaviorCounts = allBehaviors.reduce((acc, behavior) => {
    acc[behavior] = 0;
    return acc;
  }, {} as Record<string, number>);
  
  const combinationCounts = allCombinations.reduce((acc, combo) => {
    acc[combo] = 0;
    return acc;
  }, {} as Record<string, number>);
  
  // Count actual occurrences
  behaviors.forEach(behavior => {
    if (behaviorCounts.hasOwnProperty(behavior)) {
      behaviorCounts[behavior]++;
    }
  });
  
  combinations.forEach(combo => {
    if (combinationCounts.hasOwnProperty(combo)) {
      combinationCounts[combo]++;
    }
  });
  
  const mostCommonBehavior = Object.entries(behaviorCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "Unknown";
  
  return {
    behaviorCounts,
    combinationCounts,
    mostCommonBehavior,
    totalDataPoints: data.length
  };
};