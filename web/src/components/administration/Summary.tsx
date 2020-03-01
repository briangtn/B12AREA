import React, { Component } from 'react';

import Grid from "@material-ui/core/Grid";

import DateInfo from "./cards/DateInfo";
import IJob from "../../interfaces/IJob.interface";
import ReactionQueue from "./cards/ReactionQueue";
import PullingQueue from "./cards/PullingQueue";
import DelayedQueue from "./cards/DelayedQueue";

interface Props {
    apiUrl: string,
    token: string,
}

interface State {
    jobs: { reactionQueue: IJob, pullingQueue: IJob, delayedQueue: IJob }
}

class Summary extends Component<Props, State> {
    private timerId: any = null;

    state: State = {
        jobs: {
            reactionQueue: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
            pullingQueue: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
            delayedQueue: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
        }
    };

    fetchJobStatus = () => {
        const { apiUrl, token } = this.props;

        fetch(`${apiUrl}/admin/workers/jobs/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then((data) => {
                this.setState({ jobs: data });
            })
    };

    componentDidMount(): void {
        this.fetchJobStatus();
        this.timerId = setInterval(() => {
            this.fetchJobStatus();
        },  5000);
    }

    componentWillUnmount(): void {
        clearInterval(this.timerId);
    }

    render() {
        const { jobs } = this.state;

        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs="auto">
                        <DateInfo />
                    </Grid>
                    <Grid item xs="auto">
                        <ReactionQueue info={jobs.reactionQueue} />
                    </Grid>
                    <Grid item xs="auto">
                        <PullingQueue info={jobs.pullingQueue} />
                    </Grid>
                    <Grid item xs="auto">
                        <DelayedQueue info={jobs.delayedQueue} />
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default Summary;
