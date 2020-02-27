import React, { Component } from 'react';

import { connect } from 'react-redux';
import {withStyles, createStyles, Theme, Snackbar} from "@material-ui/core";

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

import Typography from "@material-ui/core/Typography";
import Button from '@material-ui/core/Button';

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from "@material-ui/core/TextField";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import Alert from '../Alert';
import Tooltip from '@material-ui/core/Tooltip';

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token, services: state.services };
};

interface Props {
    classes: {
        instructions: string,
        formControl: string,
        noMaxWidth: string
    },
    actions: any,
    reactions: any,
    services: any,
    closeFunction: any,
    token: string,
    api_url: string,
    serviceName: string
}

interface State {
    areaName: string;
    activeStep: number;
    steps: string[],
    configSchemaActions: any,
    configSchemaReactions: any,
    chosenReactions: Reaction[],
    selectedAction: any,
    alert: boolean,
    alertMessage: string,
    alertSeverity: string
}

interface Reaction {
    name: string,
    displayName: string,
    description: string,
    configSchema: any[]
}

interface Placeholder {
    name: string,
    description: string
}

const styles = (theme: Theme) => createStyles({
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    formControl: {
        fullWidth: 0,
        display: "flex",
        wrap: "nowrap"
    },
    noMaxWidth: {
        maxWidth: 'none',
    },
});

const HtmlTooltip = withStyles(theme => ({
    tooltip: {
        color: 'white',
        maxWidth: 'none',
        fontSize: theme.typography.pxToRem(12)
    },
}))(Tooltip);

class AddAreaStepper extends Component<Props, State> {
    state: State = {
        areaName: '',
        activeStep: 0,
        steps: ['Name your AREA', 'Choose your action', 'Select your reactions', 'Summary'],
        configSchemaActions: {},
        configSchemaReactions: {},
        chosenReactions: [],
        selectedAction: 0,
        alert: false,
        alertMessage: '',
        alertSeverity: 'error'
    };

    handleNextStep = (e: any) => {
        const { activeStep } = this.state;

        this.setState({ activeStep: activeStep + 1 });
    };

    handleBackStep = (e: any) => {
        const { activeStep } = this.state;

        if (activeStep === 0)
            return;
        this.setState({ activeStep: activeStep - 1 });
    };

    // Steps

    selectActionChange = (e: any) => {
        const { configSchemaActions } = this.state;

        configSchemaActions[e.target.value.name] = {};
        configSchemaActions[e.target.value.name]['serviceName'] = e.target.value.serviceName;
        for (let configSchema of e.target.value.configSchema) {
            if (configSchema.type === "string")
                configSchemaActions[e.target.value.name][configSchema.name] = '';
            else if (configSchema.type === "boolean")
                configSchemaActions[e.target.value.name][configSchema.name] = false;
            else
                configSchemaActions[e.target.value.name][configSchema.name] = 0;
        }

        this.setState({ selectedAction: e.target.value, configSchemaActions: configSchemaActions });
    };

    configSchemaChange = (argGroupName: string, key: any, e: any, isAction: boolean) => {
        const { configSchemaActions, configSchemaReactions } = this.state;

        if (isAction) {
            if (typeof configSchemaActions[argGroupName][e.target.id] === "boolean")
                configSchemaActions[argGroupName][e.target.id] = e.target.checked;
            else
                configSchemaActions[argGroupName][e.target.id] = e.target.value;
            this.setState({[key]: configSchemaActions} as unknown as Pick<State, keyof State>);
        } else {
            if (typeof configSchemaReactions[argGroupName][e.target.id] === "boolean")
                configSchemaReactions[argGroupName][e.target.id] = e.target.checked;
            else
                configSchemaReactions[argGroupName][e.target.id] = e.target.value;
            this.setState({[key]: configSchemaReactions} as unknown as Pick<State, keyof State>);
        }
    };

    displayConfigSchema = (argGroupName: string, configSchema: any, key: any, isAction: boolean, placeholder: Placeholder[] | null = null) => {
        const { configSchemaActions, configSchemaReactions } = this.state;
        const { name, type, required } = configSchema;
        let placeHolderString: any = null;

        if (placeholder) {
                placeHolderString = (
                    <React.Fragment>
                        <p><b>Placeholders:</b></p>
                        {placeholder.map((holder: Placeholder, index: number) => <p key={index}>{`{${holder.name}}: ${holder.description}`}</p>)}
                    </React.Fragment>
                );
        }
        if (type === "string" || type === "number") {
            if (placeholder) {
                return (
                    <HtmlTooltip title={placeHolderString}>
                        <TextField
                            label={name}
                            required={required}
                            id={name}
                            type={type}
                            value={(isAction) ? configSchemaActions[argGroupName][name] : configSchemaReactions[argGroupName][name]}
                            onChange={(e) => this.configSchemaChange(argGroupName, key, e, isAction)}
                            fullWidth
                        />
                    </HtmlTooltip>
                );
            } else {
                return (
                    <TextField
                        label={name}
                        required={required}
                        id={name}
                        type={type}
                        value={(isAction) ? configSchemaActions[argGroupName][name] : configSchemaReactions[argGroupName][name]}
                        onChange={(e) => this.configSchemaChange(argGroupName, key, e, isAction)}
                        fullWidth
                    />
                );
            }
        } else if (type === "boolean") {
            return (
                <FormControlLabel
                    control={
                        <Switch
                            id={name}
                            required={required}
                            checked={(isAction) ? configSchemaActions[argGroupName][name] : configSchemaReactions[argGroupName][name]}
                            onChange={(e) => this.configSchemaChange(argGroupName, key, e, isAction)}
                            value="checkedA"
                        />
                    }
                    label={name}
                />
            )
        }
    };

    nameStep = () => {
        return (
            <div>
                <TextField
                    label="AREA Name"
                    required
                    id="area-name"
                    value={this.state.areaName}
                    onChange={(e) => this.setState({ areaName: e.target.value })}
                    fullWidth
                />
                <br />
                <br />
            </div>
        );
    };

    actionStep = () => {
        const { selectedAction } = this.state;
        const { actions, classes } = this.props;

        return (
            <div>
                <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="service-simple">Actions</InputLabel>
                    <Select
                        labelId="service-simple"
                        id="simple-service"
                        value={selectedAction}
                        onChange={this.selectActionChange}
                        autoWidth
                    >
                        {actions.map((elem: any) => (
                            <MenuItem key={actions.indexOf(elem)} value={elem}>{`${elem.name} - ${elem.description}`}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <br />
                {
                    (selectedAction !== 0)
                    ? (<div>{selectedAction.configSchema.map((elem: any) => (
                        <div key={selectedAction.configSchema.indexOf(elem)}>{this.displayConfigSchema(selectedAction.name, elem, "configSchemaActions", true)}</div>
                    ))}</div>)
                    : ''
                }
                <br />
            </div>
        );
    };

    selectReaction = (e: any) => {
        const { configSchemaReactions } = this.state;

        for (let reaction of e.target.value) {
            if (!configSchemaReactions[reaction.name]) {
                configSchemaReactions[reaction.name] = {};
                configSchemaReactions[reaction.name]['serviceName'] = reaction.serviceName;
                for (let configSchema of reaction.configSchema) {
                    if (configSchema.type === "string")
                        configSchemaReactions[reaction.name][configSchema.name] = ''
                    else if (configSchema.type === "boolean")
                        configSchemaReactions[reaction.name][configSchema.name] = false
                    else
                        configSchemaReactions[reaction.name][configSchema.name] = 0
                }
            }
        }
        this.setState({ chosenReactions: e.target.value, configSchemaReactions: configSchemaReactions });
    };

    reactionStep = () => {
        const { chosenReactions } = this.state;
        const { services, classes } = this.props;
        const allRegisteredReactions: Reaction[] = [];

        for (let service of services)
            for (let reaction of service.reactions) {
                reaction['serviceName'] = service.name;
                allRegisteredReactions.push(reaction);
            }

        return (
            <div>
                <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="service-simple">Reactions</InputLabel>
                    <Select
                        id="reactions-select"
                        multiple
                        value={chosenReactions}
                        renderValue={(selected) => (
                            <div>
                                {(selected as any[]).map((elem: any, index: number) => (
                                    (index !== (selected as any[]).length - 1) ? `${elem.name}, ` : `${elem.name}`
                                ))}
                            </div>
                        )}
                        onChange={this.selectReaction}
                        autoWidth
                    >
                        {allRegisteredReactions.map((reaction: Reaction) => (
                            <MenuItem key={allRegisteredReactions.indexOf(reaction)} value={reaction as any}>
                                { `${reaction.name} - ${reaction.description}` }
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <br />
                { chosenReactions.map((reaction: Reaction) => (
                    <div key={chosenReactions.indexOf(reaction)}>
                        <Typography variant="h6" gutterBottom>
                            { reaction.displayName }
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            { reaction.description }
                        </Typography>
                        { reaction.configSchema.map((configSchema: any) => (
                            <div key={reaction.configSchema.indexOf(configSchema)}>
                                {this.displayConfigSchema(reaction.name, configSchema, "configSchemaReactions", false, this.state.selectedAction.placeholders)}
                            </div>
                        ))}
                        <br />
                        <Divider />
                        <br />
                    </div>
                ))}
            </div>
        );
    };

    formatConfigSchema = (configSchema: any): any[] => {
        const formatted: any = [];

        for (let configSchemaName of Object.keys(configSchema)) {
            let tmp: any = {};
            tmp['name'] = configSchemaName;
            tmp['serviceName'] = configSchema[configSchemaName]['serviceName'];
            tmp['arguments'] = [];
            for (let configSchemaNameArgument of Object.keys(configSchema[configSchemaName])) {
                if (configSchemaNameArgument === "serviceName")
                    continue;
                tmp['arguments'].push({ name: configSchemaNameArgument, value: configSchema[configSchemaName][configSchemaNameArgument] });
            }
            formatted.push(tmp);
        }

        return formatted
    };

    summaryStep = () => {
        const { selectedAction, configSchemaActions, configSchemaReactions } = this.state;

        const formatActionArgument = this.formatConfigSchema(configSchemaActions);
        const formatReactionArgument = this.formatConfigSchema(configSchemaReactions);

        return (
            <div>
                <Typography variant="h6" gutterBottom>
                    Action - { selectedAction.displayName }
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                    { selectedAction.description }
                </Typography>
                {formatActionArgument.map((configSchema: any) => (
                    configSchema['arguments'].map((arg: any) => (
                        <Typography key={configSchema['arguments'].indexOf(arg)} variant="body1" gutterBottom>
                            <b>{arg.name}:</b> {arg.value}
                        </Typography>
                    ))
                ))}
                <br />
                <Divider />
                <br />
                {formatReactionArgument.map((configSchema: any) => (
                    <div key={formatReactionArgument.indexOf(configSchema)}>
                        <Typography variant="h6" gutterBottom>
                            Reaction - { configSchema.name }
                        </Typography>
                        {configSchema['arguments'].map((arg: any) => (
                            <Typography key={configSchema['arguments'].indexOf(arg)} variant="body1" gutterBottom>
                                <b>{arg.name}:</b> {'' + arg.value}
                            </Typography>
                        ))}
                    </div>
                ))}
                <br />
            </div>
        )
    };

    /**
     * Function to set the action to the AREA just created
     * based on the informations filled by the user.
     * @param id id of the area
     */
    setActionToArea: any = (id: string) => {
        const { api_url, token, serviceName } = this.props;
        const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        const actionConfigSchema = this.formatConfigSchema(this.state.configSchemaActions);

        const actionBody: { serviceAction: string, options: any } = {
            serviceAction: `${serviceName}.A.${actionConfigSchema[0].name}`,
            options: {}
        };

        for (let argument of actionConfigSchema[0].arguments)
                actionBody.options[argument.name] = argument.value;

        return fetch(`${api_url}/areas/${id}/action`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(actionBody)
        })
            .then(res => res.json())
            .then((data) => {
                const { error } = data;

                if (error) {
                    this.setState({ alert: true, alertMessage: `${error.name}: ${error.message}` });
                    return error
                }
                return null;
            })
    };

    /**
     * Function to set the reactions to the AREA just created
     * based on the informations filled by the user.
     * @param id id of the area
     */
    setReactionsToArea: any = async (id: string) => {
        const { api_url, token } = this.props;
        const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        const reactionConfigSchema = this.formatConfigSchema(this.state.configSchemaReactions);
        let returnArray = []
        for (let reaction of reactionConfigSchema) {
            const reactionBody: { serviceReaction: string, options: any } = {
                serviceReaction: `${reaction.serviceName}.R.${reaction.name}`,
                options: {}
            };

            for (let argument of reaction.arguments)
                reactionBody.options[argument.name] = argument.value;

            const res = await fetch(`${api_url}/areas/${id}/reactions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(reactionBody)
            });
            const json = await res.json();
            const { error } = json;

            if (error) {
                this.setState({ alert: true, alertMessage: `${error.name}: ${error.message}` });
                returnArray.push(error);
                continue;
            }
            returnArray.push(null);
        }
        return returnArray;
    };

    /**
     * Create all the AREA based on the
     * information the user filled before.
     */
    createAREA = () => {
        const { api_url, token } = this.props;
        const { areaName } = this.state;
        const headers: any = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        fetch(`${api_url}/areas`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ name: areaName, enabled: true })
        })
        .then(res => res.json())
        .then((data) => {
            const { id } = data;

            Promise.all([this.setActionToArea(id), this.setReactionsToArea(id)])
                .then(([action, reaction]) => {
                    let error: boolean = false;

                    for (let i = 0; i < reaction.length; i++) {
                        if (reaction[i] !== null)
                            error = true;
                    }
                    if (action !== null) {
                        error = true;
                    }
                    if (!error)
                        this.props.closeFunction();
                });
        });
    };

    contentStep = (activeStep: number) => {
        if (activeStep === 0) {
            return this.nameStep();
        } else if (activeStep === 1) {
            return this.actionStep();
        } else if (activeStep === 2) {
            return this.reactionStep();
        } else if (activeStep === 3) {
            return this.summaryStep();
        }
    };

    closeAlert = (e: any) => {
        this.setState({ alert: false });
    };

    render() {
        const { activeStep, steps } = this.state;

        return (
            <div>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map(label => (
                        <Step key={label}>
                            <StepLabel>{ label }</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <div>
                    <div>
                        {this.contentStep(activeStep)}
                        <div>
                            <Button
                                disabled={activeStep === 0}
                                onClick={this.handleBackStep}
                            >
                                Back
                            </Button>
                            <Button variant="contained" color="primary" onClick={(activeStep === steps.length - 1) ? this.createAREA : this.handleNextStep}>
                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        </div>
                    </div>
                </div>
                <Snackbar open={this.state.alert} autoHideDuration={6000} onClose={this.closeAlert}>
                    <Alert onClose={this.closeAlert} severity="error">
                        { this.state.alertMessage }
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(AddAreaStepper));
