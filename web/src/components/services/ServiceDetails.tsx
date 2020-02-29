import React, { Component } from 'react';

import {createStyles, Theme, withStyles} from "@material-ui/core";

import { connect } from 'react-redux';

import NavigationBar from "../NavigationBar";
import Translator from "../Translator";
import Grid from '@material-ui/core/Grid';

// Expansion Panel Utils

import Typography from "@material-ui/core/Typography";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

import Divider from '@material-ui/core/Divider';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle'
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import {IArea, IPlaceHolder} from "../../interfaces/IService.interface";

import HtmlTooltip from "./HtmlTooltip";

interface Props {
    token: string,
    api_url: string,
    services: any,
    history: {
        push: any
    },
    classes: {
        section: string,
        heading: string,
        button: string,
        details: string,
        formControl: string
    },
    location: {
        state: {
            info: any
        }
    }
}

interface State {
    areas: IArea[],
    info: any,
    dialogOpened: boolean,
    availableActions: any,
    availableReactions: any,
    chosenArea: number,
    selectedReaction: any,
    configSchemaReaction: any
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token, services: state.services };
};

const styles = (theme: Theme) => createStyles({
    section: {
        padding: '20px',
        borderBottom: '3px solid #f5f5f5',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    button: {
        margin: theme.spacing(1),
    },
    details: {
        flexDirection: "column"
    },
    formControl: {
        fullWidth: 0,
        display: "flex",
        wrap: "nowrap"
    }
});

class ServiceDetails extends Component<Props, State> {
    state: State = {
        areas: [],
        info: (this.props.location.state.info) ? this.props.location.state.info : {},
        dialogOpened: false,
        availableActions: [],
        availableReactions: [],
        chosenArea: 0,
        selectedReaction: 0,
        configSchemaReaction: {}
    };

    selectReactionChange = (e: any) => {
        let configSchemaReaction: any = {};

        configSchemaReaction[e.target.value.name] = {};
        configSchemaReaction[e.target.value.name]['serviceName'] = e.target.value.serviceName;
        for (let configSchema of e.target.value.configSchema) {
            if (configSchema.type === "string")
                configSchemaReaction[e.target.value.name][configSchema.name] = '';
            else if (configSchema.type === "boolean")
                configSchemaReaction[e.target.value.name][configSchema.name] = false;
            else
                configSchemaReaction[e.target.value.name][configSchema.name] = 0;
        }

        this.setState({ selectedReaction: e.target.value, configSchemaReaction: configSchemaReaction });
    };

    configSchemaChange = (e: any) => {
        const { configSchemaReaction } = this.state;

        if (typeof configSchemaReaction[this.state.selectedReaction.name][e.target.id] === "boolean")
            configSchemaReaction[this.state.selectedReaction.name][e.target.id] = e.target.checked;
        else
            configSchemaReaction[this.state.selectedReaction.name][e.target.id] = e.target.value;
        this.setState({configSchemaReaction: configSchemaReaction} as unknown as Pick<State, keyof State>);
    };

    displayConfigSchema = (configSchema: any) => {
        const { areas, chosenArea, configSchemaReaction } = this.state;
        const { name, type, required } = configSchema;
        const currentArea: any = areas[chosenArea];
        let placeholders: IPlaceHolder[] | null = null;
        let currentActionInfos = this.state.availableActions.filter((available: any) => {
            const splitted: string[] = currentArea.action.serviceAction.split('.');

            return available.name === splitted[splitted.length - 1];
        })[0];

        if (currentArea.action) {
            placeholders = currentActionInfos.placeholders;
        }

        let placeHolderComponent: any = null;

        if (placeholders) {
            placeHolderComponent = (
                <React.Fragment>
                    <p><b>Placeholders:</b></p>
                    {placeholders.map((holder: IPlaceHolder, index: number) => <p key={index}>{`{${holder.name}}: ${holder.description}`}</p>)}
                </React.Fragment>
            )
        }

        if (type === "string" || type === "number") {
            if (placeholders) {
                return (
                    <HtmlTooltip title={placeHolderComponent}>
                        <TextField
                            label={name}
                            required={required}
                            id={name}
                            type={type}
                            value={configSchemaReaction[this.state.selectedReaction.name][name]}
                            onChange={(e) => this.configSchemaChange(e)}
                            fullWidth
                        />
                    </HtmlTooltip>
                )
            } else {
                return (
                    <TextField
                        label={name}
                        required={required}
                        id={name}
                        type={type}
                        value={configSchemaReaction[this.state.selectedReaction.name][name]}
                        onChange={(e) => this.configSchemaChange(e)}
                        fullWidth
                    />
                )
            }
        } else if (type === "boolean") {
            return (
                <FormControlLabel
                    control={
                        <Switch
                            id={name}
                            required={required}
                            checked={configSchemaReaction[this.state.selectedReaction.name][name]}
                            onChange={(e) => this.configSchemaChange(e)}
                            value="checkedA"
                        />
                    }
                    label={name}
                />
            )
        }
    };

    closeDialog = (e: any) => {
        this.setState({ dialogOpened: false, selectedReaction: {}, configSchemaReaction: {} });
    };

    openDialog = (e:  any) => {
        this.setState({ dialogOpened: true, chosenArea: e.currentTarget.value });
    };

    saveReaction = (e: any) => {
        const { api_url, token } = this.props;
        const { configSchemaReaction } = this.state;
        const reactionName: string = Object.keys(configSchemaReaction)[0];
        let serviceName: string = '';
        let options: any = {};

        for (let option of Object.keys(configSchemaReaction[reactionName])) {
            if (option === "serviceName")
                serviceName = configSchemaReaction[reactionName][option];
            else
                options[option] = configSchemaReaction[reactionName][option];
        }

        const body = {
            serviceReaction: `${serviceName}.R.${reactionName}`,
            options: options
        };
        const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        fetch(`${api_url}/areas/${this.state.areas[this.state.chosenArea].id}/reactions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        })
            .then(res => res.json())
            .then((data) => {
                window.location.reload();
            });
    };

    deleteAREA = (e: any) => {
        const { api_url, token } = this.props;
        const { areas } = this.state;
        const { id } = areas[e.currentTarget.value];
        const index  = e.currentTarget.value;

        fetch(`${api_url}/areas/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        }).then(r => {
            if (r.ok) {
                areas.splice(index, 1);
                this.setState({ areas: areas });
            }
        });
    };

    deleteReaction = (e: any) => {
        const { api_url, token } = this.props;
        const areaId: string = e.currentTarget.value.split(';')[0];
        const reactionId: string = e.currentTarget.value.split(';')[1];

        fetch(`${api_url}/areas/${areaId}/reactions/${reactionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`}
        })
            .then((res) => {
                if (res.ok)
                    window.location.reload();
            });
    };

    componentDidMount() {
        const { token, api_url } = this.props;
        const { info } = this.state;

        fetch(`${api_url}/areas?filter={"include": [{"relation":"action"},{"relation":"reactions"}]}`, {
            headers: {'Authorization': `Bearer ${token}`}
        })
            .then(res => res.json())
            .then((data) => {
                const {info} = this.state;

                const tmpAreaArray = data.filter((area: any) => (!area.action || !area.reactions) || (area.action.serviceAction.split('.')[0] === info.name));
                this.setState({areas: tmpAreaArray});
            });

        fetch(`${api_url}/about.json`)
            .then(res => res.json())
            .then((data) => {
                const { services } = data.server;

                fetch(`${api_url}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then((data) => {
                        const registeredServices = data.servicesList;

                        const availableActions = services.filter((service: any) => service.name === info.name)[0].actions;
                        const availableReactions = [];

                        for (let service of services)
                            if (registeredServices.includes(service.name)) {
                                for (let reaction of service.reactions) {
                                    reaction['serviceName'] = service.name;
                                    availableReactions.push(reaction);
                                }
                            }

                        this.setState({ availableActions: availableActions, availableReactions: availableReactions });
                    });
            })
    }

    render() {
        const { classes } = this.props;
        const { areas, info } = this.state;

        return (
            <div>
                <NavigationBar history={this.props.history} />
                <div
                    style={{
                        position: 'absolute',
                        paddingTop: '50px',
                        left: '50%',
                        transform: 'translate(-50%)'
                    }}
                >
                    <Typography variant="h3" className={classes.section} gutterBottom><b><Translator sentence="myActions" /> - { info.displayName }</b></Typography>
                    {areas.map((area: any, index: number) => (
                        <ExpansionPanel key={areas.indexOf(area)}>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography className={classes.heading} variant="h5">{ area.name }</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails className={classes.details}>
                                {
                                    (area.action) ?
                                        <div>
                                            <Typography variant="h5" gutterBottom>
                                                <b>Action</b>
                                            </Typography>
                                            <Divider />
                                            <br />
                                            <Typography variant="h6" gutterBottom>
                                                <u>{area.action.serviceAction.split('.')[area.action.serviceAction.split('.').length - 1] + ':'}</u>
                                            </Typography>
                                            {Object.keys(area.action.options).map((elem: string) => (
                                                <p key={Object.keys(area.action.options).indexOf(elem)}>
                                                    <b>{elem}</b>{': ' + area.action.options[elem]}
                                                </p>
                                            ))}
                                        </div>
                                    :
                                        ''
                                }
                            </ExpansionPanelDetails>
                            <ExpansionPanelDetails className={classes.details}>
                                <div>
                                    <Grid container spacing={3}>
                                        <Grid item xs={6}>
                                            <Typography variant="h5" gutterBottom>
                                                <b>Reaction(s)</b>
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <IconButton value={areas.indexOf(area)} onClick={this.openDialog} style={{float: 'right', zIndex: 100, position: 'relative'}} aria-label="settings" color="primary">
                                                <AddIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                    <Divider />
                                </div>
                            {
                                (area.reactions) ?
                                    <div>
                                        <br />
                                        {area.reactions.map((reaction: any) => (
                                            <div key={area.reactions.indexOf(reaction)} className={classes.details}>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="h6" gutterBottom>
                                                            <u>{reaction.serviceReaction.split('.')[reaction.serviceReaction.split('.').length - 1]}:</u>
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <IconButton value={`${area.id};${reaction.id}`} onClick={this.deleteReaction} style={{float: 'right', zIndex: 100, position: 'relative'}} aria-label="settings" color="primary">
                                                            <HighlightOffIcon />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                                { Object.keys(reaction.options).map((elem: string) => (
                                                    <p key={Object.keys(reaction.options).indexOf(elem)}>
                                                        <b>{elem}</b>{': ' + reaction.options[elem]}
                                                    </p>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    :
                                    ''
                            }
                            </ExpansionPanelDetails>
                            <ExpansionPanelActions>
                                <Button
                                    value={areas.indexOf(area)}
                                    variant="contained"
                                    color="primary"
                                    className={classes.button}
                                    onClick={(e) => {e.persist();this.deleteAREA(e);}}
                                    startIcon={<DeleteIcon />}
                                >
                                    <Translator sentence="delete" />
                                </Button>
                            </ExpansionPanelActions>
                        </ExpansionPanel>
                    ))}
                </div>
                <Dialog
                    open={this.state.dialogOpened}
                    onClose={this.closeDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title"><Translator sentence="addReactions" /> - {(this.state.areas[this.state.chosenArea]) ? this.state.areas[this.state.chosenArea].name : ''}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            <Translator sentence="addReactionsDescription" />
                        </DialogContentText>
                        <FormControl className={classes.formControl}>
                            <InputLabel htmlFor="service-simple">Reaction</InputLabel>
                            <Select
                                labelId="service-simple"
                                id="simple-service"
                                value={this.state.selectedReaction}
                                onChange={this.selectReactionChange}
                                autoWidth
                            >
                                {this.state.availableReactions.map((elem: any, index: number) => (
                                    <MenuItem key={index} value={elem}>{`${elem.name} - ${elem.description}`}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <br />
                        {
                            (this.state.selectedReaction !== 0 && Object.keys(this.state.selectedReaction).length > 0)
                            ?
                                (
                                    <div>
                                        {this.state.selectedReaction.configSchema.map((elem: any, index: number) => (
                                            <div key={index}>{this.displayConfigSchema(elem)}</div>
                                        ))}
                                    </div>
                                )
                            :
                                ''
                        }
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.closeDialog} color="primary">
                            <Translator sentence="cancel" />
                        </Button>
                        <Button onClick={this.saveReaction} color="primary" autoFocus>
                            <Translator sentence="save" />
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapStateToProps)(ServiceDetails));
