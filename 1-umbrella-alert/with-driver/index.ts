// `state` can be used to persist any JavaScript value across updates
// `root` is a reference to the root node of this program
// `nodes` contains any nodes you add from the graph
import { nodes, root, state } from "membrane";

export const Root = {
  async status() {
    const { status } = state;
    if (!status) {
      return "Invoke `:configure` first";
    }
    return status;
  },

  async configure() {
    // Check every day at 7 AM
    await root.checkWeather().$invokeAtCron(`0 0 7 * * *`);
    state.status = "Configured";
  },

  async checkWeather() {
    const hourlyForecast = await nodes.weather.hourly.items.$query(`{ weather { id } }`);
    const rainToday = hourlyForecast
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
