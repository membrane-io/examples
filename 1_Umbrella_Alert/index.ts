// `state` can be used to persist any JavaScript value across updates
// `root` is a reference to the root node of this program
// `nodes` contains any nodes you add from the graph
import { nodes, root, state } from "membrane";

const BASE_URL = "http://api.openweathermap.org";

export const Root = {
  async status() {
    if (!state.appId || !state.cityData) {
      return "Please invoke the :setup action first.";
    }
    return "Ready";
  },
  async setup({ args: { api_key, zip_code, country_code } }) {
    // Retrieve information about the given zip code and country code
    const response = await fetch(
      `${BASE_URL}/geo/1.0/zip?zip=${zip_code},${country_code}&appid=${api_key}`
    );
    const data = await response.json();
    // Save the retrieved city data and API key in the state object
    state.cityData = data;
    state.appId = api_key;
    // run every day at 7 AM
    await root.alert().$invokeAtCron(`0 0 7 * * *`)
  },
  async alert() {
    const { appId, cityData } = state;
    // Getting the current date and hour
    const currentDate = new Date();
    const hours = currentDate.getHours();
    // Setting the hour to 7 AM
    const dt = currentDate.setHours(7);
    const response = await fetch(
      `${BASE_URL}/data/2.5/onecall?dt=${dt}&lat=${cityData.lat}&lon=${cityData.lon}&exclude=,minutely,daily&appid=${appId}`
    );
    const data = await response.json();
    const forecastValues = data.hourly.slice(0, 24);
    const remainingHours = 24 - hours;
    // Forecast data to only include the remaining hours in the day
    const valuesForToday = forecastValues.slice(0, remainingHours);
    // Looping through the hourly forecast data to check for rain
    let rainForecastFound = false;
    for (const hourly of valuesForToday) {
      for (const weather of hourly.weather) {
        // If it's going to rain, send an SMS message and set the rain forecast flag to true
        if (weather.id >= 500 && weather.id <= 531) {
          const message = `It's going to rain today. Don't forget your umbrella! ☔️`;
          // send sms with the alert.
          await nodes.sms.send({ message });
          rainForecastFound = true;
          break;
        }
      }
      if (rainForecastFound) {
        break;
      }
    }
  },
};
