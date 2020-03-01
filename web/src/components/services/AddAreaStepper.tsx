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
import Alert from '../utils/Alert';
import HtmlTooltip from "./HtmlTooltip";

import {IAction, IReaction, IPlaceHolder, IService} from "../../interfaces/IService.interface";
import {setServices} from "../../actions/services.action";
import {setToken} from "../../actions/api.action";
import Cookies from "universal-cookie";

const cookies = new Cookies();

function mapDispatchToProps(dispatch: any) {
    return { setServices: (token: object) => dispatch(setServices(token)), setToken: (token: object) => dispatch(setToken(token)) };
}

const mapStateToProps = (state: any) => {
    return { language: state.language, api_url: state.api_url, token: state.token, services: state.services };
};

interface Props {
    classes: {
        instructions: string,
        formControl: string,
        noMaxWidth: string
    },
    language: string,
    actions: IAction[],
    reactions: IReaction[],
    services: any,
    closeFunction: any,
    token: string,
    api_url: string,
    serviceName: string,
    needToRefresh: boolean,
    setServices: any,
    setToken: any,
    history: {
        push: any
    },
}

interface State {
    areaName: string;
    activeStep: number;
    steps: string[],
    configSchemaActions: any,
    configSchemaReactions: any,
    chosenReactions: IReaction[],
    selectedAction: IAction | any,
    alert: boolean,
    alertMessage: string,
    alertSeverity: string
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

class AddAreaStepper extends Component<Props, State> {
    state: State = {
        areaName: '',
        activeStep: 0,
        steps: (this.props.language === 'en')
            ?
                ['Name your AREA', 'Choose your action', 'Select your reactions', 'Summary']
            :
                ['Donnez un nom à votre AREA', 'Choisissez votre action', 'Choisissez vos reactions', 'Résumé'],
        configSchemaActions: {},
        configSchemaReactions: {},
        chosenReactions: [],
        selectedAction: 0,
        alert: false,
        alertMessage: '',
        alertSeverity: 'error'
    };

    /**
     * Handle next button clicked
     *
     * @param e event triggered
     */
    handleNextStep = (e: any) => {
        const { activeStep } = this.state;

        this.setState({ activeStep: activeStep + 1 });
    };

    /**
     * Handle back button clicked
     *
     * @param e event triggered
     */
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

    /**
     * Handle the change of a config schema
     *
     * @param argGroupName config schema key
     * @param key key of  the current config schema
     * @param e event trigger
     * @param isAction boolean who checked if it's an action or a reaction
     */
    configSchemaChange = (argGroupName: string, key: any, e: any, isAction: boolean) => {
        const configSchema: any = (isAction ? this.state.configSchemaActions : this.state.configSchemaReactions);

        if (typeof configSchema[argGroupName][e.target.id] === "boolean")
            configSchema[argGroupName][e.target.id] = e.target.checked;
        else
            configSchema[argGroupName][e.target.id] = e.target.value;
        this.setState({ [key]: configSchema } as unknown as Pick<State, keyof State>);
    };

    /**
     * Display the config schema:
     * Return different input type based on the current config schema
     *
     * @param argGroupName config schema key
     * @param configSchema currrent config schema
     * @param key key of the state
     * @param isAction boolean who checked if it's an action or a reaction
     * @param placeholder placeholders of the action
     */
    displayConfigSchema = (argGroupName: string, configSchema: any, key: any, isAction: boolean, placeholder: IPlaceHolder[] | null = null) => {
        const { configSchemaActions, configSchemaReactions } = this.state;
        const { name, type, required, description } = configSchema;
        let placeHolderString: any = null;

        if (placeholder && !configSchema.ignorePlaceholders) {
            placeHolderString = (
                <React.Fragment>
                    <i><u>{`${name}:`}</u> {`${description}`}</i>
                    <p><b>Placeholders:</b></p>
                    {placeholder.map((holder: IPlaceHolder, index: number) => <p key={index}>{`{${holder.name}}: ${holder.description}`}</p>)}
                </React.Fragment>
            );
        } else if (placeholder && configSchema.ignorePlaceholders) {
            placeHolderString = (
                <React.Fragment>
                    <i><u>{`${name}:`}</u> {`${description}`}</i>
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

    /**
     * Step of the name to configure an AREA
     */
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

    /**
     * Step to configure an action
     */
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
                            <MenuItem key={actions.indexOf(elem)} value={elem}>{`${elem.displayName} - ${elem.description}`}</MenuItem>
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

    /**
     * Function who handle the selection of a reaction
     *
     * @param e
     */
    selectReaction = (e: any) => {
        const { configSchemaReactions } = this.state;

        for (let reaction of e.target.value) {
            if (!configSchemaReactions[reaction.name]) {
                configSchemaReactions[reaction.name] = {};
                configSchemaReactions[reaction.name]['serviceName'] = reaction.serviceName;
                for (let configSchema of reaction.configSchema) {
                    if (configSchema.type === "string")
                        configSchemaReactions[reaction.name][configSchema.name] = '';
                    else if (configSchema.type === "boolean")
                        configSchemaReactions[reaction.name][configSchema.name] = false;
                    else
                        configSchemaReactions[reaction.name][configSchema.name] = 0;
                }
            }
        }

        // Delete weird reactions
        const keysToDelete: string[] = [];
        for (let key of Object.keys(configSchemaReactions)) {
            let exist: boolean = false;

            for (let reaction of e.target.value) {
                if (reaction.name === key)
                    exist = true;
            }

            if (!exist)
                keysToDelete.push(key);
        }

        for (let key of keysToDelete)
            delete configSchemaReactions[key];

        this.setState({ chosenReactions: e.target.value, configSchemaReactions: configSchemaReactions });
    };

    /**
     * Reaction step in the adding of AREA
     */
    reactionStep = () => {
        const { chosenReactions } = this.state;
        const { services, classes } = this.props;
        const allRegisteredReactions: IReaction[] = [];

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
                                    (index !== (selected as any[]).length - 1) ? `${elem.displayName}, ` : `${elem.name}`
                                ))}
                            </div>
                        )}
                        onChange={this.selectReaction}
                        autoWidth
                    >
                        {allRegisteredReactions.map((reaction: IReaction) => (
                            <MenuItem key={allRegisteredReactions.indexOf(reaction)} value={reaction as any}>
                                { `${reaction.displayName} - ${reaction.description}` }
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <br />
                { chosenReactions.map((reaction: IReaction) => (
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

    /**
     * Function to format configSchema
     *
     * @param configSchema current config schema
     */
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

    /**
     * Step for the summary
     */
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
        let returnArray = [];
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
                    if (!error) {
                        this.props.closeFunction();
                        if (this.props.needToRefresh)
                            window.location.reload();
                    } else {
                        fetch(`${api_url}/areas/${id}`, {
                            method: 'DELETE',
                            headers: {'Authorization': `Bearer ${token}`}
                        }).then(r => r.json());
                    }
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

    componentDidMount(): void {
        const { token, api_url } = this.props;

        if (!token) {
            this.props.history.push('/');
            return;
        }

        fetch(`${api_url}/about.json`)
            .then(res => res.json())
            .then((dataAbout) => {
                fetch(`${api_url}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then((res) => res.json())
                    .then((data) => {
                        const { error } = data;

                        if (error) {
                            const { statusCode } = error;

                            if (statusCode === 401) {
                                cookies.set('token',  '');
                                this.props.setToken('');
                                this.props.history.push('/');
                                return;
                            }
                        } else {
                            const {servicesList} = data;
                            const aboutServices = dataAbout['server']['services'];

                            const registeredServices: IService[] = [];
                            const availableServices: IService[] = [];

                            for (let aboutService of aboutServices) {
                                if (servicesList.includes(aboutService.name))
                                    registeredServices.push(aboutService);
                                else
                                    availableServices.push(aboutService);
                            }

                            this.props.setServices(registeredServices);
                        }
                    })
            })
    }

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
                                {(this.props.language === "en") ? 'Back' : 'Retour'}
                            </Button>
                            <Button disabled={!this.state.areaName} variant="contained" color="primary" onClick={(activeStep === steps.length - 1) ? this.createAREA : this.handleNextStep}>
                                {activeStep === steps.length - 1 ? ((this.props.language === 'en') ? 'Finish' : 'Valider') : ((this.props.language === 'en') ? 'Next' : 'Suivant')}
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

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(AddAreaStepper));
