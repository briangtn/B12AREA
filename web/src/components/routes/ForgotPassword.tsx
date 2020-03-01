import React, { Component } from 'react';

import { connect } from "react-redux";

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../NavigationBar";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Translator from "../utils/Translator";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import IError from "../../interfaces/IError.interface";

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
    email: string,
    emailError: boolean,
    emailErrorMessage: string,
    resetted: boolean
}

const styles = (theme: Theme) => createStyles({
    field: {
        marginTop: '20px',
    },
    loginButton: {
        marginTop: '20px',
        width: '200px'
    },
});

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

class ForgotPassword extends Component<Props, State> {
    state: State = {
        email: '',
        emailError: false,
        emailErrorMessage: '',
        resetted: false
    };

    /**
     * Function called when a user type inside a text field
     * verify if the email is correct.
     *
     * @param e
     */
    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        if (value.match(/^\S+@\S+\.\S+$/)) {
            this.setState({ emailError: false });
        } else
            this.setState({ emailError: true });
        this.setState({ [id]: value } as unknown as Pick<State, keyof State>);
    };

    /**
     * Function called when a user press enter inside a text field
     *
     * @param e event triggered
     */
    keyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('resetPassword')

            if (toClick)
                toClick.click();
        }
    };

    /**
     * Function called when the user enter his email address then
     * press the reset password button.
     *
     * @param e event triggered
     */
    onSubmit = (e: React.FormEvent) => {
        const { email, emailError } = this.state;

        if (emailError) {
            this.setState({ emailErrorMessage: "Please enter a valid email" });
            return;
        }
        const { api_url } = this.props;
        const redirectURL: string = `${window.location.protocol}//${window.location.host}/reset_password?api_url=${api_url}`;

        fetch(`${api_url}/users/resetPassword`, {
            method: 'POST',
            body: JSON.stringify({ email: email, redirectURL: redirectURL }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({ resetted: true });
        })
        .catch((error: IError) => {
        })
    };

    componentDidMount() {
        if (this.props.token)
            this.props.history.push('/');
    }

    render() {
        const { classes } = this.props;
        const { resetted } = this.state;

        let componentRendered = null;

        if (resetted) {
            componentRendered = (
                <Typography variant="h4" gutterBottom>
                    <Translator sentence="resetPasswordEmailSent" />
                </Typography>
            );
        } else {
            componentRendered = (
                <div>
                    <Typography variant="h4" gutterBottom>
                        <Translator sentence="forgotPasswordLink" />
                    </Typography>
                    { this.state.emailErrorMessage }
                    <TextField
                        id="email"
                        label="Your email adress"
                        variant="outlined"
                        type="email"
                        className={classes.field}
                        value={this.state.email}
                        onChange={this.onChange}
                        onKeyDown={this.keyPress}
                        error={this.state.emailError}
                        required
                        fullWidth
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
        }
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
                        { componentRendered }
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(ForgotPassword));
