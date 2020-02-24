import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Translator from "../Translator";

// Fab Utils

import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

// Dialogs Utils

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';

// Select

import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

interface Props {
    api_url: string,
    token: string,
    classes: {
        fab: string,
        formControl: string
    },
    availableServices: any
}

interface ServiceFromAbout {
    name: string,
    description: string,
    icon: string,
    color: string,
    actions: any,
    reactions: any
}

interface State {
    dialogOpened: boolean,
    selectedService: string
}

const styles = (theme: Theme) => createStyles({
    fab: {
        margin: 0,
        top: 'auto',
        right: 20,
        bottom: 20,
        left: 'auto',
        position: 'fixed',
    },
    formControl: {
        fullWidth: 0,
        display: "flex",
        wrap: "nowrap"
    }
});

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

class AddServices extends Component<Props, State> {
    state: State = {
        dialogOpened: false,
        selectedService: ''
    };

    // Handle the confirmation

    handleRegisterService = (e: any) => {
        const { api_url, token } = this.props;
        const { selectedService } = this.state;
        const redirectURL = `${window.location.origin}/code_validator`;
        const payload = { redirectURL: redirectURL };

        fetch(`${api_url}/services/login/${selectedService}?redirectURL=${redirectURL}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then((data) => {
            window.location.href = data['url'];
        });
    };

    // Handle simple changes of the dialog

    handleDialogOpen = (e: any) => {
        this.setState({ dialogOpened: true });
    };

    handleDialogClose = (e: any) => {
        this.setState({ dialogOpened: false });
    };

    handleServiceChange = (e: any) => {
        this.setState({ selectedService: e.target.value });
    };

    render() {
        const { classes, availableServices } = this.props;
        const { dialogOpened, selectedService } = this.state;

        const serviceChoices = availableServices.map((service: any) => (
            <MenuItem key={availableServices.indexOf(service)} value={service.name}>{service.name.charAt(0).toUpperCase() + service.name.slice(1)}</MenuItem>
        ));

        return (
            <div>
                <Fab color="primary" aria-label="add" className={classes.fab} onClick={this.handleDialogOpen}>
                    <AddIcon />
                </Fab>
                <Dialog open={dialogOpened} onClose={this.handleDialogClose} aria-labelledby="form-dialog-title">
                    <DialogTitle id="form-dialog-title"><Translator sentence="addServices" /></DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                        <Translator sentence="addServicesSubtitle" />
                        </DialogContentText>
                        <FormControl className={classes.formControl}>
                            <InputLabel htmlFor="service-simple">Services</InputLabel>
                            <Select
                                labelId="service-simple"
                                id="simple-service"
                                value={selectedService}
                                onChange={this.handleServiceChange}
                                autoWidth
                            >
                                { serviceChoices }
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                    <Button onClick={this.handleDialogClose} color="primary">
                        <Translator sentence="cancel" />
                    </Button>
                    <Button onClick={this.handleRegisterService} color="primary">
                        <Translator sentence="save" />
                    </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(AddServices));