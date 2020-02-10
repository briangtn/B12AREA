import React, { Component } from "react";

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import TextField from "@material-ui/core/TextField";

interface Props {
    api_url: string,
    token: string,
    classes: {
        field: string
    }
}

interface State {
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

const styles = (theme: Theme) => createStyles({
    field: {
        marginTop: '20px',
    }
});

class ChangePassword extends Component<Props, State> {
    state: State = {
        oldPassword: '',
        newPassword: '',
        newPasswordConfirmation: ''
    }

    render() {
        const { classes } = this.props;
        const { oldPassword, newPassword, newPasswordConfirmation } = this.state;

        return (
            <div>
                <TextField
                    disabled
                    id="email"
                    label="Old Password"
                    variant="outlined"
                    className={classes.field}
                    value={oldPassword}
                    fullWidth
                />
                <TextField
                    disabled
                    id="email"
                    label="New Password"
                    variant="outlined"
                    className={classes.field}
                    value={newPassword}
                    fullWidth
                />
                <TextField
                    disabled
                    id="email"
                    label="Confirm your new password"
                    variant="outlined"
                    className={classes.field}
                    value={newPasswordConfirmation}
                    fullWidth
                />
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(ChangePassword));