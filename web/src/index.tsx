import React from 'react';
import ReactDOM from 'react-dom';

import { Route, BrowserRouter as Router } from 'react-router-dom';
import { createMuiTheme } from "@material-ui/core";
import { MuiThemeProvider } from "@material-ui/core/styles";

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// Routes

import ReadinessProbe from "./routes/ReadinessProbe";

interface Props {}

interface State {
    theme: object
}

class RouterComponent extends React.Component<Props, State> {
    state: State = {
        theme: createMuiTheme({
            palette: {
                primary: {
                    main: '#212121',
                    contrastText: "#fff"
                },
                secondary: {
                    main: '#FFBE76',
                    contrastText: "#000000"
                },
            }
        })
    };

    render() {
        return (
            <MuiThemeProvider theme={ this.state.theme }>
                <Router>
                    <Route exact path='/' component={App} />
                    <Route path='/readinessProbe' component={ReadinessProbe} />
                </Router>
            </MuiThemeProvider>
        );
    }
}

ReactDOM.render(<RouterComponent />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
