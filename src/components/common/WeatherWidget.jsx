import React, { useState, useEffect } from 'react';
import { getWeather, getCurrentLocation, getWeatherEmoji } from '../../services/weather';

const WeatherWidget = ({ onWeatherChange }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 날씨 정보 가져오기
  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ 날씨 정보 가져오기 시작...');
      
      // 현재 위치 가져오기
      const location = await getCurrentLocation();
      console.log('📍 위치 정보:', location);
      
      // 날씨 정보 가져오기
      const weatherData = await getWeather(location.lat, location.lon);
      console.log('🌡️ 날씨 데이터:', weatherData);
      
      if (weatherData) {
        setWeather(weatherData);
        // 부모 컴포넌트에 날씨 정보 전달
        if (onWeatherChange) {
          onWeatherChange(weatherData);
        }
        console.log('✅ 날씨 정보 설정 완료');
      } else {
        console.error('❌ 날씨 데이터가 null입니다');
        setError('날씨 데이터를 받지 못했습니다');
      }
    } catch (err) {
      console.error('❌ 날씨 정보 오류:', err);
      setError(`오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 날씨 정보 가져오기
  useEffect(() => {
    fetchWeather();
    
    // 30분마다 날씨 정보 업데이트
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="emoji">🌤️</div>
        <div className="temperature">--°C</div>
        <div className="description">날씨 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget">
        <div className="emoji">🌤️</div>
        <div className="temperature">--°C</div>
        <div className="description">날씨 정보 없음</div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const emoji = getWeatherEmoji(weather.weather);

  return (
    <div className="weather-widget">
      <div className="emoji">{emoji}</div>
      <div className="temperature">{weather.temperature}°C</div>
      <div className="description">{weather.description}</div>
    </div>
  );
};

export default WeatherWidget; 