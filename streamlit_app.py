import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Page configuration
st.set_page_config(
    page_title="Intraday Stock Market Analyzer",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .trend-up {
        color: #00cc44;
        font-weight: bold;
    }
    .trend-down {
        color: #ff4444;
        font-weight: bold;
    }
    .trend-stable {
        color: #888888;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

def classify_trend(current_value, ma_value, threshold=0.001):
    """Classify trend based on comparison with moving average"""
    ratio = (current_value - ma_value) / ma_value
    if ratio > threshold:
        return "Increase"
    elif ratio < -threshold:
        return "Decrease"
    else:
        return "Stable"

def get_market_behavior(price_trend, volume_trend):
    """Map price-volume combination to market behavior"""
    behavior_map = {
        ("Increase", "Increase"): "Buying Pressure",
        ("Increase", "Decrease"): "Mild Buying",
        ("Increase", "Stable"): "Cautious Buying",
        ("Decrease", "Increase"): "Selling Pressure",
        ("Decrease", "Decrease"): "Mild Selling",
        ("Decrease", "Stable"): "Cautious Selling",
        ("Stable", "Increase"): "Volume Spike",
        ("Stable", "Decrease"): "Low Activity",
        ("Stable", "Stable"): "Stable Market"
    }
    return behavior_map.get((price_trend, volume_trend), "Unknown")

def get_trend_color(trend):
    """Get color for trend visualization"""
    if trend == "Increase":
        return "#00cc44"
    elif trend == "Decrease":
        return "#ff4444"
    else:
        return "#888888"

def fetch_intraday_data(symbol, interval):
    """Fetch intraday stock data using yfinance"""
    try:
        ticker = yf.Ticker(symbol)
        # Get today's data with specified interval
        data = ticker.history(period="1d", interval=f"{interval}m")
        
        if data.empty:
            st.error(f"No data found for symbol {symbol}")
            return None
        
        # Reset index to get datetime as column
        data = data.reset_index()
        
        # Rename columns for consistency
        data = data.rename(columns={
            'Datetime': 'Timestamp',
            'Close': 'Price'
        })
        
        # Keep only required columns
        data = data[['Timestamp', 'Price', 'Volume']].copy()
        
        return data
    
    except Exception as e:
        st.error(f"Error fetching data: {str(e)}")
        return None

def calculate_moving_averages(data, window):
    """Calculate moving averages for price and volume"""
    data['Price_MA'] = data['Price'].rolling(window=window, min_periods=1).mean()
    data['Volume_MA'] = data['Volume'].rolling(window=window, min_periods=1).mean()
    return data

def analyze_trends(data):
    """Analyze price and volume trends"""
    trends = []
    
    for i in range(len(data)):
        price_trend = classify_trend(data.iloc[i]['Price'], data.iloc[i]['Price_MA'])
        volume_trend = classify_trend(data.iloc[i]['Volume'], data.iloc[i]['Volume_MA'])
        
        combination = f"Price {price_trend} & Volume {volume_trend}"
        behavior = get_market_behavior(price_trend, volume_trend)
        
        trends.append({
            'Price_Trend': price_trend,
            'Volume_Trend': volume_trend,
            'Combination': combination,
            'Behavior': behavior
        })
    
    trends_df = pd.DataFrame(trends)
    
    # Add trends to original data
    for col in trends_df.columns:
        data[col] = trends_df[col]
    
    return data

def calculate_factor_metrics(data):
    """Calculate Factor and Factor Ratio"""
    data['Factor'] = data['Price'] * data['Volume']
    data['Factor_Ratio'] = data['Factor'].pct_change() + 1  # Ratio = Factor[n+1] / Factor[n]
    data['Factor_Ratio'] = data['Factor_Ratio'].fillna(1)  # Fill first NaN with 1
    return data

def create_price_chart(data):
    """Create price and price MA chart"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=data['Timestamp'],
        y=data['Price'],
        mode='lines',
        name='Price',
        line=dict(color='#1f77b4', width=2)
    ))
    
    fig.add_trace(go.Scatter(
        x=data['Timestamp'],
        y=data['Price_MA'],
        mode='lines',
        name='Price MA',
        line=dict(color='#ff7f0e', width=2, dash='dash')
    ))
    
    fig.update_layout(
        title="Price vs Moving Average",
        xaxis_title="Time",
        yaxis_title="Price",
        hovermode='x unified',
        showlegend=True
    )
    
    return fig

def create_volume_chart(data):
    """Create volume and volume MA chart"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=data['Timestamp'],
        y=data['Volume'],
        mode='lines',
        name='Volume',
        line=dict(color='#2ca02c', width=2)
    ))
    
    fig.add_trace(go.Scatter(
        x=data['Timestamp'],
        y=data['Volume_MA'],
        mode='lines',
        name='Volume MA',
        line=dict(color='#d62728', width=2, dash='dash')
    ))
    
    fig.update_layout(
        title="Volume vs Moving Average",
        xaxis_title="Time",
        yaxis_title="Volume",
        hovermode='x unified',
        showlegend=True
    )
    
    return fig

def create_factor_chart(data):
    """Create factor chart"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=data['Timestamp'],
        y=data['Factor'],
        mode='lines',
        name='Factor (Price × Volume)',
        line=dict(color='#9467bd', width=2)
    ))
    
    fig.update_layout(
        title="Factor (Price × Volume) Over Time",
        xaxis_title="Time",
        yaxis_title="Factor",
        hovermode='x unified'
    )
    
    return fig

def create_factor_ratio_chart(data):
    """Create factor ratio chart"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=data['Timestamp'],
        y=data['Factor_Ratio'],
        mode='lines',
        name='Factor Ratio',
        line=dict(color='#8c564b', width=2)
    ))
    
    # Add horizontal line at y=1 for reference
    fig.add_hline(y=1, line_dash="dash", line_color="gray", 
                  annotation_text="No Change", annotation_position="bottom right")
    
    fig.update_layout(
        title="Factor Ratio Over Time",
        xaxis_title="Time",
        yaxis_title="Factor Ratio",
        hovermode='x unified'
    )
    
    return fig

def create_combination_frequency_chart(data):
    """Create price-volume combination frequency chart"""
    combo_counts = data['Combination'].value_counts()
    
    fig = px.bar(
        x=combo_counts.index,
        y=combo_counts.values,
        title="Frequency of Price-Volume Combinations",
        labels={'x': 'Price-Volume Combination', 'y': 'Frequency'},
        color=combo_counts.values,
        color_continuous_scale='viridis'
    )
    
    fig.update_layout(
        xaxis_tickangle=-45,
        showlegend=False
    )
    
    return fig

def create_behavior_frequency_chart(data):
    """Create market behavior frequency chart"""
    behavior_counts = data['Behavior'].value_counts()
    
    # Define colors for different behaviors
    color_map = {
        'Buying Pressure': '#00cc44',
        'Selling Pressure': '#ff4444',
        'Mild Buying': '#66ff66',
        'Mild Selling': '#ff6666',
        'Stable Market': '#888888',
        'Volume Spike': '#ffaa00',
        'Low Activity': '#cccccc',
        'Cautious Buying': '#44cc44',
        'Cautious Selling': '#cc4444'
    }
    
    colors = [color_map.get(behavior, '#888888') for behavior in behavior_counts.index]
    
    fig = go.Figure(data=[
        go.Bar(
            x=behavior_counts.index,
            y=behavior_counts.values,
            marker_color=colors,
            text=behavior_counts.values,
            textposition='auto'
        )
    ])
    
    fig.update_layout(
        title="Frequency of Market Behaviors",
        xaxis_title="Market Behavior",
        yaxis_title="Frequency",
        xaxis_tickangle=-45
    )
    
    return fig

def main():
    # Main header
    st.markdown('<h1 class="main-header">📈 Intraday Stock Market Analyzer</h1>', unsafe_allow_html=True)
    
    # Sidebar for inputs
    st.sidebar.header("📊 Analysis Parameters")
    
    # Stock symbol input
    symbol = st.sidebar.text_input(
        "Stock Symbol",
        value="AAPL",
        help="Enter stock symbol (e.g., AAPL, GOOGL, RELIANCE.NS)"
    ).upper()
    
    # Time interval selection
    interval = st.sidebar.selectbox(
        "Time Interval (minutes)",
        options=[1, 2, 5, 15, 30, 60],
        index=2,  # Default to 5 minutes
        help="Select the time interval for intraday data"
    )
    
    # Moving average window
    ma_window = st.sidebar.number_input(
        "Moving Average Window",
        min_value=2,
        max_value=20,
        value=3,
        help="Number of intervals for moving average calculation"
    )
    
    # Analysis button
    analyze_button = st.sidebar.button("🔍 Analyze Stock", type="primary")
    
    if analyze_button and symbol:
        with st.spinner(f"Fetching intraday data for {symbol}..."):
            # Fetch data
            data = fetch_intraday_data(symbol, interval)
            
            if data is not None and not data.empty:
                st.success(f"Successfully fetched {len(data)} data points for {symbol}")
                
                # Calculate moving averages
                data = calculate_moving_averages(data, ma_window)
                
                # Analyze trends
                data = analyze_trends(data)
                
                # Calculate factor metrics
                data = calculate_factor_metrics(data)
                
                # Display key metrics
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    current_price = data['Price'].iloc[-1]
                    price_change = data['Price'].iloc[-1] - data['Price'].iloc[0]
                    price_change_pct = (price_change / data['Price'].iloc[0]) * 100
                    
                    st.metric(
                        "Current Price",
                        f"${current_price:.2f}",
                        f"{price_change:+.2f} ({price_change_pct:+.2f}%)"
                    )
                
                with col2:
                    current_volume = data['Volume'].iloc[-1]
                    avg_volume = data['Volume'].mean()
                    volume_vs_avg = ((current_volume - avg_volume) / avg_volume) * 100
                    
                    st.metric(
                        "Current Volume",
                        f"{current_volume:,.0f}",
                        f"{volume_vs_avg:+.1f}% vs avg"
                    )
                
                with col3:
                    latest_behavior = data['Behavior'].iloc[-1]
                    st.metric(
                        "Latest Behavior",
                        latest_behavior,
                        data['Combination'].iloc[-1]
                    )
                
                with col4:
                    factor_ratio = data['Factor_Ratio'].iloc[-1]
                    factor_change = (factor_ratio - 1) * 100
                    
                    st.metric(
                        "Factor Ratio",
                        f"{factor_ratio:.3f}",
                        f"{factor_change:+.2f}%"
                    )
                
                # Create visualizations
                st.header("📈 Price Analysis")
                col1, col2 = st.columns(2)
                
                with col1:
                    price_chart = create_price_chart(data)
                    st.plotly_chart(price_chart, use_container_width=True)
                
                with col2:
                    volume_chart = create_volume_chart(data)
                    st.plotly_chart(volume_chart, use_container_width=True)
                
                st.header("📊 Factor Analysis")
                col1, col2 = st.columns(2)
                
                with col1:
                    factor_chart = create_factor_chart(data)
                    st.plotly_chart(factor_chart, use_container_width=True)
                
                with col2:
                    factor_ratio_chart = create_factor_ratio_chart(data)
                    st.plotly_chart(factor_ratio_chart, use_container_width=True)
                
                st.header("🎯 Market Behavior Analysis")
                col1, col2 = st.columns(2)
                
                with col1:
                    combo_chart = create_combination_frequency_chart(data)
                    st.plotly_chart(combo_chart, use_container_width=True)
                
                with col2:
                    behavior_chart = create_behavior_frequency_chart(data)
                    st.plotly_chart(behavior_chart, use_container_width=True)
                
                # Detailed data table
                st.header("📋 Detailed Analysis Table")
                
                # Format the data for display
                display_data = data.copy()
                display_data['Timestamp'] = display_data['Timestamp'].dt.strftime('%H:%M:%S')
                display_data['Price'] = display_data['Price'].round(2)
                display_data['Volume'] = display_data['Volume'].astype(int)
                display_data['Price_MA'] = display_data['Price_MA'].round(2)
                display_data['Volume_MA'] = display_data['Volume_MA'].round(0).astype(int)
                display_data['Factor'] = display_data['Factor'].round(0).astype(int)
                display_data['Factor_Ratio'] = display_data['Factor_Ratio'].round(3)
                
                # Select columns for display
                display_columns = [
                    'Timestamp', 'Price', 'Volume', 'Price_Trend', 'Volume_Trend',
                    'Combination', 'Behavior', 'Factor', 'Factor_Ratio'
                ]
                
                st.dataframe(
                    display_data[display_columns],
                    use_container_width=True,
                    height=400
                )
                
                # Download button for data
                csv = display_data.to_csv(index=False)
                st.download_button(
                    label="📥 Download Analysis Data (CSV)",
                    data=csv,
                    file_name=f"{symbol}_intraday_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    mime="text/csv"
                )
                
                # Summary insights
                st.header("💡 Key Insights")
                
                # Calculate some insights
                buying_pressure_pct = (data['Behavior'] == 'Buying Pressure').mean() * 100
                selling_pressure_pct = (data['Behavior'] == 'Selling Pressure').mean() * 100
                stable_market_pct = (data['Behavior'] == 'Stable Market').mean() * 100
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.info(f"**Buying Pressure**: {buying_pressure_pct:.1f}% of intervals")
                
                with col2:
                    st.warning(f"**Selling Pressure**: {selling_pressure_pct:.1f}% of intervals")
                
                with col3:
                    st.success(f"**Stable Market**: {stable_market_pct:.1f}% of intervals")
                
                # Most common behavior
                most_common_behavior = data['Behavior'].mode().iloc[0]
                st.info(f"**Dominant Market Behavior**: {most_common_behavior}")
                
            else:
                st.error("Failed to fetch data. Please check the symbol and try again.")
    
    elif not symbol:
        st.info("👈 Please enter a stock symbol in the sidebar to begin analysis.")
    
    # Footer
    st.markdown("---")
    st.markdown(
        "**Note**: This analysis is based on intraday price and volume movements. "
        "It provides insights into short-term market sentiment and should be used "
        "in conjunction with other analysis methods for trading decisions."
    )

if __name__ == "__main__":
    main()