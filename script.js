async function getWeather() {
  const city = document.getElementById("city-input").value;
  const apiKey = "a14899a2584eacf5e8c21c713bcc3f14";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod === 200) {
      displayWeather(data);
    } else {
      document.getElementById(
        "weather-result"
      ).innerHTML = `<p>City not found. Please try again.</p>`;
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    document.getElementById(
      "weather-result"
    ).innerHTML = `<p>Error fetching data. Please try again later.</p>`;
  }
}

function displayWeather(data) {
  const { name, main, weather, wind } = data;
  document.getElementById("weather-result").innerHTML = `
      <h2>${name}</h2>
      <p>Temperature: ${main.temp}°C</p>
      <p>Humidity: ${main.humidity}%</p>
      <p>Weather: ${weather[0].description}</p>
      <p>Wind Speed: ${wind.speed} m/s</p>
    `;
}
