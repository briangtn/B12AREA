import React, { Component } from 'react';

interface Props {}

interface State {
    currentTime: Date
}

class Clock extends Component<Props, State> {
    private timerId: any = null;

    state: State = {
        currentTime: new Date()
    };

    tick = () => {
        this.setState({ currentTime: new Date() });
    };

    componentDidMount(): void {
        this.timerId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    componentWillUnmount(): void {
        clearInterval(this.timerId);
    }

    render() {
        const { currentTime } = this.state;

        return (
            <div>{ currentTime.toLocaleTimeString() }</div>
        );
    }
}

export default Clock;
