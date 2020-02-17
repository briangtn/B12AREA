import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";

import Translator from "../components/Translator";

import TwoFactorAuthentication from "../components/profile/TwoFactorAuthentication";
import ChangePassword from "../components/profile/ChangePassword";

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
    fakey: string
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
        fakey: ''
    };

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const {id, value} = e.currentTarget;

        if (id === 'fakey' && (value.length === 7 || isNaN(value as any)))
            return;
        this.setState({[id]: value} as unknown as Pick<State, keyof State>);
    };

    componentDidMount(): void {
        const { api_url, token } = this.props;

        fetch(`${api_url}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
            this.setState({
                email: data.email,
                twoFactorAuthenticationEnabled: data.twoFactorAuthenticationEnabled
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
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Profile));
