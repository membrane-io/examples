// `nodes` contain any nodes you add from the graph (dependencies)
// `root` is a reference to this program's root node
// `state` is an object that persists across program updates. Store data here.
import { nodes, root, state } from "membrane";

export async function endpoint({ args: { path, body } }) {
  switch (path) {
    case "/webhook":
      {
        const { action, workflow_job, repository } = JSON.parse(body);
        if (action === "completed" && workflow_job.conclusion === "failure") {
          const message = `The ${workflow_job.workflow_name} workflow in the ${repository.full_name} repository was cancelled due to a failure caused by ${workflow_job.name}.`;
          // Send a sms message
          await nodes.sms.send({ message });
        }
      }
      return JSON.stringify({ status: 200 });
    default:
      console.log("Unknown Endpoint:", path);
  }
}
