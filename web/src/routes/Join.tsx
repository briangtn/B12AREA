import React, { Component } from 'react';

import { connect } from "react-redux";

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import OrDivider from "../components/OrDivider";
import Translator from "../components/Translator";

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import GoogleIcon from "../components/icons/GoogleIcon";
import TwitterIcon from '@material-ui/icons/Twitter';

import AuthButton from "../components/AuthButton";

function Alert(props: any) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

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
    },
    history: {
        push: any
    },
    api_url: string,
    token: string
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
        const { location, token } = this.props;

        if (token) this.props.history.push('/services');
        if (location.state) this.setState({email: (location.state.email) ? location.state.email : ''});
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
        const { email, password, confirm_password } = this.state; // Parameters
        let error : boolean = false;
        let errorMessage : string = '';

        if (password !== confirm_password) {
            error = true;
            errorMessage = "Those passwords didn't match. Try again.";
        }

        if (this.state.email_error === 'true') {
            error = true;
            errorMessage = "This email isn't valid. Try again.";
        }

        if (password === '' && confirm_password === '' && email === '') {
            error = true;
            errorMessage = "Please fill all fields";
        }

        if (email !== '' && confirm_password === '' && password === '') {
            error = true;
            errorMessage = 'Enter a password';
        }

        if (email === '' && confirm_password !== '' && password !== '') {
            error = true;
            errorMessage = 'Enter your email address';
        }

        if (error)
            this.setState({ error: 'true', errorMessage: errorMessage });
        else {
            const { api_url } = this.props;
            const { email, password } = this.state;
            const payload : Object = { email: email, password: password };
            const redirectURL : string = `${window.location.protocol}//${window.location.host}/email_validation?api_url=${api_url}`;

            fetch(api_url + `/users/register?redirectURL=${redirectURL}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            }).then((res) => {
                if (res.status === 200)
                    this.props.history.push('/confirm_email');
                else
                    return res.json();
            }).then((data) => {
                if (data)
                    this.setState({ error: 'true', errorMessage: `${data.error.name}: ${data.error.message}` });
            });
        }
    };

    onClose = (e: React.SyntheticEvent): void => {
        this.setState({ error: 'false' });
    };

    keyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('signup')

            if (toClick)
                toClick.click();
        }
    }

    render() {
        const { email, password, confirm_password, email_error} = this.state;
        const { classes } = this.props;

        return (
            <div>
                <NavigationBar history={this.props.history} />
                <div
                    style={{
                        position: 'absolute',
                        paddingTop: '50px',
                        left: '50%',
                        transform: 'translate(-50%)',
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h3" gutterBottom><Translator sentence="signup" /></Typography>
                    <br />
                    <TextField
                        id="email"
                        label="Email"
                        variant="outlined"
                        className={classes.field}
                        value={email}
                        onChange={this.onChange}
                        onKeyDown={this.keyPress}
                        error={ (email_error !== 'false') }
                        required
                        fullWidth
                    />
                    <br />
                    <TextField
                        id="password"
                        label="Password"
                        variant="outlined"
                        type="password"
                        onKeyDown={this.keyPress}
                        className={classes.field}
                        value={password}
                        onChange={this.onChange}
                        required
                        fullWidth
                    />
                    <br />
                    <TextField
                        id="confirm_password"
                        label="Confirm Password"
                        variant="outlined"
                        type="password"
                        onKeyDown={this.keyPress}
                        className={classes.field}
                        value={confirm_password}
                        onChange={this.onChange}
                        required
                        fullWidth
                    />
                    <br />
                    <Button
                        id="signup"
                        variant="contained"
                        color="secondary"
                        className={classes.signupButton}
                        onClick={this.onSubmit}
                    >
                        <Translator sentence="signup" />
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
                </div>
                <Snackbar open={(this.state.error !== 'false')} autoHideDuration={6000} onClose={this.onClose}>
                    <Alert onClose={this.onClose} severity="error">
                        { this.state.errorMessage }
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Join));

