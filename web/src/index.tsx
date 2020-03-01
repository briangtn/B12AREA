import React from 'react';
import ReactDOM from 'react-dom';

import { Route, BrowserRouter as Router } from 'react-router-dom';
import { createMuiTheme } from "@material-ui/core";
import { MuiThemeProvider } from "@material-ui/core/styles";

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// Routes

import ReadinessProbe from "./components/routes/ReadinessProbe";
import ClientAPK from "./components/routes/ClientAPK";

import Join from "./components/routes/Join";
import Login from "./components/routes/Login";
import ConfirmEmail from "./components/routes/ConfirmEmail";
import Profile from "./components/routes/Profile";
import CodeValidation from './components/routes/CodeValidation';

// Administration Routes

import AdministrationPanel from "./components/routes/administration/AdministrationPanel";

// React Redux

import { Provider } from 'react-redux';
import rootStore from "./store/rootStore.store";
import EmailValidation from "./components/routes/EmailValidation";
import Services from "./components/routes/Services";
import ForgotPassword from './components/routes/ForgotPassword';
import ResetPassword from './components/routes/ResetPassword';
import TokenRefresher from './components/utils/TokenRefresher';
import ServiceDetails from './components/services/ServiceDetails';

import EasterEgg from "./components/utils/EasterEgg";
import MobileWarner from "./components/utils/MobileWarner";
import InpersonateBar from "./components/utils/InpersonateBar";

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
                    <InpersonateBar />
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
