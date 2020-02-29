import React, { Component } from 'react';

import { connect } from 'react-redux';
import {setAdminToken, setToken} from "../actions/api.action";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import Cookies from "universal-cookie";
import Typography from "@material-ui/core/Typography";

const cookies = new Cookies();

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)), setAdminToken: (adminToken: object) => dispatch(setAdminToken(adminToken)) };
}

const mapStateToProps = (state: any) => {
    return { token: state.token, adminToken: state.adminToken, language: state.language };
};

interface State {}

interface Props {
    token: string,
    adminToken: string,
    setToken: any,
    setAdminToken: any,
    classes: {
        root: string
    },
    language: string
}

const styles = (theme: Theme) => createStyles({
    root: {
        width: '100%',
        backgroundColor: '#FFBE76',
        paddingTop: '2px',
        textAlign: 'center'
    }
});

class InpersonateBar extends Component<Props, State> {
    unimpersonateClickEvent = (e: any) => {
        const { adminToken, setToken, setAdminToken } = this.props;

        cookies.set('token', adminToken);
        setToken(adminToken);
        cookies.set('admin_token', '');
        setAdminToken('');

        window.location.reload();
    };

    render() {
        const { adminToken, classes, language } = this.props;

        let renderedText: any = null;
        if (language === "fr") {
            renderedText = (
                <Typography variant="body1">
                    {'Vous êtes entrain de vous faire passer pour un autre utilisateur cliquez '}
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a onClick={this.unimpersonateClickEvent} href="#" style={{color: 'black'}}>ici</a>
                    {' pour arrêter'}
                </Typography>
            );
        } else {
            renderedText = (
                <Typography variant="body1">
                    {'You are impersonating someone click '}
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a onClick={this.unimpersonateClickEvent} href="#" style={{color: 'black'}}>here</a>
                    {' to stop'}
                </Typography>
            );
        }

        if (adminToken) {
            return (
                <div className={classes.root}>
                    { renderedText }
                </div>
            );
        } else {
            return (
                <div />
            )
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(InpersonateBar))
