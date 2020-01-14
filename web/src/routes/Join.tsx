import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import OrDivider from "../components/OrDivider";

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import GoogleIcon from "../icons/GoogleIcon";
import TwitterIcon from '@material-ui/icons/Twitter';

function Alert(props: any) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface Props {
    location: {
        pathname: string,
        search: string,
        state: {
            email: string
        },
        key: string
    },
    classes: {
        root: string,
        field: string,
        signupButton: string,
        imageButton: string
    }
}

interface State {
    email: string,
    password: string,
    confirm_password: string,
    email_error: string,
    error: string,
    errorMessage: string
}

const styles = (theme: Theme) => createStyles({
    root: {
        textAlign: 'center',
    },
    field: {
        marginTop: '20px',
        width: '300px'
    },
    signupButton: {
        marginTop: '20px',
        width: '200px'
    },
    imageButton: {
        backgroundColor: '#FFFFFF',
        fontSize: "8px",
        width: '150px'
    },
});

class Join extends Component<Props, State> {
    state: State = {
        email: '',
        password: '',
        confirm_password: '',
        email_error: 'false',
        error: 'false',
        errorMessage: ''
    };

    componentDidMount(): void {
        const { location } = this.props;

        this.setState({ email: location.state.email });
    }

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        this.setState({[id]: value} as Pick<State, keyof State>);

        // Email verification
        if ((id === 'email' && value.match(/^\S+@\S+\.\S+$/) === null))
            this.setState({ email_error: 'true' });
        else
            this.setState({ email_error: 'false' });
    };

    onSubmit = (e: React.FormEvent) => {
        let error : boolean = false;
        let errorMessage : string = '';

        if (this.state.password !== this.state.confirm_password) {
            error = true;
            errorMessage = "Those passwords didn't match. Try again.";
        }

        if (this.state.email_error === 'true') {
            error = true;
            errorMessage = "This email isn't valid. Try again.";
        }

        if (this.state.password === '' && this.state.confirm_password === '' && this.state.email === '') {
            error = true;
            errorMessage = "Please fill all fields";
        }

        if (this.state.email !== '' && this.state.confirm_password === '' && this.state.password === '') {
            error = true;
            errorMessage = 'Enter a password';
        }

        if (this.state.email === '' && this.state.confirm_password !== '' && this.state.password !== '') {
            error = true;
            errorMessage = 'Enter your email address';
        }

        if (error)
            this.setState({ error: 'true', errorMessage: errorMessage });
        else {
            // Do a flip
        }
    };

    onClose = (e: React.SyntheticEvent): void => {
        this.setState({ error: 'false' });
    };

    render() {
        const { email, password, confirm_password, email_error} = this.state;
        const { classes } = this.props;

        return (
            <div>
                <NavigationBar />
                <Grid
                    container
                    spacing={0}
                    direction='column'
                    alignItems='center'
                    justify='center'
                    style={{ marginTop: '-50px', minHeight: '100vh', textAlign: 'center' }}
                >
                    <Grid item xs={3}>
                        <Typography variant="h3" gutterBottom>Sign Up</Typography>
                        <br />
                        <TextField
                            id="email"
                            label="Email"
                            variant="outlined"
                            className={classes.field}
                            value={email}
                            onChange={this.onChange}
                            error={ (email_error !== 'false') }
                            required
                        />
                        <br />
                        <TextField
                            id="password"
                            label="Password"
                            variant="outlined"
                            type="password"
                            className={classes.field}
                            value={password}
                            onChange={this.onChange}
                            required
                        />
                        <br />
                        <TextField
                            id="confirm_password"
                            label="Confirm Password"
                            variant="outlined"
                            type="password"
                            className={classes.field}
                            value={confirm_password}
                            onChange={this.onChange}
                            required
                        />
                        <br />
                        <Button
                            variant="contained"
                            color="secondary"
                            className={classes.signupButton}
                            onClick={this.onSubmit}
                        >
                            Sign Up
                        </Button>
                        <br />
                        <OrDivider />
                        <br />
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Button
                                    variant="contained"
                                    className={classes.imageButton}
                                    startIcon={<GoogleIcon />}
                                >
                                    Connect with Google
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    variant="contained"
                                    className={classes.imageButton}
                                    startIcon={<TwitterIcon />}
                                >
                                    Connect with Twitter
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Snackbar open={(this.state.error !== 'false')} autoHideDuration={6000} onClose={this.onClose}>
                    <Alert onClose={this.onClose} severity="error">
                        { this.state.errorMessage }
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}

export default withStyles(styles)(Join);

