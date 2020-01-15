import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import OrDivider from "../components/OrDivider";

import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import GoogleIcon from "../components/icons/GoogleIcon";
import TwitterIcon from '@material-ui/icons/Twitter';

interface Props {
    classes: {
        field: string,
        loginButton: string,
        imageButton: string
    }
}

interface State {
    email: string,
    password: string
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
        password: ''
    };

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        this.setState({ [id]: value } as Pick<State, keyof State>);
    };

    onSubmit = (e: React.FormEvent) => {
        console.log('submitted');
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
                        <Typography variant="h3" gutterBottom>Sign In</Typography>
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
                            Sign In
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
            </div>
        );
    }
}

export default withStyles(styles)(Login);
