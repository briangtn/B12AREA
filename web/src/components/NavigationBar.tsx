import React, { Component } from 'react';

import { connect } from "react-redux";

import {withStyles, createStyles, Theme, Menu} from "@material-ui/core";

import { Link } from 'react-router-dom';

import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';

import LanguagePicker from "./utils/LanguagePicker";
import Translator from "./utils/Translator";

import IconButton from "@material-ui/core/IconButton";
import {AccountCircle} from "@material-ui/icons";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import {setToken} from "../actions/api.action";

import Cookies from "universal-cookie";
import ListItemIcon from "@material-ui/core/ListItemIcon";

import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

const cookies = new Cookies();

interface Props {
    classes: {
        title: string,
        root: string,
        appbar: string
    },
    token: string,
    setToken: any,
    history: {
        push: any
    },
}

interface State {
    anchorEl: any
}

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)) };
}

const mapStateToProps = (state: any) => {
    return { token: state.token };
};

const styles = (theme: Theme) => createStyles({
    title: {
        flexGrow: 1,
        marginRight: theme.spacing(2),
        textDecoration: 'none'
    },
    root: {
        flexGrow: 1
    },
    appbar: {
        zIndex: theme.zIndex.drawer + 1
    }
});

class NavigationBar extends Component <Props, State> {
    state: State = {
        anchorEl: null
    };

    handleMenu = (e: any) => {
        e.preventDefault();
        this.setState({ anchorEl: e.currentTarget });
    };

    handleClose = (e: any) => {
        e.preventDefault();

        const key : string = e.currentTarget.id;

        if (key === "profile") {
            this.props.history.push('/profile');
        } else if (key === "logout") {
            cookies.set('token', '');
            this.props.setToken('');
            this.props.history.push('/');
        }

        this.setState({ anchorEl: null });
    };

    render() {
        const { classes, token } = this.props;

        let rightSide;

        if (!token)
            rightSide = (
                <div>
                    <Link to="/login" style={{ textDecoration: 'none', color: '#FFFFFF' }}>
                        <Button color="secondary"><Translator sentence="signin" /></Button>
                    </Link>
                    &nbsp;
                    <Link to={{pathname: '/join', state: { email: '' }}} style={{ textDecoration: 'none', color: '#FFFFFF' }}>
                        <Button variant="contained" color="secondary"><Translator sentence="signup" /></Button>
                    </Link>
                </div>
            );
        else
            rightSide = (
                <div>
                    <IconButton
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={this.handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id='menu-appbar'
                        anchorEl={this.state.anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right'
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right'
                        }}
                        open={Boolean(this.state.anchorEl)}
                        onClose={this.handleClose}
                    >
                        <MenuItem id='profile' onClick={this.handleClose}>
                            <ListItemIcon>
                                <AccountCircleIcon />
                            </ListItemIcon>
                            <Translator sentence="profile" />
                        </MenuItem>
                        <Divider />
                        <MenuItem id='logout' onClick={this.handleClose}>
                            <ListItemIcon>
                                <ExitToAppIcon />
                            </ListItemIcon>
                            <Translator sentence="logOut" />
                        </MenuItem>
                    </Menu>
                </div>
            );

        return (
            <div className="App">
                <AppBar position="static" className={classes.appbar}>
                    <Toolbar>
                        <Typography variant="h6" className={classes.title}>
                            <Link to='/' style={{ textDecoration: 'none', color: '#FFFFFF' }}>AREA</Link>
                        </Typography>
                        <LanguagePicker />
                        &nbsp;
                        { rightSide }
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NavigationBar));
