import React, { Component } from 'react';

import { connect } from 'react-redux';

import NavigationBar from '../components/NavigationBar';

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

import Utilities from "../utils/Utilities";

interface Props {
    api_url: string,
    token: string,
    history: {
        push: any
    }
}

interface State {
    displayedMessage: string
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

class CodeValidation extends Component<Props, State> {
    state: State = {
        displayedMessage: ''
    };

    componentDidMount() {
        const { api_url, token } = this.props;
        const codeToSend: string | null = Utilities.getQueryParameter(window.location.href, 'code');

        fetch(`${api_url}/data-code/${codeToSend}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then((data) => {
            const { error } = data;

            if (error) {
                this.setState({ displayedMessage: `${error.name}: ${error.message}` });
            } else {
                this.setState({ displayedMessage: data["status"] });
                window.location.href = `${window.location.origin}/services`;
            }
        });
    };

    render() {
        const { displayedMessage } = this.state;

        return (
            <div>
                <NavigationBar history={this.props.history} />
                <Grid
                    container
                    spacing={0}
                    direction='column'
                    alignItems='center'
                    justify='center'
                    style={{ marginTop: '-50px', minHeight: '100vh', textAlign: 'center' }}
                >
                    <Grid item xs={6}>
                        <Typography variant="h4" gutterBottom>
                            { displayedMessage }
                        </Typography>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default connect(mapStateToProps)(CodeValidation);
