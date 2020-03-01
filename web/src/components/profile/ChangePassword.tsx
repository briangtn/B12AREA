import React, { Component } from "react";

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

import Translator from "../utils/Translator";

interface Props {
    api_url: string,
    token: string,
    classes: {
        field: string,
        confirmButton: string
    }
}

interface State {
    newPassword: string,
    newPasswordConfirmation: string,
    newPasswordDontMatch: boolean,
    validationMessage: string
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

const styles = (theme: Theme) => createStyles({
    field: {
        marginTop: '20px',
    },
    confirmButton: {
        marginTop: '20px'
    }
});
class ChangePassword extends Component<Props, State> {
    state: State = {
        newPassword: '',
        newPasswordConfirmation: '',
        newPasswordDontMatch: false,
        validationMessage: ''
    }

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;
        const { newPassword, newPasswordConfirmation } = this.state;

        this.setState({[id]: value} as unknown as Pick<State, keyof State>);

        if (id === 'newPassword' && value !== newPasswordConfirmation) {
            this.setState({ newPasswordDontMatch: true });
        } else if (id === 'newPasswordConfirmation' && value !== newPassword) {
            this.setState({ newPasswordDontMatch: true });
        } else {
            this.setState({ newPasswordDontMatch: false });
        }
    };

    onSubmit = (e: React.FormEvent) => {
        const { api_url, token } = this.props;
        const { newPassword, newPasswordConfirmation } = this.state;

        if (newPassword !== newPasswordConfirmation)
            return;
        fetch(`${api_url}/users/me`, {
            method: 'PATCH',
            body: JSON.stringify({ password: newPassword }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then((data) => {
            const { email } = data;

            if (email)
                this.setState({ validationMessage: "Your password has been updated", newPassword: '', newPasswordConfirmation: '' });
        });
    };

    keyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('signin')

            if (toClick)
                toClick.click();
        }
    };

    render() {
        const { classes } = this.props;
        const { newPassword, newPasswordConfirmation, newPasswordDontMatch, validationMessage } = this.state;

        return (
            <div>
                <div style={{color: '#2ecc71'}}>{ validationMessage }</div>
                <TextField
                    type="password"
                    id="newPassword"
                    label="New Password"
                    variant="outlined"
                    className={classes.field}
                    value={newPassword}
                    onChange={this.onChange}
                    error={newPasswordDontMatch}
                    onKeyDown={this.keyPress}
                    fullWidth
                />
                <TextField
                    type="password"
                    id="newPasswordConfirmation"
                    label="Confirm your new password"
                    variant="outlined"
                    className={classes.field}
                    value={newPasswordConfirmation}
                    onChange={this.onChange}
                    error={newPasswordDontMatch}
                    onKeyDown={this.keyPress}
                    fullWidth
                />
                <Button
                    id="signin"
                    variant="contained"
                    color="secondary"
                    className={classes.confirmButton}
                    onClick={this.onSubmit}
                >
                    <Translator sentence="settingsChangePassword" />
                </Button>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(ChangePassword));
