import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import DirectionsIcon from '@material-ui/icons/Directions';

interface Props {
    classes: {
        root: string,
        input: string,
        iconButton: string,
        divider: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    root: {
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
    },
    input: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },
    iconButton: {
        padding: 10,
    },
    divider: {
        height: 28,
        margin: 4,
    },
});

class ButtonTextField extends Component<Props, State> {
    render() {
        const { classes } = this.props;

        return (
            <Paper component="form" className={classes.root}>
                <InputBase
                    className={classes.input}
                    placeholder="Enter your email"
                    inputProps={{ 'aria-label': 'enter your email' }}
                />
                <Divider className={classes.divider} orientation="vertical" />
                <IconButton color="primary" className={classes.iconButton} aria-label="directions">
                    <DirectionsIcon />
                </IconButton>
            </Paper>
        );
    }
}

export default withStyles(styles)(ButtonTextField);
