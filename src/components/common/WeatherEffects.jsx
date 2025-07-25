import React, { useEffect, useState } from 'react';
import { getWeatherEffect } from '../../services/weather';

const WeatherEffects = ({ weather }) => {
  const [effects, setEffects] = useState([]);

  useEffect(() => {
    if (!weather) return;

    console.log('🌤️ 날씨 효과 생성 시작:', weather.weather);
    const effectType = getWeatherEffect(weather.weather);
    console.log('🎨 효과 타입:', effectType);
    
    const newEffects = [];

    if (effectType === 'rain') {
      // 빗방울 효과 생성
      for (let i = 0; i < 50; i++) {
        newEffects.push({
          id: i,
          type: 'raindrop',
          left: Math.random() * 100,
          animationDuration: 0.7 + Math.random() * 0.6,
          animationDelay: Math.random() * 2
        });
      }
    } else if (effectType === 'snow') {
      // 눈송이 효과 생성
      for (let i = 0; i < 30; i++) {
        newEffects.push({
          id: i,
          type: 'snowflake',
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 4,
          animationDelay: Math.random() * 3
        });
      }
    } else if (effectType === 'clear') {
      // 하트 효과 생성
      console.log('💖 하트 효과 생성 시작');
      for (let i = 0; i < 18; i++) {
        const sizes = ['small', 'medium', 'large'];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        
        const heartEffect = {
          id: i,
          type: 'heart',
          size: randomSize,
          left: Math.random() * 100,
          animationDuration: 3 + Math.random() * 2,
          animationDelay: Math.random() * 3
        };
        
        newEffects.push(heartEffect);
        console.log(`💖 하트 ${i} 생성:`, heartEffect);
      }
      console.log('💖 총 하트 개수:', newEffects.length);
    }

    setEffects(newEffects);
  }, [weather]);

  if (!weather || effects.length === 0) {
    console.log('❌ 날씨 효과 렌더링 안함:', { weather: !!weather, effectsLength: effects.length });
    return null;
  }

  const effectType = getWeatherEffect(weather.weather);
  console.log('🎨 렌더링 시작:', { effectType, effectsCount: effects.length });

  return (
    <div className={`weather-${effectType}`}>
      {effects.map((effect) => {
        console.log('🎨 효과 렌더링:', effect);
        return (
          <div
            key={effect.id}
            className={`${effect.type} ${effect.size || ''}`}
            style={{
              left: `${effect.left}%`,
              animationDuration: `${effect.animationDuration}s`,
              animationDelay: `${effect.animationDelay}s`
            }}
          >
            {effect.type === 'heart' && '💖'}
          </div>
        );
      })}
    </div>
  );
};

export default WeatherEffects; 