import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import OrDivider from "../components/OrDivider";
import Translator from "../components/Translator";

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import GoogleIcon from "../components/icons/GoogleIcon";
import TwitterIcon from '@material-ui/icons/Twitter';
import { setToken } from "../actions/api.action";
import MuiAlert from "@material-ui/lab/Alert/Alert";
import Snackbar from "@material-ui/core/Snackbar";

import Cookies from "universal-cookie";

const cookies = new Cookies();

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)) };
}

function Alert(props: any) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface Props {
    classes: {
        field: string,
        loginButton: string,
        imageButton: string
    },
    api_url: string,
    setToken: any,
    history: {
        push: any
    },
    token: string
}

interface State {
    email: string,
    password: string,
    error: string,
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
    imageButton: {
        backgroundColor: '#FFFFFF',
        fontSize: "8px",
        width: '150px'
    },
});

class Login extends Component<Props, State> {
    state: State = {
        email: '',
        password: '',
        error: 'false',
        errorMessage: ''
    };

    componentDidMount() : void {
        const { token } = this.props;

        if (token)
            this.props.history.push('/services');
    }

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        this.setState({ [id]: value } as Pick<State, keyof State>);
    };

    onClose = (e: React.SyntheticEvent): void => {
        this.setState({ error: 'false' });
    };

    onSubmit = (e: React.FormEvent) => {
        const { api_url } = this.props;
        const { email, password } = this.state;
        const payload : Object = { email: email, password: password };

        fetch(`${api_url}/users/login`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            const { token } = data;

            if (token) {
                cookies.set('token', token);
                this.props.setToken(token);
                this.props.history.push('/services');
            } else {
                const { error } = data;

                this.setState({ error: 'true', errorMessage: `${error.name}: ${error.message}` });
            }
        });
    };

    render() {
        const { email, password } = this.state;
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
                        <Typography variant="h3" gutterBottom><Translator sentence="signin" /></Typography>
                        <br />
                        <TextField
                            id="email"
                            label="Email"
                            variant="outlined"
                            className={classes.field}
                            value={email}
                            onChange={this.onChange}
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
                        <Button
                            variant="contained"
                            color="secondary"
                            className={classes.loginButton}
                            onClick={this.onSubmit}
                        >
                            <Translator sentence="signin" />
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
                                    <Translator sentence="connectGoogle" />
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    variant="contained"
                                    className={classes.imageButton}
                                    startIcon={<TwitterIcon />}
                                >
                                    <Translator sentence="connectTwitter" />
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

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Login));
