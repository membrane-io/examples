// `state` can be used to persist any JavaScript value across updates
// `root` is a reference to the root node of this program
// `nodes` contains any nodes you add from the graph
import { root, nodes, state } from "membrane";

export async function configure({ args: { org } }) {
  state.org = org;
  // Generates report every Friday at 5PM
  root.report.$invokeAtCron(`0 0 17 ? * FRI`);
}

export async function report() {
  // Get the current time and the time one week ago
  const [oneWeekAgo, currentTime] = getDateRangeString();

  const { org } = state;
  const doc = await nodes.gdocs.documents.create({
    title: `Last Week Report - ${currentTime}`,
  });

  await doc.insertText({
    text: `Weekly Report (${oneWeekAgo} to ${currentTime})\n\n`,
  });

  // Issues and pull requests created within the last week
  await doc.insertText({ text: `Issues and Pull Requests:\n\n` });
  const issuesAndPr = await nodes.github.search
    .issues({ q: `org:${org}+created:${oneWeekAgo}..${currentTime}` })
    .$query(`{ items { html_url title created_at user {login}}}`);
  for (let event of issuesAndPr.items!) {
    await doc.insertText({ text: `${event.user!.login}: ${event.created_at!} - ` });
    await doc.insertLink({ text: `${event.title}\n`, url: event.html_url });
  }

  // Commits made within the last week
  await doc.insertText({ text: `\nCommits Summary:\n` });
  const commits = await nodes.github.search
    .commits({ q: `org:${org}+committer-date:${oneWeekAgo}..${currentTime}` })
    .$query(`{ items { sha html_url message date author {login}}}`);
  for (let event of commits.items!) {
    await doc.insertBullet({ text: `${event.author!.login}: ${event.date!} - ` });
    await doc.insertLink({ text: `${event.message!.replace(/\n/g, "")}`, url: event.html_url });
  }
}

// Returns the current time and the time one week ago
function getDateRangeString(): string[] {
  const currentDate = new Date();
  const currentTime = currentDate.toISOString().slice(0, 10);
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return [oneWeekAgo, currentTime];
}
