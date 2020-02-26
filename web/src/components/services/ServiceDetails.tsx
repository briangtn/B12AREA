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
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';

import Divider from '@material-ui/core/Divider';

interface Props {
    token: string,
    api_url: string,
    history: {
        push: any
    },
    classes: {
        section: string,
        heading: string,
        button: string,
        details: string
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
    action: any;
    reactions: any[];
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
    button: {
        margin: theme.spacing(1),
    },
    details: {
        flexDirection: "column"
    }
});

class ServiceDetails extends Component<Props, State> {
    state: State = {
        areas: [],
        info: (this.props.location.state.info) ? this.props.location.state.info : {}
    };

    deleteAREA = (e: any) => {
        const { api_url, token } = this.props;
        const { areas } = this.state;
        const { id } = areas[e.currentTarget.value];
        const index  = e.currentTarget.value;

        fetch(`${api_url}/areas/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        }).then(r => {
            if (r.ok) {
                areas.splice(index, 1);
                this.setState({ areas: areas });
            }
        });
    };

    componentDidMount() {
        const { token, api_url } = this.props;

        fetch(`${api_url}/areas?filter={"include": [{"relation":"action"},{"relation":"reactions"}]}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then((data) => {
            const { info } = this.state;

            const tmpAreaArray = data.filter((reaction: Area) => (!reaction.action || !reaction.reactions) || (reaction.action.serviceAction.split('.')[0] === info.name));
            this.setState({ areas: tmpAreaArray });
        });
    }

    render() {
        const { classes } = this.props;
        const { areas, info } = this.state;

        console.log(areas);
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
                                <Typography className={classes.heading} variant="h5">{ area.name }</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails className={classes.details}>
                                {
                                    (area.action) ?
                                        <div>
                                            <Typography variant="h5" gutterBottom>
                                                <b>Action</b> - {area.action.serviceAction.split('.')[area.action.serviceAction.split('.').length - 1]}
                                            </Typography>
                                            {Object.keys(area.action.options).map((elem: string) => (
                                                <p key={Object.keys(area.action.options).indexOf(elem)}>
                                                    <b>{elem}</b>{': ' + area.action.options[elem]}
                                                </p>
                                            ))}
                                            <Divider />
                                        </div>
                                    :
                                        ''
                                }
                            </ExpansionPanelDetails>
                            {
                                (area.reactions) ?
                                    area.reactions.map((reaction) => (
                                        <ExpansionPanelDetails key={area.reactions.indexOf(reaction)} className={classes.details}>
                                            <Typography variant="h5" gutterBottom>
                                                <b>Reaction</b> - {reaction.serviceReaction.split('.')[reaction.serviceReaction.split('.').length - 1]}
                                            </Typography>
                                            { Object.keys(reaction.options).map((elem: string) => (
                                                <p key={Object.keys(reaction.options).indexOf(elem)}>
                                                    <b>{elem}</b>{': ' + reaction.options[elem]}
                                                </p>
                                            ))}
                                        </ExpansionPanelDetails>
                                    ))
                                    :
                                    ''
                            }
                            <ExpansionPanelActions>
                                <Button
                                    value={areas.indexOf(area)}
                                    variant="contained"
                                    color="primary"
                                    className={classes.button}
                                    onClick={(e) => {e.persist();this.deleteAREA(e);}}
                                    startIcon={<DeleteIcon />}
                                >
                                    <Translator sentence="delete" />
                                </Button>
                            </ExpansionPanelActions>
                        </ExpansionPanel>
                    ))}
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(connect(mapStateToProps)(ServiceDetails));
