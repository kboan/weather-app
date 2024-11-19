// Global variables for unit and API key
let unit = "metric";
let temperatureChart, rainChart;
const apiKey = "a14899a2584eacf5e8c21c713bcc3f14"; // Replace with your OpenWeather API key

// Initialize the app with a default city
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
    displayFiveDayForecast(forecastData); // Pass forecast data for the 5-day forecast
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

// Function to display forecast data for "Today's Forecast" section
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

// Function to display the 5-day forecast
function displayFiveDayForecast(data) {
  const fiveDayContainer = document.getElementById("five-day-container");
  fiveDayContainer.innerHTML = "";

  // Group forecast data by day
  const dailyData = {};
  data.list.forEach((entry) => {
    const date = new Date(entry.dt * 1000).toISOString().split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        weather: entry.weather[0],
        date: date,
      };
    }
    dailyData[date].temps.push(entry.main.temp);
  });

  // Display the first 5 days
  Object.values(dailyData)
    .slice(0, 5)
    .forEach((day) => {
      const avgTemp =
        day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length;
      const iconURL = `https://openweathermap.org/img/wn/${day.weather.icon}@2x.png`;
      const weatherDescription = day.weather.description;

      const dayElement = document.createElement("div");
      dayElement.classList.add("forecast-day");
      dayElement.setAttribute("data-date", day.date); // Add data-date attribute

      dayElement.innerHTML = `
        <h4>${new Date(day.date).toLocaleDateString(undefined, {
          weekday: "long",
        })}</h4>
        <img src="${iconURL}" alt="${weatherDescription}">
        <p>${Math.round(avgTemp)}°${unit === "metric" ? "C" : "F"}</p>
        <p>${weatherDescription}</p>
      `;

      dayElement.addEventListener("click", () => {
        // Mark this day as selected
        document
          .querySelectorAll(".forecast-day")
          .forEach((el) => el.classList.remove("selected"));
        dayElement.classList.add("selected");

        // Update charts for the selected day
        updateChartsForDay(
          data.list.filter((entry) => entry.dt_txt.startsWith(day.date))
        );
        document.getElementById("charts-section").style.display = "block";
      });

      fiveDayContainer.appendChild(dayElement);
    });
}

// Function to update charts for a selected day
function updateChartsForDay(entries) {
  const labels = [];
  const temperatureData = [];
  const rainChanceData = [];

  entries.forEach((entry) => {
    const formattedTime = formatTime(entry.dt);
    labels.push(formattedTime);
    temperatureData.push(entry.main.temp);
    rainChanceData.push(entry.pop * 100); // Precipitation probability
  });

  const tempUnitLabel = unit === "metric" ? "°C" : "°F";

  // Update Temperature Chart
  if (temperatureChart) temperatureChart.destroy();
  const temperatureCtx = document
    .getElementById("temperatureChart")
    .getContext("2d");
  temperatureChart = new Chart(temperatureCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperature (${tempUnitLabel})`,
          data: temperatureData,
          borderColor: "#6a11cb",
          backgroundColor: "rgba(106, 17, 203, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Time of Day" } },
        y: { title: { display: true, text: `Temperature (${tempUnitLabel})` } },
      },
    },
  });

  // Update Rain Chart
  if (rainChart) rainChart.destroy();
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
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: { display: true, text: "Chance of Rain (%)" },
          min: 0,
          max: 100,
        },
      },
    },
  });
}

// Utility function to format time
function formatTime(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  const hours = date.getHours();
  const minutes = "0" + date.getMinutes();

  if (unit === "imperial") {
    const suffix = hours >= 12 ? "PM" : "AM";
    const standardHours = hours % 12 || 12;
    return `${standardHours}:${minutes.substr(-2)} ${suffix}`;
  } else {
    return `${hours.toString().padStart(2, "0")}:${minutes.substr(-2)}`;
  }
}

// Function to toggle units between metric and imperial
function toggleUnits() {
  unit = unit === "metric" ? "imperial" : "metric";

  // Re-fetch the weather and forecast data to update the page
  const currentCity = document.getElementById("city-input").value;
  getWeather(currentCity);

  // If charts are visible, update them to reflect the new units
  const chartsSection = document.getElementById("charts-section");
  if (chartsSection.style.display !== "none") {
    // Get the currently selected day's data from the 5-day forecast
    const selectedDay = document.querySelector(".forecast-day.selected");
    if (selectedDay) {
      const selectedDate = selectedDay.getAttribute("data-date");
      updateChartsForSelectedDay(selectedDate, currentCity);
    }
  }
}

// Helper function to update charts for the selected day and city
async function updateChartsForSelectedDay(selectedDate, city) {
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;

  try {
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    const selectedDayData = forecastData.list.filter((entry) =>
      entry.dt_txt.startsWith(selectedDate)
    );
    updateChartsForDay(selectedDayData);
  } catch (error) {
    console.error("Error updating charts for selected day:", error);
  }
}

// Function to fetch a random city's weather
function randomCity() {
  const cities = [
    "New York",
    "London",
    "Paris",
    "Tokyo",
    "Sydney",
    "Dubai",
    "Rome",
    "Berlin",
    "Toronto",
    "Los Angeles",
  ];
  const city = cities[Math.floor(Math.random() * cities.length)];
  getWeather(city);
}

window.onload = initializeApp;
