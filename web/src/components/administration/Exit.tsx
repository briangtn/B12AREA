import React, { Component } from 'react';

interface Props {
    history: {
        push: any
    }
}

interface State {}

class Exit extends Component<Props, State> {
    componentDidMount() {
        this.props.history.push('/');
    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default Exit;