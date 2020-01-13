import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import { Link } from 'react-router-dom';

import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';

interface Props {
    classes: {
        title: string,
        root: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    title: {
        flexGrow: 1,
        marginRight: theme.spacing(2),
        textDecoration: 'none'
    },
    root: {
        flexGrow: 1
    }
});

class NavigationBar extends Component <Props, State> {
    render() {
        const { classes } = this.props;

        return (
            <div className="App">
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" className={classes.title}>
                            <Link to='/' style={{ textDecoration: 'none', color: '#FFFFFF' }}>AREA</Link>
                        </Typography>
                        <Button color="secondary">Sign In</Button>
                        &nbsp;
                        <Link to={{pathname: '/join', state: { email: '' }}} style={{ textDecoration: 'none', color: '#FFFFFF' }}>
                            <Button variant="contained" color="secondary">Sign Up</Button>
                        </Link>
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}

export default withStyles(styles)(NavigationBar);
