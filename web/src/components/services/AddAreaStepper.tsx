import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

import Typography from "@material-ui/core/Typography";
import Button from '@material-ui/core/Button';

import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from "@material-ui/core/TextField";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

interface Props {
    classes: {
        instructions: string,
        formControl: string
    },
    actions: any,
    reactions: any
}

interface SchemaAction {
    schemaActionName: string,
    schemaActionValue: string | boolean | number
}

interface State {
    activeStep: number;
    steps: string[],
    configSchemaActions: any,
    selectedAction: any
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
    }
});

class AddAreaStepper extends Component<Props, State> {
    state: State = {
        activeStep: 0,
        steps: ['Choose your action', 'Select your reactions', 'Summary'],
        configSchemaActions: {},
        selectedAction: 0
    };

    handleNextStep = (e: any) => {
        const { activeStep } = this.state;

        this.setState({ activeStep: activeStep + 1 });
    }

    handleBackStep = (e: any) => {
        const { activeStep } = this.state;

        if (activeStep === 0)
            return;
        this.setState({ activeStep: activeStep - 1 });
    }

    // Steps

    selectActionChange = (e: any) => {
        this.setState({ selectedAction: e.target.value });
    };

    configSchemaChange = (e: any) => {
        const { configSchemaActions } = this.state;

        configSchemaActions[e.target.id] = e.target.value;
        this.setState({configSchemaActions: configSchemaActions});
    };

    displayConfigSchema = (configSchema: any) => {
        const { configSchemaActions } = this.state;
        const { name, description, type, required } = configSchema;

        if (type === "string") {
            return (
                <TextField
                    label={name}
                    required={required}
                    id={name}
                    type={type}
                    value={configSchemaActions[name]}
                    onChange={this.configSchemaChange}
                    fullWidth
                />
            )
        } else if (type === "number") {
            return (
                <TextField
                    label={name}
                    required={required}
                    id={name}
                    type={type}
                    value={configSchemaActions[name]}
                    onChange={this.configSchemaChange}
                    fullWidth
                />
            )
        } else if (type === "boolean") {
            return (
                <FormControlLabel
                    control={
                        <Switch
                            id={name}
                            required={required}
                            checked={configSchemaActions[name]}
                            onChange={this.configSchemaChange}
                            value="checkedA"
                        />
                    }
                    label={name}
                />
            )
        }
    }

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
                        <div key={selectedAction.configSchema.indexOf(elem)}>{this.displayConfigSchema(elem)}</div>
                    ))}</div>)
                    : ''
                }
                <br />
            </div>
        );
    }

    reactionStep = () => {
        const { reactions } = this.props;

        console.log(reactions);
    }

    contentStep = (activeStep: number) => {
        if (activeStep === 0) {
            return this.actionStep();
        } else if (activeStep === 1) {
            return this.reactionStep();
        }
    }

    render() {
        const { classes } = this.props;
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
                    {activeStep === steps.length ? (
                    <div>
                        <Typography className={classes.instructions}>All steps completed</Typography>
                    </div>
                    ) : (
                    <div>
                        {this.contentStep(activeStep)}
                        <div>
                        <Button
                            disabled={activeStep === 0}
                            onClick={this.handleBackStep}
                        >
                            Back
                        </Button>
                        <Button variant="contained" color="primary" onClick={this.handleNextStep}>
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(AddAreaStepper);