import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import Slide from '@material-ui/core/Slide';

import ChangeApi from "./ChangeApi";

const Transition: any = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const mapStateToProps = (state: any) => {
    return { language: state.language };
};

interface Props {
    classes: {
        footer: string,
        footerText: string,
        downloadAndroidImage: string
    },
    isConnected: boolean,
    apiUrl: string,
    reloadFunction: any,
    language: string
}

interface State {
    dialogOpened: boolean
}

const styles = (theme: Theme) => createStyles({
    footer: {
        width: '100%',
        position: 'fixed',
        marginTop: '20px',
        backgroundColor: '#212121',
        bottom: '0'
    },
    footerText: {
        color: 'white',
        textAlign: 'center',
        paddingTop: theme.spacing(1)
    },
    downloadAndroidImage: {
        paddingTop: '6px',
        width: '60%',
        height: 'auto'
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

        const isMobile: boolean = window.innerWidth <= 500;

        if (isConnected)
            return (
                <div className={classes.footer}>
                    {(!isMobile) ? (
                    <Grid container spacing={3}>
                        <Grid item xs={10}>
                            <Typography className={classes.footerText} variant="body1" gutterBottom>
                                {
                                    (this.props.language === 'en')
                                        ?
                                        `You are currently using the ${apiUrl.split('://')[1]} api, click`
                                        :
                                        `Actuellement vous utilisez l'api ${apiUrl.split('://')[1]}, cliquez`
                                }
                                &nbsp;
                                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                                <a onClick={this.handleChangeApiClick} href="#" style={{color: '#FFBE76'}}>{(this.props.language === 'en') ? 'here' : 'ici'}</a>
                                &nbsp;
                                {(this.props.language === 'en') ? 'to change.' : 'pour changer.'}
                            </Typography>
                        </Grid>
                        <Grid item xs={2}>
                            <a href="/client.apk" target="_blank">
                                <img alt="download android app" className={classes.downloadAndroidImage} src="/img/download-android-app.png" />
                            </a>
                        </Grid>
                    </Grid>
                    ) : (
                        <Typography className={classes.footerText} variant="body1" gutterBottom>
                            {
                                (this.props.language === 'en')
                                    ?
                                    `You are currently using the ${apiUrl.split('://')[1]} api, click`
                                    :
                                    `Actuellement vous utilisez l'api ${apiUrl.split('://')[1]}, cliquez`
                            }
                            &nbsp;
                            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                            <a onClick={this.handleChangeApiClick} href="#" style={{color: '#FFBE76'}}>{(this.props.language === 'en') ? 'here' : 'ici'}</a>
                            &nbsp;
                            {(this.props.language === 'en') ? 'to change.' : 'pour changer.'}
                        </Typography>
                    )}
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

export default connect(mapStateToProps)(withStyles(styles)(Footer));
