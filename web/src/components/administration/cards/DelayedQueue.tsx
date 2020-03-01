import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";

import { orange } from '@material-ui/core/colors';

import IJob from "../../../interfaces/IJob.interface";

import AlarmIcon from '@material-ui/icons/Alarm';

interface Props {
    info: IJob,
    classes: {
        avatar: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    avatar: {
        backgroundColor: orange[400]
    }
});

class DelayedQueue extends Component<Props, State> {
    render() {
        const { classes, info } = this.props;
        const { delayed, active, waiting, completed } = info;
        const utilRendering: { name: string, value: number }[] = [
            { name: "Delayed", value: delayed },
            { name: "Waiting", value: waiting },
            { name: "Running", value: active },
            { name: "Completed", value: completed }
        ];

        return (
            <Card>
                <CardHeader
                    avatar={
                        <Avatar aria-label="recipe" className={classes.avatar}>
                            <AlarmIcon />
                        </Avatar>
                    }
                    title={`Delayed Queue`}
                />
                <CardContent style={{ textAlign: 'center' }}>
                    {
                        utilRendering.map((toRender, index) => (
                            <Grid container spacing={6} key={index}>
                                <Grid item xs={6}>
                                    <Typography variant="h5">{ `${toRender.name}:\t` }</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="h6">{ `${toRender.value}` }</Typography>
                                </Grid>
                            </Grid>
                        ))
                    }
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(DelayedQueue);
