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
import ClientAPK from "./routes/ClientAPK";

import Join from "./routes/Join";
import Login from "./routes/Login";

// React Redux

import { Provider } from 'react-redux';
import rootStore from "./store/rootStore.store";

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
            <Provider store={rootStore}>
                <MuiThemeProvider theme={ this.state.theme }>
                    <Router>
                        <Route exact path='/' component={App} />
                        <Route path='/join' component={Join} />
                        <Route path='/login' component={Login} />
                        <Route path='/readinessProbe' component={ReadinessProbe} />
                        <Route path='/client.apk' component={ClientAPK} />
                    </Router>
                </MuiThemeProvider>
            </Provider>
        );
    }
}

ReactDOM.render(<RouterComponent />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
