# Record bin lambda function

A Serverless function that can manage backups and restoration of records through its API.

The lambda function can be deployed on Vercel in one click by [using this link](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmarcelofinamorvieira%2Frecord-bin-lambda-function&env=DATOCMS_FULLACCESS_API_TOKEN&project-name=datocms-record-bin-lambda-function&repo-name=datocms-record-bin-lambda-function)

It is intended to be used with the [record bin DatoCMS plugin](https://github.com/marcelofinamorvieira/datocms-plugin-record-bin)

# Usage

After deploying the project on Vercel, and adding the API Token from your DatoCMS project the API will be available to interact with the plugin.

Then, insert the deployed URL on the plugin installation process. The plugin will send a call to that URL that will make the plugin create a webhook, on your DatoCMS project that will manage and create a "Bin record" for every deleted record on that project.
The function also makes available a "restore" call, that is used by the plugin to restore "Bin records" through the button directly on the dashboard.

For more detailed information on usage refer to the [record bin documentation page](https://github.com/marcelofinamorvieira/datocms-plugin-record-bin)
