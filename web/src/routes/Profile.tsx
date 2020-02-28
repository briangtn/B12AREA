import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme, Button } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";

import Translator from "../components/Translator";

import TwoFactorAuthentication from "../components/profile/TwoFactorAuthentication";
import ChangePassword from "../components/profile/ChangePassword";
import GoogleIcon from "../components/icons/GoogleIcon";
import TwitterIcon from '@material-ui/icons/Twitter';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';

import Grid from '@material-ui/core/Grid';

import AuthButton from "../components/AuthButton";

import { Link } from 'react-router-dom';

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

interface Props {
    history: {
        push: any
    },
    classes: {
        section: string,
        field: string
    },
    api_url: string,
    token: string
}

interface State {
    email: string,
    twoFactorAuthenticationEnabled: boolean,
    qrcode: string,
    fasecret: string | null,
    open: boolean,
    fakey: string,
    authServices: any,
    roles: string[]
}

const styles = (theme: Theme) => createStyles({
    section: {
        padding: '20px',
        borderBottom: '3px solid #f5f5f5',
    },
    field: {
        marginTop: '20px',
    }
});

class Profile extends Component<Props, State> {
    state: State = {
        email: '',
        twoFactorAuthenticationEnabled: false,
        qrcode: '',
        fasecret: '',
        open: false,
        fakey: '',
        authServices: [],
        roles: []
    };

    componentDidMount(): void {
        const { api_url, token } = this.props;

        fetch(`${api_url}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
            let tmp = [];
            if (data.authServices)
                for (let i of data.authServices) {
                    tmp.push(i.name);
                }
            this.setState({
                email: data.email,
                twoFactorAuthenticationEnabled: data.twoFactorAuthenticationEnabled,
                authServices: tmp,
                roles: data.role
            });
        });
    }

    render() {
        const { classes } = this.props;
        const { email, twoFactorAuthenticationEnabled } = this.state;

        return (
            <div>
                <NavigationBar history={this.props.history} />
                <div
                    style={{
                        position: 'absolute',
                        paddingTop: '50px',
                        left: '50%',
                        transform: 'translate(-50%)'
                    }}
                >
                    <Typography variant="h2" className={classes.section} gutterBottom><b><Translator sentence="accountSettings" /></b></Typography>
                    <div className={classes.section} style={{ textAlign: 'left' }}>
                        <Typography variant="h4" gutterBottom><b><Translator sentence="settingsAccountTitle" /></b></Typography>
                        <TextField
                            disabled
                            id="email"
                            label="Email"
                            variant="outlined"
                            className={classes.field}
                            value={email}
                            fullWidth
                        />
                    </div>
                    <div className={classes.section} style={{ textAlign: 'left' }}>
                        <Typography variant="h4" gutterBottom><b><Translator sentence="settingsChangePassword" /></b></Typography>
                        <ChangePassword />
                    </div>
                    <div className={classes.section} style={{ textAlign: 'left' }}>
                        <Typography variant="h4" gutterBottom><b><Translator sentence="settingsTwoFactor" /></b></Typography>
                        <br />
                        <TwoFactorAuthentication alreadyActivated={twoFactorAuthenticationEnabled} />
                    </div>
                    <div className={classes.section} style={{ textAlign: 'left' }}>
                        <Typography variant="h4" gutterBottom><b><Translator sentence="linkAccount"/></b></Typography>
                        <br />
                        <Grid container spacing={3}>
                            { (!this.state.authServices.includes('google')) ?
                                <Grid item xs={6}>
                                    <AuthButton token={this.props.token} history={this.props.history} apiUrl={this.props.api_url} serviceName="Google" serviceIcon={<GoogleIcon />} />
                                </Grid>
                            :
                                <div></div>
                            }
                            { (!this.state.authServices.includes('twitter')) ?
                                <Grid item xs={6}>
                                    <AuthButton token={this.props.token} history={this.props.history} apiUrl={this.props.api_url} serviceName="Twitter" serviceIcon={<TwitterIcon />} />
                                </Grid>
                            :
                                <div></div>
                            }
                        </Grid>
                    </div>
                    {
                        (this.state.roles.includes('admin')) ?
                        <Link
                            to={{pathname: '/admin'}}
                        >
                            <Button startIcon={<SupervisorAccountIcon />} style={{marginTop: '10px'}} id="getStarted" color="primary"><Translator sentence="goToAdmin" /></Button>
                        </Link>
                        :
                        <div></div>
                    }
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Profile));
