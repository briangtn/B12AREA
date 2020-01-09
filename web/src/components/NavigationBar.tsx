import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

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
        marginRight: theme.spacing(2)
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
                            AREA
                        </Typography>
                        <Button color="secondary">Sign In</Button>
                        &nbsp;
                        <Button variant="contained" color="secondary">Sign Up</Button>
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}

export default withStyles(styles)(NavigationBar);
