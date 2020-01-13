import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';

import Button from '@material-ui/core/Button';

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
        marginTop: '10px',
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
        height: 40
    },
});

class ButtonTextField extends Component<Props, State> {
    render() {
        const { classes } = this.props;

        return (
            <div>
                <Paper component="form" className={classes.root} elevation={0}>
                    <InputBase
                        className={classes.input}
                        placeholder="Enter your email"
                        inputProps={{ 'aria-label': 'enter your email' }}
                    />
                    <Divider className={classes.divider} orientation="vertical" />
                    <Button color="primary">Get Started</Button>
                </Paper>
            </div>
        );
    }
}

export default withStyles(styles)(ButtonTextField);
