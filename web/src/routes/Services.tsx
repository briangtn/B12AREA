import React, { Component } from 'react';

import { connect } from 'react-redux';
import { withStyles, createStyles, Theme } from "@material-ui/core";

import Typography from "@material-ui/core/Typography";

// Components

import NavigationBar from "../components/NavigationBar";
import AddServices from "../components/services/AddServices";
import Translator from "../components/Translator";

interface Props {
    token: string,
    history: {
        push: any
    },
    classes: {
        section: string
    }
}

interface State {}

const mapStateToProps = (state: any) => {
    return { token: state.token };
};

const styles = (theme: Theme) => createStyles({
    section: {
        padding: '20px',
        borderBottom: '3px solid #f5f5f5',
    },
});

class Services extends Component<Props, State> {
    componentDidMount(): void {
        const { token } = this.props;

        if (!token)
            this.props.history.push('/');
    }

    render() {
        const { classes } = this.props;

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
                    <Typography variant="h3" className={classes.section} gutterBottom><b><Translator sentence="myServices" /></b></Typography>
                </div>
                <AddServices />
            </div>
        );
    }
}

export default connect(mapStateToProps)(withStyles(styles)(Services));
