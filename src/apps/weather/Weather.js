import BaseApp from '../BaseApp.js'
import EventBus from '../../core/EventBus.js'

export default class Weather extends BaseApp {

  async setup() {
    this.container.innerHTML = `
      <div class="weather-container">
        <div class="weather-loading">
          <div class="weather-loading-spinner"></div>
          <div>Fetching weather data...</div>
        </div>
      </div>
    `

    try {
      const data = await this.fetchWeather()
      this.renderWeather(data)
    } catch (err) {
      this.renderFallback(err.message)
    }
  }

  async fetchWeather() {
    // Try multiple endpoints
    const endpoints = [
      'https://wttr.in/?format=j1',
      'https://wttr.in/London?format=j1', // Fallback with specific city
    ]

    for (const url of endpoints) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        })

        clearTimeout(timeout)

        if (!response.ok) continue

        const text = await response.text()

        // wttr.in sometimes returns HTML instead of JSON
        if (text.startsWith('<') || text.startsWith('<!')) continue

        const data = JSON.parse(text)
        return this.parseWttr(data)
      } catch (err) {
        console.warn(`[Weather] ${url} failed:`, err.message)
        continue
      }
    }

    throw new Error('All weather endpoints failed')
  }

  parseWttr(raw) {
    const current = raw.current_condition?.[0]
    const location = raw.nearest_area?.[0]
    const forecast = raw.weather?.slice(0, 5) || []

    if (!current) throw new Error('No weather data')

    const code = parseInt(current.weatherCode)

    return {
      temp: parseInt(current.temp_C),
      feelsLike: parseInt(current.FeelsLikeC),
      condition: current.weatherDesc?.[0]?.value || 'Unknown',
      icon: this.codeToEmoji(code),
      humidity: current.humidity,
      wind: current.windspeedKmph,
      windDir: current.winddir16Point,
      pressure: current.pressure,
      visibility: current.visibility,
      uvIndex: current.uvIndex,
      city: location?.areaName?.[0]?.value || 'Unknown',
      country: location?.country?.[0]?.value || '',
      forecast: forecast.map(day => ({
        date: day.date,
        day: new Date(day.date).toLocaleDateString('en', { weekday: 'short' }),
        high: parseInt(day.maxtempC),
        low: parseInt(day.mintempC),
        icon: this.codeToEmoji(parseInt(day.hourly?.[4]?.weatherCode || 0)),
      })),
    }
  }

  codeToEmoji(code) {
    if (code === 113) return 'Clear'
    if (code === 116) return 'Partly cloudy'
    if (code === 119 || code === 122) return 'Cloudy'
    if ([143, 248, 260].includes(code)) return 'Fog'
    if ([176, 263, 266, 293, 296].includes(code)) return 'Showers'
    if ([299, 302, 305, 308, 356, 359].includes(code)) return 'Rain'
    if ([200, 386, 389, 392, 395].includes(code)) return 'Storm'
    if ([179, 182, 185, 227, 230, 281, 284, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) return 'Snow'
    return 'Partly cloudy'
  }

  renderWeather(data) {
    this.container.innerHTML = `
      <div class="weather-container">
        <div class="weather-hero">
          <div class="weather-icon">${data.icon}</div>
          <div class="weather-temp">${data.temp}°</div>
          <div class="weather-condition">${data.condition}</div>
          <div class="weather-location">Location: ${data.city}, ${data.country}</div>
          <div class="weather-feels">Feels like ${data.feelsLike}°</div>
        </div>

        <div class="weather-details">
          <div class="weather-detail">
            <div class="weather-detail-value">${data.humidity}%</div>
            <div class="weather-detail-label">Humidity</div>
          </div>
          <div class="weather-detail">
            <div class="weather-detail-value">${data.wind}</div>
            <div class="weather-detail-label">km/h ${data.windDir}</div>
          </div>
          <div class="weather-detail">
            <div class="weather-detail-value">${data.pressure}</div>
            <div class="weather-detail-label">hPa</div>
          </div>
          <div class="weather-detail">
            <div class="weather-detail-value">${data.visibility}</div>
            <div class="weather-detail-label">km vis</div>
          </div>
          <div class="weather-detail">
            <div class="weather-detail-value">${data.uvIndex}</div>
            <div class="weather-detail-label">UV Index</div>
          </div>
        </div>

        <div class="weather-forecast">
          <div class="weather-forecast-title">5-Day Forecast</div>
          ${data.forecast.map(day => `
            <div class="weather-forecast-day">
              <span class="forecast-day">${day.day}</span>
              <span class="forecast-icon">${day.icon}</span>
              <span class="forecast-temps">
                <span class="forecast-high">${day.high}°</span>
                <span class="forecast-low">${day.low}°</span>
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  renderFallback(errorMsg) {
    this.container.innerHTML = `
      <div class="weather-container">
        <div class="weather-loading" role="status">
          <div class="weather-icon" aria-hidden="true">Unavailable</div>
          <div class="weather-condition">Weather is unavailable</div>
          <div class="weather-location">The external weather service could not be reached.</div>
          <div class="weather-feels">${errorMsg || 'Try again when the connection is available.'}</div>
        </div>
      </div>
    `
  }
}
