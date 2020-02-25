import React, { Component } from 'react';

import { connect } from 'react-redux';

import NavigationBar from "../NavigationBar";

interface Props {
    token: string,
    api_url: string,
    history: {
        push: any
    }
}

interface State {
    areas: Area[],
}

interface Area {
    data: any;
    enabled: boolean;
    id: string;
    name: string;
    ownerId: string;
}

const mapStateToProps = (state: any) => {
    return { api_url: state.api_url, token: state.token };
};

class ServiceDetails extends Component<Props, State> {
    componentDidMount() {
        const { token, api_url } = this.props;

        fetch(`${api_url}/areas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({ areas: data });
        });
    }

    render() {
        return (
            <div>
                <NavigationBar history={this.props.history} />
            </div>
        );
    }
}

export default connect(mapStateToProps)(ServiceDetails);