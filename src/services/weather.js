// 날씨 API 서비스
// 무료 날씨 API 사용 (OpenWeatherMap 대신)

// 무료 날씨 API (API 키 불필요)
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1';

// 날씨 데이터 가져오기
export const getWeather = async (lat, lon) => {
  try {
    console.log('🌤️ API 호출 시작:', { lat, lon });
    
    const url = `${WEATHER_BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    console.log('🔗 API URL:', url);
    
    const response = await fetch(url);
    console.log('📡 API 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류 응답:', errorText);
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 날씨 API 응답 데이터:', data);
    
    // 날씨 코드를 텍스트로 변환
    const weatherText = getWeatherText(data.current.weather_code);
    
    const weatherData = {
      temperature: Math.round(data.current.temperature_2m),
      weather: weatherText,
      description: weatherText,
      icon: data.current.weather_code,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m
    };
    
    console.log('✅ 처리된 날씨 데이터:', weatherData);
    return weatherData;
  } catch (error) {
    console.error('❌ 날씨 API 오류:', error);
    throw error; // 오류를 다시 던져서 위젯에서 처리하도록 함
  }
};

// 날씨 코드를 텍스트로 변환하는 함수
const getWeatherText = (code) => {
  const weatherCodes = {
    0: 'Clear',
    1: 'Clear',
    2: 'Clouds',
    3: 'Clouds',
    45: 'Fog',
    48: 'Fog',
    51: 'Rain',
    53: 'Rain',
    55: 'Rain',
    56: 'Rain',
    57: 'Rain',
    61: 'Rain',
    63: 'Rain',
    65: 'Rain',
    66: 'Rain',
    67: 'Rain',
    71: 'Snow',
    73: 'Snow',
    75: 'Snow',
    77: 'Snow',
    80: 'Rain',
    81: 'Rain',
    82: 'Rain',
    85: 'Snow',
    86: 'Snow',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm'
  };
  
  return weatherCodes[code] || 'Clear';
};

// 현재 위치 가져오기
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    console.log('📍 위치 정보 요청 시작...');
    
    if (!navigator.geolocation) {
      console.error('❌ 브라우저가 위치 정보를 지원하지 않습니다');
      reject(new Error('위치 정보를 지원하지 않습니다.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        console.log('✅ 위치 정보 획득:', location);
        resolve(location);
      },
      (error) => {
        console.error('❌ 위치 정보 오류:', error);
        console.log('📍 서울 기본 위치로 설정');
        // 서울 기본 위치
        resolve({ lat: 37.5665, lon: 126.9780 });
      },
      {
        timeout: 10000, // 10초 타임아웃
        enableHighAccuracy: false, // 정확도 낮춰서 빠르게
        maximumAge: 300000 // 5분 캐시
      }
    );
  });
};

// 날씨 상태에 따른 배경 효과 타입 결정
export const getWeatherEffect = (weather) => {
  console.log('🔍 날씨 효과 분석:', weather);
  const weatherLower = weather.toLowerCase();
  console.log('🔍 소문자 변환:', weatherLower);
  
  if (weatherLower.includes('rain') || weatherLower.includes('drizzle')) {
    console.log('🌧️ 비 효과 선택');
    return 'rain';
  } else if (weatherLower.includes('snow')) {
    console.log('❄️ 눈 효과 선택');
    return 'snow';
  } else if (weatherLower.includes('cloud')) {
    console.log('☁️ 흐림 효과 선택');
    return 'cloudy';
  } else {
    console.log('☀️ 맑음 효과 선택 (하트)');
    return 'clear';
  }
};

// 날씨 이모티콘 매핑
export const getWeatherEmoji = (weather) => {
  const weatherLower = weather.toLowerCase();
  
  if (weatherLower.includes('rain') || weatherLower.includes('drizzle')) {
    return '🌧️';
  } else if (weatherLower.includes('snow')) {
    return '❄️';
  } else if (weatherLower.includes('cloud')) {
    return '☁️';
  } else if (weatherLower.includes('clear')) {
    return '☀️';
  } else if (weatherLower.includes('thunder')) {
    return '⛈️';
  } else if (weatherLower.includes('fog') || weatherLower.includes('mist')) {
    return '🌫️';
  } else {
    return '🌤️';
  }
}; 