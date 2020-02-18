import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import QRCode from 'qrcode';
import Dialog from "@material-ui/core/Dialog";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Translator from "../Translator";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

interface State {
    open: boolean,
    fakey: string,
    qrcode: string,
    fasecret: string | null,
    alreadyActivated: boolean
}

interface Props {
    alreadyActivated: boolean,
    api_url: string,
    token: string,
    classes: {
        field: string
    },
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

const styles = (theme: Theme) => createStyles({
    field: {
        marginTop: '20px',
    }
});

class TwoFactorAuthentication extends Component<Props, State> {
    state: State = {
        open: false,
        fakey: '',
        qrcode: '',
        fasecret: '',
        alreadyActivated: false
    }

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

    disableTwoFactorAuthentication = (e: React.FormEvent) => {
        const { api_url, token } = this.props;

        fetch(`${api_url}/users/me`, {
            method: 'PATCH',
            body: JSON.stringify({ disable2FA: true }),
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then((data) => {
            const { email } = data;

            if (email)
                this.setState({ alreadyActivated: false });
        })
    };

    componentDidMount() {
        const { alreadyActivated } = this.props;

        this.setState({ alreadyActivated: alreadyActivated });
    }

    render() {
        const { classes } = this.props;
        const { fakey } = this.state;
        const { alreadyActivated } = this.props;

        if (!alreadyActivated)
            return (
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
        else
            return (
                <div>
                    <Typography gutterBottom>
                        <Translator sentence="faActivated" />
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        className={classes.field}
                        onClick={this.disableTwoFactorAuthentication}
                    >
                        <Translator sentence="disable" />
                    </Button>
                </div>
            );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(TwoFactorAuthentication));