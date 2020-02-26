import React, { Component } from 'react';

import {createStyles, Theme, withStyles} from "@material-ui/core";

import { connect } from 'react-redux';

import NavigationBar from "../NavigationBar";
import Translator from "../Translator";

// Expansion Panel Utils

import Typography from "@material-ui/core/Typography";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface Props {
    token: string,
    api_url: string,
    history: {
        push: any
    },
    classes: {
        section: string,
        heading: string
    },
    location: {
        state: {
            info: any
        }
    }
}

interface State {
    areas: Area[],
    info: any
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

const styles = (theme: Theme) => createStyles({
    section: {
        padding: '20px',
        borderBottom: '3px solid #f5f5f5',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
});

class ServiceDetails extends Component<Props, State> {
    state: State = {
        areas: [],
        info: (this.props.location.state.info) ? this.props.location.state.info : {}
    };

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
        const { classes } = this.props;
        const { areas, info } = this.state;

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
                    <Typography variant="h3" className={classes.section} gutterBottom><b><Translator sentence="myActions" /> - { info.displayName }</b></Typography>
                    {areas.map((area: Area) => (
                        <ExpansionPanel key={areas.indexOf(area)}>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography className={classes.heading}>{ area.name }</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <Typography>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex,
                                    sit amet blandit leo lobortis eget.
                                </Typography>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    ))}
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapStateToProps)(ServiceDetails));
