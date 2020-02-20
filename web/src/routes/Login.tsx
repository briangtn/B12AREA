import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import { Link } from 'react-router-dom';
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
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Dialog from "@material-ui/core/Dialog";

import AuthButton from "../components/AuthButton";

const cookies = new Cookies();

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)) };
}

function Alert(props: any) {
    return <MuiAlert id='alert' elevation={6} variant="filled" {...props} />;
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
    errorMessage: string,
    fakey: string,
    faopen: boolean,
    tmptoken: string
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
        errorMessage: '',
        fakey: '',
        faopen: false,
        tmptoken: ''
    };

    componentDidMount() : void {
        const { token } = this.props;

        if (token)
            this.props.history.push('/services');
    }

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        if (id === 'fakey' && (value.length === 7 || isNaN(value as any)))
            return;
        this.setState({ [id]: value } as unknown as Pick<State, keyof State>);
    };

    dialogClose = (e: React.SyntheticEvent): void => {
        this.setState({ faopen: false });
    };

    onClose = (e: React.SyntheticEvent): void => {
        this.setState({ error: 'false' });
    };

    dialogSubmit = (e: React.FormEvent) => {
        const { fakey, tmptoken } = this.state;
        const { api_url } = this.props;

        fetch(`${api_url}/users/2fa/validate`, {
            method: 'POST',
            body: JSON.stringify({ token: fakey }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tmptoken}` }
        })
            .then(res => res.json())
            .then((data) => {
                const { token } = data;

                if (token) {
                    cookies.set('token', token);
                    this.props.setToken(token);
                    this.props.history.push('/services');
                } else {
                    const {error} = data;

                    this.setState({error: 'true', errorMessage: `${error.name}: ${error.message}`});
                }
            });
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
            const { require2fa, token } = data;

            if (!require2fa) {
                if (token) {
                    cookies.set('token', token);
                    this.props.setToken(token);
                    this.props.history.push('/services');
                } else {
                    const {error} = data;

                    this.setState({error: 'true', errorMessage: `${error.name}: ${error.message}`});
                }
            } else {
                this.setState({ faopen: true, tmptoken: token });
            }
        });
    };

    loginKeyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('signin')

            if (toClick)
                toClick.click();
        }
    }

    faKeyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('fa-submit')

            if (toClick)
                toClick.click();
        }
    }

    render() {
        const { email, password } = this.state;
        const { classes } = this.props;

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
                            onKeyDown={this.loginKeyPress}
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
                            onKeyDown={this.loginKeyPress}
                            required
                        />
                        <br />
                        <br />
                        <Link to={{ pathname: '/forgot' }} style={{ textDecoration: 'none', color: '#212121' }}>
                            <Translator sentence="forgotPasswordLink" />
                        </Link>
                        <Button
                            id="signin"
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
                                <AuthButton token={null} history={this.props.history} apiUrl={this.props.api_url} serviceName="Google" serviceIcon={<GoogleIcon />} />
                            </Grid>
                            <Grid item xs={6}>
                                <AuthButton token={null} history={this.props.history} apiUrl={this.props.api_url} serviceName="Twitter" serviceIcon={<TwitterIcon />} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Dialog
                    open={this.state.faopen}
                    onClose={this.dialogClose}
                >
                    <DialogContent>
                        <Typography variant="h5" gutterBottom><Translator sentence="twoFactorEnabled" /></Typography>
                        <Typography variant="body1"><Translator sentence="twoFactorEnabledSub" /></Typography>
                        <TextField
                            id="fakey"
                            label="Your Code"
                            variant="outlined"
                            className={classes.field}
                            value={this.state.fakey}
                            onChange={this.onChange}
                            onKeyDown={this.faKeyPress}
                            fullWidth
                            style={{ left: '15%' }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.dialogClose} color="primary">
                            <Translator sentence="cancel" />
                        </Button>
                        <Button id="fa-submit" onClick={this.dialogSubmit} color="primary" autoFocus>
                            <Translator sentence="signin" />
                        </Button>
                    </DialogActions>
                </Dialog>
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
