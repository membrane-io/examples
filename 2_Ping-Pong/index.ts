// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persist across program updates. Store data here.
import { nodes, root, state } from "membrane";

export const Root = {
  setup: () => {
    root.message.$subscribe(root.handler);
  },
  ping: async () => {
    console.log(`Ping!`);
    await root.message.$emit("Ping!");
  },
  pong: () => {
    console.log(`Pong!`);
  },
};

export async function handler({ event }) {
  if (event === "Ping!") {
    // Schedule a "pong" event 5 seconds in the future using the root node
    const time = new Date(new Date().getTime() + 5 * 1000);
    await root.pong.$invokeAt(time);
  }
}
