import React, { Component } from 'react';

import { connect } from 'react-redux';
import { withStyles, createStyles, Theme } from "@material-ui/core";

import Box from '@material-ui/core/Box';

import Typography from "@material-ui/core/Typography";

import Grid from '@material-ui/core/Grid';

import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import Utilities from '../../utils/Utilities';

// Dialogs Utils

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import AddAreaStepper from "./AddAreaStepper";

interface Props {
    api_url: string,
    token: string,
    classes: {
        root: string,
        icon: string,
        serviceName: string
    },
    info: any,
    history: {
        push: any
    }
}

interface State {
    addDialogOpened: boolean,
    color: string
}

interface ServiceInfo {
    name: string,
    description: string,
    icon: string,
    color: string,
    actions: any,
    reactions: any,
    token: string,
    userId: string
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

const styles = (theme: Theme) => createStyles({
    root: {
        borderRadius: '5px',
        '&:hover': {
            cursor: 'pointer'
        }
    },
    icon: {
        width: '50px',
        height: '50px'
    },
    serviceName: {
        paddingTop: '8px',
        textAlign: 'center'
    }
});

class Service extends Component<Props, State> {
    state: State = {
        addDialogOpened: false,
        color: ''
    };

    componentDidMount(): void {
        const { info } = this.props;

        this.setState({ color: info.color });
    }

    handleDialogOpen = (e: any) => {
        this.setState({ addDialogOpened: true });
        e.stopPropagation();
    };

    handleDialogClose = (e: any) => {
        this.setState({ addDialogOpened: false });
    };

    handleClick = (e: any) => {
        const { info } = this.props;

        this.props.history.push({ pathname: '/services_detail', state: { info: info } });
    };

    hoverEffectEnter = (e: any) => {
        const { color } = this.state;

        if (Utilities.isLightColor(color)) {
            this.setState({ color: Utilities.lightenDarkenColor(color, -20) });
        } else {
            this.setState({ color: Utilities.lightenDarkenColor(color, 20) });
        }
    };

    hoverEffectExit = (e: any) => {
        const { color } = this.state;

        if (Utilities.isLightColor(color)) {
            this.setState({ color: Utilities.lightenDarkenColor(color, 20) });
        } else {
            this.setState({ color: Utilities.lightenDarkenColor(color, -20) });
        }
    };

    render() {
        const { classes, info } = this.props;
        const { color } = this.state;

        return (
            <div>
                <Box
                    onMouseEnter={this.hoverEffectEnter}
                    onMouseLeave={this.hoverEffectExit}
                    onClick={this.handleClick}
                    width="auto"
                    boxShadow={2}
                    bgcolor={color}
                    m={1}
                    p={1}
                    className={classes.root}
                    style={{color: (Utilities.isLightColor(String(color)) ? 'black' : 'white')}}
                >
                    <Grid container>
                        <Grid item xs={4}>
                            <img alt={info.name} className={classes.icon} src={info.icon} />
                        </Grid>
                        <Grid item xs={4}>
                            <Typography className={classes.serviceName} variant="h6">{Utilities.capitalizeString(info.name)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <IconButton onClick={this.handleDialogOpen} style={{float: 'right', zIndex: 100, position: 'relative'}} aria-label="settings" color={(Utilities.isLightColor(info.color)) ? 'primary' : 'secondary'}>
                                <AddIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
                <Dialog open={this.state.addDialogOpened} onClose={this.handleDialogClose} aria-labelledby="form-dialog-title">
                    <DialogContent>
                        <AddAreaStepper serviceName={info.name} actions={info.actions} reactions={info.reactions} closeFunction={this.handleDialogClose} />
                    </DialogContent>
                </Dialog>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Service));
