A project that I spent around 10 days working on that allowed anyone to upload their youtube video by logging into their youtube account through OAUth information (including their dislike count) to a database that allowed people to publicly access that information using an API

While it was an interesting project to work on and a learning experience, I've decided to stop working on it as of Linustechtips' new video talking about Return Youtube Dislike where they mentioned how they've already got such a system in place

For anyone who wants to try running this, download the source, run `npm i` to fetch all the packages, then create a new Google Cloud project using the "Youtube Data v3" API. Create an Oauth client ID and an API key

Create a MongoDB database with the collection "youtube" inside of it. In .env.local, `MONGODB_URI_SHORT` is the link to the DB while `MONGODB_URI` is the link including the collection. `MONGODB_DB` is the collection name "youtube"

Configure Nextauth by setting the URL and a secret

Anyway time to go back to modding games bye
