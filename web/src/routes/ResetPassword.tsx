import React, { Component } from 'react';

import { connect } from "react-redux";

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Translator from "../components/Translator";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import Alert from '../components/Alert';

import Snackbar from "@material-ui/core/Snackbar";

import { changeApiUrl } from "../actions/api.action";

import Cookies from "universal-cookie";

const cookies = new Cookies();

interface Props {
    history: {
        push: any
    },
    classes: {
        field: string,
        loginButton: string
    },
    token: string,
    api_url: string
}

interface State {
    passwordMatched: boolean,
    resetToken: string,
    password: string,
    confirmPassword: string,
    error: boolean,
    errorMessage: string
}

const styles = (theme: Theme) => createStyles({
    field: {
        marginTop: '20px',
        width: '300px'
    },
    loginButton: {
        marginTop: '20px',
        width: '200px'
    },
});

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

function mapDispatchToProps(dispatch: any) {
    return { changeApiUrl: (token: object) => dispatch(changeApiUrl(token)) };
}

class ResetPassword extends Component<Props, State> {
    state: State = {
        password: '',
        confirmPassword: '',
        passwordMatched: false,
        resetToken: '',
        error: false,
        errorMessage: ''
    };

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        this.setState({ [id]: value } as unknown as Pick<State, keyof State>);
    };

    componentDidMount() {
        const getUrlParameter = (name : string) : string | null => {
            const url = window.location.href;
            name = name.replace(/[\]]/g, '\\$&');
            let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        };

        if (this.props.token)
            this.props.history.push('/');
        // TODO Set api URL
        const queryToken: string | null = getUrlParameter('token');
        if (queryToken)
            this.setState({ resetToken: queryToken });
    }

    keyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('resetPassword')

            if (toClick)
                toClick.click();
        }
    }

    onSubmit = (e: React.FormEvent) => {
        const { password, confirmPassword, resetToken } = this.state;
        const { api_url } = this.props;

        if (password !== confirmPassword)
            this.setState({ error: true, errorMessage: "Password doesn't match" });
        else {
            fetch(`${api_url}/users/resetPassword`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ token: resetToken, password: password })
            }).then(res => res.json())
            .then((data) => {
                const { error } = data;

                if (error)
                    this.setState({ error: true, errorMessage: `${error["name"]}: ${error["message"]}` });
                else
                    this.setState({ passwordMatched: true });
                });
        }
    };

    onClose = (e: React.SyntheticEvent): void => {
        this.setState({ error: false });
    };

    render() {
        const { classes } = this.props;
        const { passwordMatched } = this.state;
        let componentRendered = null;

        if (passwordMatched)
            componentRendered = (
                <div>
                    <Typography variant="h4" gutterBottom>
                        <Translator sentence="resetPasswordConfirmation" />
                    </Typography>
                </div>
            );
        else
            componentRendered = (
                <div>
                    <Typography variant="h4" gutterBottom>
                        <Translator sentence="resetPassword" />
                    </Typography>
                    <TextField
                        id="password"
                        label="Password"
                        variant="outlined"
                        type="password"
                        className={classes.field}
                        value={this.state.password}
                        onChange={this.onChange}
                        onKeyDown={this.keyPress}
                        required
                    />
                    <br />
                    <TextField
                        id="confirmPassword"
                        label="Confirm Password"
                        variant="outlined"
                        type="password"
                        className={classes.field}
                        value={this.state.confirmPassword}
                        onChange={this.onChange}
                        onKeyDown={this.keyPress}
                        required
                    />
                    <br />
                    <Button
                        id="resetPassword"
                        variant="contained"
                        color="secondary"
                        className={classes.loginButton}
                        onClick={this.onSubmit}
                    >
                        <Translator sentence="resetPassword" />
                    </Button>
                </div>
            );
        return (
            <div>
                <NavigationBar history={this.props.history} />
                <Grid
                    container
                    spacing={0}
                    direction='column'
                    alignItems='center'
                    justify='center'
                    style={{ marginTop: '-50px', minHeight: '100vh', textAlign: 'center' }}
                >
                    <Grid item xs={6}>
                        {componentRendered}
                    </Grid>
                </Grid>
                <Snackbar open={this.state.error} autoHideDuration={6000} onClose={this.onClose}>
                    <Alert onClose={this.onClose} severity="error">
                        { this.state.errorMessage }
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ResetPassword));