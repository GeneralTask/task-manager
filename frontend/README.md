Running with Expo:
The Expo build environment has some noticeable differences than react-scripts used with create-react-app. In order to start the expo application, run yarn start, then press 'w' to open the web app or 'i' to launch an iOS simulator. You can also run yarn web or yarn ios.

Writing platform specific code:
To write platform specific code, you can use the Platform library. There are examples on how to use Platform in this PR, but if the differences are substantial, then you can also use platform specific extensions. More information on that here: https://reactnative.dev/docs/platform-specific-code

Styling:
I laid out the styling in a way that I think is more scalable and easier to work with. I've coupled a lot of the styling constants from /frontend into objects. These objects could be destructed and used inside of the react-native style-sheets.
