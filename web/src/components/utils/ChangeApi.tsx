import React, { Component } from "react";

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import { changeApiUrl } from "../../actions/api.action";

import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Translator from "./Translator";

import Cookies from "universal-cookie";

const cookies = new Cookies();

interface Props {
    classes: {
        field: string,
        changeApiButton: string
    },
    api_url: string,
    changeApiUrl: any,
    closeDialogFunction: any,
    reloadFunction: any
}

interface State {
    apiUrl: string
}

function mapDispatchToProps(dispatch: any) {
    return { changeApiUrl: (token: object) => dispatch(changeApiUrl(token)) };
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url };
};

const styles = (theme: Theme) => createStyles({
    field: {
        marginTop: '20px',
    },
    changeApiButton: {
        marginTop: '20px'
    }
})

class ChangeApi extends Component<Props, State> {
    state: State = {
        apiUrl: ''
    }

    onSubmit = () => {
        const { changeApiUrl } = this.props;
        const { apiUrl } = this.state;

        cookies.set('api_url', apiUrl);
        changeApiUrl(apiUrl);
        this.props.closeDialogFunction();
        this.props.reloadFunction(apiUrl);
    };

    onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const { id, value } = e.currentTarget;

        this.setState({[id]: value} as unknown as Pick<State, keyof State>);
    };

    keyPress = (e: any) => {
        if (e.keyCode === 13) {
            const toClick: HTMLElement | null = document.getElementById('changeApi')

            if (toClick)
                toClick.click();
        }
    };

    componentDidMount() {
        const { api_url } = this.props;

        this.setState({ apiUrl: api_url });
    }

    render() {
        const { classes } = this.props;
        const { apiUrl } = this.state;

        return (
            <div>
                <TextField
                    id="apiUrl"
                    label="API URL"
                    variant="outlined"
                    onKeyDown={this.keyPress}
                    className={classes.field}
                    value={apiUrl}
                    onChange={this.onChange}
                    fullWidth
                />
                <Button
                    id="changeApi"
                    variant="contained"
                    color="secondary"
                    className={classes.changeApiButton}
                    onClick={this.onSubmit}
                >
                    <Translator sentence="settingsChangeApi" />
                </Button>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ChangeApi));
