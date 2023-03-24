// `state` can be used to persist any JavaScript value across updates
// `root` is a reference to the root node of this program
// `nodes` contains any nodes you add from the graph
import { nodes, root, state } from "membrane";

const BASE_URL = "http://api.openweathermap.org";

export const Root = {
  async status() {
    if (!state.appId || !state.cityData) {
      return "Please invoke the :configure action first.";
    }
    return "Ready";
  },

  async configure({ args: { apiKey, zipCode, countryCode } }) {
    // Retrieve lat/lon for the given zip/country code
    const params = new URLSearchParams({
      zip: zipCode,
      countryCode: countryCode,
      appid: apiKey,
    });
    const res = await fetch(`${BASE_URL}/geo/1.0/zip?${params}`);

    if (res.status !== 200) {
      throw new Error(`Could not fetch city data: ${res.text()}`);
    }

    // Save the retrieved city data and API key in the state object
    state.cityData = await res.json();
    state.apiKey = apiKey;

    // Check every day at 7 AM
    await root.checkWeather().$invokeAtCron(`0 0 7 * * *`);
  },

  async checkWeather() {
    // Fetch the weather data for our location
    // More info: https://openweathermap.org/api/one-call-api
    const params = new URLSearchParams({
      dt: Date.now().toString(),
      lat: state.cityData.lat,
      lon: state.cityData.lon,
      exclude: "minutely,daily",
      appid: state.apiKey,
    });
    const res = await fetch(`${BASE_URL}/data/2.5/onecall?${params}`);

    if (res.status !== 200) {
      throw new Error(`Could not fetch weather data: ${res.text()}`);
    }

    // Will it rain at any point between now and 8 PM? (in the next 13h)
    const body = await res.json();
    const rainToday = body.hourly
      .slice(0, 13)
      .flatMap((hour) => hour.weather)
      .some(isRainyWeather);

    if (rainToday) {
      const message = `☔ It'll rain today. Don't forget your umbrella!`;
      await nodes.sms.send({ message });
    }
  },
};

// Anything between 200 and 600 is considered "rainy"
// See https://openweathermap.org/weather-conditions
function isRainyWeather(weather) {
  return weather.id >= 200 && weather.id < 600;
}
