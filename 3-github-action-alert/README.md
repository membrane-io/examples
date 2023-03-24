## GitHub Workflow Alert

This program checks if a workflow job has failed, and if so, it sends a text message with information about the failure.

### Usage

1: Enable webhooks in your repository settings.

2: Add the program `${endpoint_url}/webhook` to the `Payload URL` and set the content type to "application/json".

3: Select `individual events` and check the `workflow jobs` option.

### Dependencies
- [sms](https://github.com/membrane-io/directory)