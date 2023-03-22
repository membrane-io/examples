// `state` can be used to persist any JavaScript value across updates
// `root` is a reference to the root node of this program
// `nodes` contains any nodes you add from the graph
import { root, nodes } from "membrane";

export async function setup() {
  // Generates report every Friday at 5PM
  root.report.$invokeAtCron(`0 0 17 ? * FRI`)
}
export async function report({ args: { org } }) {
  // Get the current time and the time one week ago in ISO format
  const currentTime = new Date();
  const oneWeekAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const isoCurrentTime = currentTime.toISOString();
  const isoOneWeekAgo = oneWeekAgo.toISOString();

  // Create a new Google Doc
  const doc = await nodes.gdocs.documents.create({ title: `Last Week Report - ${splitDate(isoCurrentTime)}` }).$invoke();

  // Insert the report title
  await doc.insertText({ text: `Weekly Report (${splitDate(isoOneWeekAgo)} to ${splitDate(isoCurrentTime)})\n\n\n` }).$invoke();
  await doc.insertText({ text: `Issues and Pull Requests:\n\n` });

  // Issues and pull requests created within the last week
  const issuesAndPrQuery = `org:${org}+created:${isoOneWeekAgo}..${isoCurrentTime}`;
  const issuesAndPr = await nodes.github.search.issues({ q: issuesAndPrQuery }).$query(`{ items { html_url title created_at user {login}}}`);

  for (let event of issuesAndPr.items!) {
    await doc.insertText({ text: `${event.user!.login}: ${splitDate(event.created_at!)} - ` }).$invoke();
    await doc.insertLink({ text: `${event.title}\n`, url: event.html_url });
  }

  // Commits made within the last week
  const commitsQuery = `org:${org}+committer-date:${isoOneWeekAgo}..${isoCurrentTime}`;
  const commits = await nodes.github.search.commits({ q: commitsQuery }).$query(`{ items { sha html_url message date author {login}}}`);

  await doc.insertText({ text: `\nCommits Summary:\n` });
  for (let event of commits.items!) {
    await doc.insertBullet({ text: `${event.author!.login}: ${splitDate(event.date!)} - ` });
    await doc.insertLink({ text: `${event.message!.replace(/\n/g, "")}`, url: event.html_url });
  }
}

// return only the date portion
function splitDate(date: string): string {
  return date.split("T")[0];
}
