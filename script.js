// Global variables for unit and API key
let unit = "metric";
let temperatureChart, rainChart;
const apiKey = "a14899a2584eacf5e8c21c713bcc3f14"; // Replace with your OpenWeather API key

function initializeApp() {
  const defaultCity = "New York";
  getWeather(defaultCity);
}

// Function to fetch and display weather data
async function getWeather(city = document.getElementById("city-input").value) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;

  // Show loading spinner
  document.getElementById("loading-spinner").style.display = "block";

  try {
    // Fetch current weather
    const response = await fetch(url);
    const data = await response.json();
    if (data.cod === 200) {
      displayCurrentWeather(data);
    } else {
      alert("City not found. Please try again.");
    }

    // Fetch forecast data
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    displayForecast(forecastData);
    displayWeatherDetails(data);
    updateCharts(forecastData); // Pass forecastData to updateCharts
  } catch (error) {
    console.error("Error fetching weather data:", error);
  } finally {
    document.getElementById("loading-spinner").style.display = "none";
  }
}

// Function to display current weather
function displayCurrentWeather(data) {
  document.getElementById("city-name").textContent =
    data.name + ", " + data.sys.country;
  document.getElementById("temperature").textContent = Math.round(
    data.main.temp
  );
  document.getElementById("unit").textContent = unit === "metric" ? "C" : "F";
  document.getElementById("description").textContent =
    data.weather[0].description;

  document.getElementById("city-input").value = data.name;
}

// Function to display forecast data
function displayForecast(data) {
  const forecastContainer = document.getElementById("forecast");
  forecastContainer.innerHTML = "";

  // Display the next 8 intervals (24 hours from the current time)
  data.list.slice(0, 8).forEach((forecast) => {
    const forecastElement = document.createElement("div");
    forecastElement.classList.add("forecast-day");

    // Format the time based on unit (standard or military)
    const formattedTime = formatTime(forecast.dt);

    const temperature = Math.round(forecast.main.temp);
    const iconUrl = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
    const description = forecast.weather[0].description;

    forecastElement.innerHTML = `
            <h4>${formattedTime}</h4>
            <img src="${iconUrl}" alt="${description}">
            <p>${temperature}°${unit === "metric" ? "C" : "F"}</p>
            <p>${description}</p>
        `;
    forecastContainer.appendChild(forecastElement);
  });
}

// Function to display additional weather details
function displayWeatherDetails(data) {
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const windSpeed =
    unit === "metric"
      ? `${data.wind.speed} km/h`
      : `${(data.wind.speed * 2.237).toFixed(1)} mph`;
  const pressure = `${data.main.pressure} mb`;
  const feelsLike = `${Math.round(data.main.feels_like)}°${
    unit === "metric" ? "C" : "F"
  }`;
  const visibility =
    unit === "metric"
      ? `${(data.visibility / 1000).toFixed(1)} km`
      : `${(data.visibility / 1609).toFixed(1)} miles`;

  document.getElementById("sunrise").textContent = sunrise;
  document.getElementById("sunset").textContent = sunset;
  document.getElementById("wind").textContent = windSpeed;
  document.getElementById("pressure").textContent = pressure;
  document.getElementById("feels-like").textContent = feelsLike;
  document.getElementById("visibility").textContent = visibility;
}

// Function to toggle between metric and imperial units
function toggleUnits() {
  unit = unit === "metric" ? "imperial" : "metric";

  // Re-fetch the weather for the current city with the new unit
  getWeather(document.getElementById("city-input").value);
}

// Function to get a random city from a list and fetch its weather
function randomCity() {
  const cities = [
    "New York",
    "London",
    "Paris",
    "Tokyo",
    "Sydney",
    "Moscow",
    "Beijing",
    "Dubai",
    "Rome",
    "Berlin",
    "Toronto",
    "Los Angeles",
    "Mexico City",
    "Mumbai",
    "Istanbul",
  ];

  const randomIndex = Math.floor(Math.random() * cities.length);
  const city = cities[randomIndex];
  getWeather(city);
}

function formatTime(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  const hours = date.getHours();
  const minutes = "0" + date.getMinutes();

  if (unit === "imperial") {
    // Standard 12-hour format with AM/PM
    const suffix = hours >= 12 ? "PM" : "AM";
    const standardHours = hours % 12 || 12; // Convert 0 to 12 for AM/PM format
    return `${standardHours}:${minutes.substr(-2)} ${suffix}`;
  } else {
    // Military 24-hour format
    return `${hours.toString().padStart(2, "0")}:${minutes.substr(-2)}`;
  }
}

function updateCharts(data) {
  const labels = [];
  const temperatureData = [];
  const rainChanceData = [];

  data.list.slice(0, 8).forEach((forecast) => {
    const formattedTime = formatTime(forecast.dt);

    labels.push(formattedTime);
    temperatureData.push(forecast.main.temp);
    rainChanceData.push(forecast.pop * 100); // Assuming 'pop' is the probability of precipitation
  });

  const tempUnitLabel = unit === "metric" ? "°C" : "°F"; // Set label based on unit

  // Temperature Chart
  if (temperatureChart) {
    temperatureChart.destroy();
  }
  const temperatureCtx = document
    .getElementById("temperatureChart")
    .getContext("2d");
  temperatureChart = new Chart(temperatureCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (" + tempUnitLabel + ")", // Dynamic label using concatenation
          data: temperatureData,
          borderColor: "#6a11cb",
          backgroundColor: "rgba(106, 17, 203, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      aspectRatio: 2, // Adjust aspect ratio
      scales: {
        x: { title: { display: true, text: "Time of Day" } },
        y: {
          title: { display: true, text: "Temperature (" + tempUnitLabel + ")" },
        },
      },
      responsive: true,
    },
  });

  // Rain Chance Chart
  if (rainChart) {
    rainChart.destroy();
  }
  const rainCtx = document.getElementById("rainChart").getContext("2d");
  rainChart = new Chart(rainCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Chance of Rain (%)",
          data: rainChanceData,
          backgroundColor: "rgba(106, 17, 203, 0.7)",
          borderColor: "#6a11cb",
          borderWidth: 1,
        },
      ],
    },
    options: {
      aspectRatio: 2, // Adjust aspect ratio
      scales: {
        x: { title: { display: true, text: "Time of Day" } },
        y: {
          title: { display: true, text: "Chance of Rain (%)" },
          beginAtZero: true,
          max: 100,
        },
      },
      responsive: true,
    },
  });
}

window.onload = initializeApp;
