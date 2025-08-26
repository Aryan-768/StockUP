export interface StockPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface StockData {
  symbol: string;
  prices: StockPrice[];
  lastUpdated: string;
}

export interface ForecastPrediction {
  date: string;
  value: number;
  confidence?: {
    lower: number;
    upper: number;
  };
}

export interface ForecastModel {
  name: string;
  type: 'moving_average' | 'linear_regression' | 'arima' | 'lstm';
  predictions: ForecastPrediction[];
  metrics: {
    rmse: number;
    mae: number;
    mape: number;
  };
  parameters?: Record<string, any>;
}

export interface TradingSignal {
  type: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1
  reason: string;
  timestamp: string;
  targetPrice?: number;
  stopLoss?: number;
}

export interface Anomaly {
  date: string;
  type: 'price_spike' | 'volume_spike' | 'trend_reversal';
  severity: 'low' | 'medium' | 'high';
  description: string;
  value: number;
  threshold: number;
}

export interface TechnicalIndicator {
  name: string;
  values: { date: string; value: number }[];
  signal?: 'bullish' | 'bearish' | 'neutral';
}