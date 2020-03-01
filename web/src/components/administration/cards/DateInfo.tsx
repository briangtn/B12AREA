import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

import { green } from '@material-ui/core/colors';

import Clock from "../../utils/Clock";

interface Props {
    classes: {
        avatar: string
    }
}

interface State {}

const styles = (theme: Theme) => createStyles({
    avatar: {
        backgroundColor: green[500]
    }
});

/**
 * Card who displays the current day and hour
 */
class DateInfo extends Component<Props, State> {
    render() {
        const { classes } = this.props;
        const currentDate: Date = new Date();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return (
            <Card>
                <CardHeader
                    avatar={
                        <Avatar aria-label="recipe" className={classes.avatar}>
                            <AccessTimeIcon />
                        </Avatar>
                    }
                    title={`${days[currentDate.getDay()]} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                />
                <CardContent style={{ textAlign: 'center' }}>
                    <Typography variant="h2" gutterBottom><Clock /></Typography>
                </CardContent>
            </Card>
        )
    }
}

export default withStyles(styles)(DateInfo);
