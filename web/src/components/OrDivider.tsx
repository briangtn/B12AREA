import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

interface Props {
    classes: {
        dividerContainer: string,
        dividerLeft: string,
        dividerRight: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    dividerContainer: {
        width: '100%',
        textAlign: 'center',
        color: '#CCCCCC',
        '& hr': {
            marginLeft: 'auto',
            marginRight: 'auto',
            width: '40%',
            backgroundColor: '#CCCCCC'
        },
        marginTop: '20px'
    },
    dividerLeft: {
        float: 'left',
        backgroundColor: '#CCCCCC',
        height: '1px',
        border: '0'
    },
    dividerRight: {
        float: 'right',
        backgroundColor: '#CCCCCC',
        height: '1px',
        border: '0'
    },
});

class OrDivider extends Component<Props, State> {
    render() {
        const { classes } = this.props;

        return (
            <div className={classes.dividerContainer}>
                <hr className={classes.dividerLeft} /> or <hr className={classes.dividerRight} />
            </div>
        );
    }
}

export default withStyles(styles)(OrDivider);
