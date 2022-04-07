Running with Expo:
The Expo build environment has some noticeable differences than react-scripts used with create-react-app. In order to start the expo application, run yarn start, then press 'w' to open the web app or 'i' to launch an iOS simulator. You can also run yarn web or yarn ios.

Writing platform specific code:
To write platform specific code, you can use the Platform library. There are examples on how to use Platform in this PR, but if the differences are substantial, then you can also use platform specific extensions. More information on that here: https://reactnative.dev/docs/platform-specific-code

Run the mock API server (make sure Go server is not running): `cd frontend/mockAPI/; json-server mock-api.json --watch --port 8080 --read-only --routes routes.json`

Test it out: `curl localhost:8080/tasks`

Edit the mock API contents in mock-api.json

---

# Deploy to Cloudflare:

1. Install <a href="https://developers.cloudflare.com/workers/cli-wrangler/install-update">wrangler</a>(Cloudflare CLI):

-   Recommended to use <a href="https://github.com/nvm-sh/nvm#installing-and-updating">nvm</a> to install Node.js if encountering issues with npm

2. `cd frontend/`

3. `yarn install`

4. Authenticate with cloudflare (get credentials from John): `wrangler login`

5. Ensure that routing is properly configured by adding `mapRequestToAsset: serveSinglePageApp` field to the worker-site configuration file. 

5. `yarn run build` - this builds with generaltask.com links built in

6. `npx wrangler publish`

7. Check out your work at https://generaltask.com
