import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import Slide from '@material-ui/core/Slide';
import ChangeApi from "./ChangeApi";

const Transition: any = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
    classes: {
        footer: string,
        footerText: string
    },
    isConnected: boolean,
    apiUrl: string,
    reloadFunction: any
}

interface State {
    dialogOpened: boolean
}

const styles = (theme: Theme) => createStyles({
    footer: {
        width: '100%',
        position: 'absolute',
        marginTop: '20px',
        backgroundColor: '#212121',
        bottom: '0'
    },
    footerText: {
        color: 'white',
        textAlign: 'center',
        padding: theme.spacing(1)
    }
});

class Footer extends Component<Props, State> {
    state: State = {
        dialogOpened: false,
    };

    handleChangeApiClick = (e: React.FormEvent) => {
        this.setState({ dialogOpened: true });
    };

    handleDialogClose = (e: React.FormEvent) => {
        this.setState({ dialogOpened: false });
    };

    render() {
        const { classes, isConnected, apiUrl } = this.props;
        //const { dialogOpened } = this.state;

        if (isConnected)
            return (
                <div className={classes.footer}>
                    <Typography className={classes.footerText} variant="body1" gutterBottom>
                        You are currently using the {apiUrl.split('://')[1]} api, click&nbsp;
                        <a onClick={this.handleChangeApiClick} href="#" style={{color: '#FFBE76'}}>here</a>
                        &nbsp;to change.
                    </Typography>
                    <Dialog
                        open={this.state.dialogOpened}
                        TransitionComponent={Transition}
                        keepMounted
                        onClose={this.handleDialogClose}
                    >
                        <DialogTitle>Do you want to change your API Url?</DialogTitle>
                        <DialogContent>
                            <ChangeApi reloadFunction={this.props.reloadFunction.bind(this)} closeDialogFunction={this.handleDialogClose} />
                        </DialogContent>
                    </Dialog>
                </div>
            );
        else
            return (
                <div></div>
            );
    }
}

export default withStyles(styles)(Footer);
