import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import NavigationBar from "../components/NavigationBar";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

import QRCode from 'qrcode';
import Dialog from "@material-ui/core/Dialog";
import Grid from "@material-ui/core/Grid";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Translator from "../components/Translator";

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

    onClose = (e: any) => {
        this.setState({ open: false });
    };

    onSubmit = (e: React.FormEvent) => {
        const { id } = e.currentTarget;
        const { api_url, token } = this.props;

        if (id === "fa-submit") {
            const { fakey } = this.state;

            fetch(`${api_url}/users/2fa/activate`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
                body: JSON.stringify({ "token": fakey }),
            })
            .then(res => res.json())
            .then((data) => {
                this.setState({
                    twoFactorAuthenticationEnabled: data.twoFactorAuthenticationEnabled,
                    open: false
                });
            })
        }
    };

    onClick = (e: React.FormEvent) => {
        const { api_url, token } = this.props;

        const getUrlParameter = (url : string, name : string) : string | null => {
            name = name.replace(/[\]]/g, '\\$&');
            let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, ' '));
        };

        fetch(`${api_url}/users/2fa/activate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then((data) => {
                const otpUrl : string = data.otpauthUrl;

                QRCode.toDataURL(otpUrl).then(url => {
                    this.setState({ qrcode: url, open: true, fasecret: getUrlParameter(otpUrl, 'secret') });
                });
            });
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
        const { email, twoFactorAuthenticationEnabled, fakey } = this.state;

        let twoFactorAuth = {};

        if (twoFactorAuthenticationEnabled) {
            twoFactorAuth = (
                <div>
                    two factor is enabled
                </div>
            );
        } else {
            twoFactorAuth = (
                <div>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={this.onClick}
                    >
                        <Translator sentence="settingsEnableTwoFactor" />
                    </Button>
                    <Dialog
                        open={this.state.open}
                        onClose={this.onClose}
                    >
                        <DialogContent>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <img alt='two-fa-qrcode' src={this.state.qrcode} />
                                </Grid>
                                <Grid item xs={6} style={{ overflowWrap: 'break-word' }}>
                                    <br />
                                    <Typography gutterBottom>
                                        <Translator sentence="troubleToScan" />
                                    </Typography>
                                    <Typography gutterBottom>
                                        <b><Translator sentence="yourKey" /></b> {this.state.fasecret}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <TextField
                                id="fakey"
                                label="Your Key"
                                variant="outlined"
                                className={classes.field}
                                value={fakey}
                                onChange={this.onChange}
                                fullWidth
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.onClose} color="primary">
                                <Translator sentence="cancel" />
                            </Button>
                            <Button id="fa-submit" onClick={this.onSubmit} color="primary" autoFocus>
                                <Translator sentence="save" />
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            );
        }

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
                        <Typography variant="h4" gutterBottom><b><Translator sentence="settingsTwoFactor" /></b></Typography>
                        <br />
                        { twoFactorAuth }
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Profile));
