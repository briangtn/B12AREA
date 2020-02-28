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
import ConfirmEmail from "./routes/ConfirmEmail";
import Profile from "./routes/Profile";
import CodeValidation from './routes/CodeValidation';

// Administration Routes

import AdministrationPanel from "./routes/administration/AdministrationPanel";

// React Redux

import { Provider } from 'react-redux';
import rootStore from "./store/rootStore.store";
import EmailValidation from "./routes/EmailValidation";
import Services from "./routes/Services";
import ForgotPassword from './routes/ForgotPassword';
import ResetPassword from './routes/ResetPassword';
import TokenRefresher from './components/TokenRefresher';
import ServiceDetails from './components/services/ServiceDetails';

import EasterEgg from "./components/EasterEgg";
import MobileWarner from "./components/MobileWarner";

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
                    <MobileWarner />
                    <EasterEgg />
                    <Router>
                        <Route exact path='/' component={App} />
                        <Route path='/join' component={Join} />
                        <Route path='/login' component={Login} />
                        <Route path='/forgot' component={ForgotPassword} />
                        <Route path="/reset_password" component={ResetPassword} />
                        <Route path='/confirm_email' component={ConfirmEmail} />
                        <Route path='/profile' component={Profile} />
                        <Route path='/email_validation' component={EmailValidation} />
                        <Route path='/services' component={Services} />
                        <Route path='/services_detail' component={ServiceDetails} />
                        <Route path='/code_validator' component={CodeValidation} />

                        <Route path='/admin' component={AdministrationPanel} />

                        <Route path='/readinessProbe' component={ReadinessProbe} />
                        <Route path='/client.apk' component={ClientAPK} />
                    </Router>
                    <TokenRefresher />
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
