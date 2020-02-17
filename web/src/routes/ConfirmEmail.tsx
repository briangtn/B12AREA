import React, { Component } from 'react';
import NavigationBar from "../components/NavigationBar";
import Grid from "@material-ui/core/Grid";
import Translator from "../components/Translator";
import Typography from "@material-ui/core/Typography";

interface Props {
    history: {
        push: any
    },
}

interface State {}

class ConfirmEmail extends Component<Props, State> {
    render() {
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
                            <Translator sentence="confirmEmail" />
                        </Typography>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default ConfirmEmail;
