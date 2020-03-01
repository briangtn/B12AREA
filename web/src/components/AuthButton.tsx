import React, { Component } from "react";

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme, Snackbar } from "@material-ui/core";

import Button from '@material-ui/core/Button';
import Translator from './utils/Translator';
import { setToken } from "../actions/api.action";

import Alert from './utils/Alert';
import Utilities from "../utils/Utilities";

import Cookies from "universal-cookie";

const cookies = new Cookies();

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)) };
}

interface Props {
    apiUrl: string,
    serviceName: string,
    serviceIcon: any,
    classes: {
        imageButton: string
    },
    setToken: any,
    history: {
        push: any
    },
    token: string | null,
}

interface State {
    error: boolean,
    errorMessage: string
}

const styles = (theme: Theme) => createStyles({
    imageButton: {
        backgroundColor: '#FFFFFF',
    }
});

class AuthButton extends Component<Props, State> {
    state: State = {
        error: false,
        errorMessage: ''
    }

    launchAuthentication = (e: React.FormEvent) => {
        const { apiUrl, serviceName, token } = this.props;
        const requestUrl: string = `${apiUrl}/users/serviceLogin/${serviceName.toLowerCase()}?redirectURL=${window.location.origin + window.location.pathname}`;
        const headers: any = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        fetch(requestUrl, { headers: headers })
            .then(res => res.json())
            .then((data) => {
                const { url } = data;

                window.location.href = url;
            });
    };

    alertClose = (e: React.FormEvent) => {
        this.setState({ error: false });
    }

    componentDidMount() {
        const code: string | null = Utilities.getQueryParameter(window.location.href, 'code');
        const headers: any = {};
        const jwtToken = this.props.token;

        if (jwtToken) {
            headers['Authorization'] = `Bearer ${jwtToken}`
        }

        if (code && !this.state.error) {
            const { apiUrl } = this.props;
            const requestUrl: string = `${apiUrl}/data-code/${code}`;

            fetch(requestUrl, { headers: headers })
                .then((res) => {
                    return res.json()
                })
                .then((data) => {
                    const { token } = data;

                    if (token) {
                        cookies.set('token', token);
                        this.props.setToken(token);
                        this.props.history.push('/services');
                    } else {
                        const { error } = data;

                        if (error && typeof error !== 'object') {
                            this.setState({ errorMessage: error, error: true });
                        }
                    }
                });
        }
    }

    render() {
        const { classes, serviceName, serviceIcon } = this.props;

        return (
            <div>
                <Button
                    variant="contained"
                    className={classes.imageButton}
                    startIcon={serviceIcon}
                    disableElevation={true}
                    onClick={this.launchAuthentication}
                    >
                    <Translator sentence={`connect${serviceName}`} />
                    <Snackbar open={this.state.error} autoHideDuration={6000} onClose={this.alertClose}>
                        <Alert onClose={this.alertClose} severity="error">
                            { this.state.errorMessage }
                        </Alert>
                    </Snackbar>
                </Button>
            </div>
        );
    }
}

export default connect(null, mapDispatchToProps)(withStyles(styles)(AuthButton));
