import React, { Component } from 'react';

import { connect } from 'react-redux';
import NavigationBar from "../components/NavigationBar";
import Typography from "@material-ui/core/Typography";

interface Props {
    token: string,
    history: {
        push: any
    },
}

interface State {}

const mapStateToProps = (state: any) => {
    return { token: state.token };
};

class Services extends Component<Props, State> {
    componentDidMount(): void {
        const { token } = this.props;

        if (!token)
            this.props.history.push('/');
    }

    render() {
        const { token } = this.props;

        return (
            <div>
                <NavigationBar />
                <Typography variant="h4" gutterBottom>
                    { token }
                </Typography>
            </div>
        );
    }
}

export default connect(mapStateToProps)(Services);
