import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import '../../styles/weather.css'; // Estilos personalizados para la interfaz
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import TemperatureToggleButton from '../Shared/TemperatureToggleButton';
import ThemeToggleButton from '../Shared/ThemeToggleButton';

// Registrar las escalas necesarias en Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const WeatherPage = () => {
  const [provinces, setProvinces] = useState([]);
  const [currentWeather, setCurrentWeather] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [todayForecast, setTodayForecast] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState([]);
  const [location, setLocation] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.4168, lng: -3.7038 }); // Madrid como posición inicial
  const [markerPosition, setMarkerPosition] = useState(null); // Posición del marcador
  const [temperatureUnit, setTemperatureUnit] = useState('C'); // Unidad de temperatura (C o F)
  const [theme, setTheme] = useState('light'); // Tema (light o dark)

  // Cargar las provincias al inicio
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesList = await apiClient.getProvinces();
        setProvinces(provincesList);
      } catch (error) {
        console.error('Error fetching provinces:', error.message);
      }
    };

    fetchProvinces();
  }, []);

  // Obtener datos del clima
  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      const province = provinces.find(p => p.nombre.toLowerCase() === location.toLowerCase());
      if (!province) {
        throw new Error('Provincia no encontrada');
      }

      const weather = await apiClient.getCurrentWeatherByProvince(province.codigo);
      const forecast = await apiClient.getDailyForecast(province.codigo);
      const todayForecast = await apiClient.getTodayForecast(province.codigo);
      const currentPrediction = await apiClient.getTodayForecast(province.codigo);

      setCurrentWeather(weather);
      setForecastData(forecast);
      setTodayForecast(Array.isArray(todayForecast) ? todayForecast : []);
      setCurrentPrediction(Array.isArray(currentPrediction) ? currentPrediction : []);
      setSelectedProvince(province);

      // Establecer coordenadas de la provincia y posición del marcador
      setMapCenter({ lat: province.latitud, lng: province.longitud });
      setMarkerPosition({ lat: province.latitud, lng: province.longitud });
    } catch (err) {
      setError('Error al obtener los datos meteorológicos');
      setCurrentWeather([]);
      setForecastData(null);
      setTodayForecast([]);
      setCurrentPrediction([]);
    } finally {
      setLoading(false);
    }
  };

  // Convertir temperatura a la unidad seleccionada
  const convertTemperature = (tempC) => {
    return temperatureUnit === 'C' ? tempC : (tempC * 9/5) + 32;
  };

  // Cambiar unidad de temperatura
  const toggleTemperatureUnit = () => {
    setTemperatureUnit(temperatureUnit === 'C' ? 'F' : 'C');
  };

  // Cambiar tema
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Obtener la URL de la imagen del estado del cielo
  const getSkyStatusImageUrl = (skyCode) => {
    const code = String(skyCode).padStart(2, '0'); // Asegura que el código tenga dos dígitos
    return `https://www.aemet.es/imagenes_gcd/_iconos_weather/${code}.png`;
  };

  // Obtener el clima en un momento específico del día
  const getWeatherAtTime = (day, time) => {
    if (!day.temperatura || !day.temperatura.hora) {
      return 'Información no disponible';
    }
    const weatherAtTime = day.temperatura.hora.find(h => h.periodo === time);
    return weatherAtTime ? weatherAtTime.value : 'Información no disponible';
  };

  // Datos para el gráfico de línea
  const lineChartData = forecastData ? {
    labels: forecastData.prediccion.dia.map(day => day.fecha),
    datasets: [
      {
        label: `Temperatura Máxima (°${temperatureUnit})`,
        data: forecastData.prediccion.dia.map(day => convertTemperature(day.temperatura.maxima)),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
      },
      {
        label: `Temperatura Mínima (°${temperatureUnit})`,
        data: forecastData.prediccion.dia.map(day => convertTemperature(day.temperatura.minima)),
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.2)',
      },
    ],
  } : null;

  return (
    <div className={`weather-page ${theme}`}>
      <h1>Consulta del Clima en España</h1>

      {/* Barra de búsqueda */}
      <div className="search-bar">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Introduce el nombre de la provincia"
          className="search-input"
          list="provinces"
        />
        <datalist id="provinces">
          {provinces.map((province, index) => (
            <option key={index} value={province.nombre} />
          ))}
        </datalist>
        <button onClick={fetchWeatherData} className="search-button">
          Buscar
        </button>
      </div>

      {/* Botones de cambio de unidad de temperatura y tema */}
      <div className="toggle-buttons">
        <TemperatureToggleButton toggleTemperatureUnit={toggleTemperatureUnit} />
        <ThemeToggleButton toggleTheme={toggleTheme} />
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="loading-container">
          <img src="../../assets/images/LoadingScreen.gif" alt="Cargando..." className="loading-gif" />
        </div>
      )}

      {/* Manejo de errores */}
      {error && <p className="error-message">{error}</p>}

      {/* Datos del clima */}
      {currentWeather.length > 0 && (
        <div className="current-weather-section">
          <h2>Clima Actual en {selectedProvince?.nombre}</h2>
          <table className="weather-table">
            <thead>
              <tr>
                <th>Estación</th>
                <th>Temperatura (°{temperatureUnit})</th>
                <th>Humedad (%)</th>
                <th>Viento (km/h)</th>
                <th>Condición</th>
              </tr>
            </thead>
            <tbody>
              {currentWeather.map((item, index) => (
                <tr key={index}>
                  <td>{item.nombre}</td>
                  <td>{convertTemperature(item.temperatura)}</td>
                  <td>{item.humedad}</td>
                  <td>{item.viento}</td>
                  <td>
                    <img
                      src={getSkyStatusImageUrl(item.estadoCielo)}
                      alt={item.estadoCielo || 'Desconocido'}
                      className="weather-icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Predicción futura */}
      {forecastData && (
        <div className="forecast-section">
          <h2>Predicción para los próximos días en {selectedProvince?.nombre}</h2>
          <table className="forecast-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>08:00</th>
                <th>14:00</th>
                <th>20:00</th>
                <th>Temperatura Máxima (°{temperatureUnit})</th>
                <th>Temperatura Mínima (°{temperatureUnit})</th>
                <th>Humedad (%)</th>
                <th>Viento (km/h)</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.prediccion.dia.map((day, index) => (
                <tr key={index}>
                  <td>{day.fecha}</td>
                  <td>
                    <img
                      src={getSkyStatusImageUrl(day.estadoCielo[0]?.value)}
                      alt={day.estadoCielo[0]?.descripcion || 'Desconocido'}
                      className="weather-icon"
                    />
                    {getWeatherAtTime(day, '08')}
                  </td>
                  <td>
                    <img
                      src={getSkyStatusImageUrl(day.estadoCielo[1]?.value)}
                      alt={day.estadoCielo[1]?.descripcion || 'Desconocido'}
                      className="weather-icon"
                    />
                    {getWeatherAtTime(day, '14')}
                  </td>
                  <td>
                    <img
                      src={getSkyStatusImageUrl(day.estadoCielo[2]?.value)}
                      alt={day.estadoCielo[2]?.descripcion || 'Desconocido'}
                      className="weather-icon"
                    />
                    {getWeatherAtTime(day, '20')}
                  </td>
                  <td>{convertTemperature(day.temperatura.maxima) || 'Información no disponible'}</td>
                  <td>{convertTemperature(day.temperatura.minima) || 'Información no disponible'}</td>
                  <td>{day.humedadRelativa.maxima || 'Información no disponible'}</td>
                  <td>{day.viento[0]?.velocidad || 'Información no disponible'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Gráfico de línea */}
          <div className="line-chart">
            <Line data={lineChartData} />
          </div>
        </div>
      )}

      {/* Predicción de hoy */}
      {todayForecast && todayForecast.length > 0 && (
        <div className="today-forecast-section">
          <h2>Predicción para hoy en {selectedProvince?.nombre}</h2>
          <table className="today-forecast-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Temperatura (°{temperatureUnit})</th>
                <th>Humedad (%)</th>
                <th>Viento (km/h)</th>
                <th>Condición</th>
              </tr>
            </thead>
            <tbody>
              {todayForecast.map((item, index) => (
                <tr key={index}>
                  <td>{item.hora}</td>
                  <td>{convertTemperature(item.temperatura)}</td>
                  <td>{item.humedad}</td>
                  <td>{item.viento}</td>
                  <td>
                    <img
                      src={getSkyStatusImageUrl(item.estadoCielo)}
                      alt={item.estadoCielo || 'Desconocido'}
                      className="weather-icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Predicción actual */}
      {currentPrediction && currentPrediction.length > 0 && (
        <div className="current-prediction-section">
          <h2>Predicción Actual en {selectedProvince?.nombre}</h2>
          <table className="current-prediction-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Temperatura (°{temperatureUnit})</th>
                <th>Humedad (%)</th>
                <th>Viento (km/h)</th>
                <th>Condición</th>
              </tr>
            </thead>
            <tbody>
              {currentPrediction.map((item, index) => (
                <tr key={index}>
                  <td>{item.hora}</td>
                  <td>{convertTemperature(item.temperatura)}</td>
                  <td>{item.humedad}</td>
                  <td>{item.viento}</td>
                  <td>
                    <img
                      src={getSkyStatusImageUrl(item.estadoCielo)}
                      alt={item.estadoCielo || 'Desconocido'}
                      className="weather-icon"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mapa interactivo */}
      <MapContainer center={mapCenter} zoom={8} style={{ height: '400px', width: '100%' }} key={JSON.stringify(mapCenter)}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>{selectedProvince?.nombre}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default WeatherPage;