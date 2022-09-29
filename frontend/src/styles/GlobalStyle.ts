import { createGlobalStyle } from 'styled-components'
import { Colors } from '.'

const GlobalStyle = createGlobalStyle`
    :root {
       --animate-duration: 250ms !important;
    }
    html,
    body {
        height: 100%;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
            Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    }
    button,
    input,
    textarea {
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
            Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    }
    a {
        color: ${Colors.text.purple};
    }
    #event-details-popup {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 100;
    }
    .__react_component_tooltip.show {
        opacity: 1 !important;
    }

`

// have to override the type until @types/styled-components is updated
export default GlobalStyle as unknown as React.FC
