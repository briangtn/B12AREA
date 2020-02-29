import React, { Component } from 'react';

import { connect } from 'react-redux';

import { withStyles, createStyles, Theme, Snackbar } from "@material-ui/core";

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';

import Typography from '@material-ui/core/Typography';

import Button from '@material-ui/core/Button';

import ChipRole from '../ChipRole';

import DetailsIcon from '@material-ui/icons/Details';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import AdbIcon from '@material-ui/icons/Adb';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import FilterListIcon from '@material-ui/icons/FilterList';

import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import Grid from '@material-ui/core/Grid';

import Alert from '../Alert';
import {setAdminToken, setToken} from "../../actions/api.action";
import Cookies from "universal-cookie";
import TextField from "@material-ui/core/TextField";
import Menu from "@material-ui/core/Menu";

const cookies = new Cookies();

interface Props {
    apiUrl: string,
    token: string,
    classes: {
        table: string
    },
    adminToken: string,
    setToken: any,
    setAdminToken:any,
    history: {
        push: any
    }
}

interface State {
    users: User[],
    unfilteredUsers: User[],
    rowsPerPage: number,
    page: number,
    userDetail: boolean,
    userDetailIndex: number,
    validationOpen: boolean,
    alertList: boolean,
    alertListMessage: string,
    alertDetail: boolean,
    alertDetailMessage: string,
    availableRoles: string[],
    filterEnabled: { name: string, component: any }[],
    filterMenuAnchor: any,
    filterParameters: any
}

interface AuthService {
    name: string,
    accountID: string
}

interface User {
    id: string,
    email: string,
    role: string[],
    services: any,
    twoFactorAuthenticationEnabled: boolean,
    authServices: AuthService[],
}

function mapDispatchToProps(dispatch: any) {
    return { setToken: (token: object) => dispatch(setToken(token)), setAdminToken: (adminToken: object) => dispatch(setAdminToken(adminToken)) };
}

const mapStateToProps = (state: any) => {
    return { normalToken: state.token, adminToken: state.adminToken };
};


const styles = (theme: Theme) => createStyles({
    table: {
        minWidth: 650,
    }
});

class Users extends Component<Props, State> {
    state: State = {
        users: [],
        unfilteredUsers: [],
        rowsPerPage: 10,
        page: 0,
        userDetail: false,
        userDetailIndex: 0,
        validationOpen: false,
        alertList: false,
        alertListMessage: '',
        alertDetail: false,
        alertDetailMessage: '',
        availableRoles: [],
        filterEnabled: [],
        filterMenuAnchor: null,
        filterParameters: {}
    };

    /**
     * Fetch all users registered on the API
     * then put them in an array
     *
     * Fetch also the available roles to permits
     * admin to add or delete roles to user
     */
    componentDidMount() {
        const { apiUrl, token } = this.props;

        fetch(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({ users: data, unfilteredUsers: data });
        });

        fetch(`${apiUrl}/users/availableRoles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({ availableRoles: data });
        });
    }

    filterOnChange = (e: any) => {
        const { filterParameters, unfilteredUsers } = this.state;

        filterParameters[e.currentTarget.id] = e.currentTarget.value;
        const filteredUsers: User[] = unfilteredUsers.filter((user: User) => {
            return (user[e.currentTarget.id as keyof User] as string).indexOf(filterParameters[e.currentTarget.id]) !== -1
        });
        this.setState({ filterParameters: filterParameters, users: filteredUsers });
    };

    /**
     * Component to filter the email address
     */
    filterComponent = () => {
        const { filterEnabled, filterMenuAnchor, filterParameters } = this.state;
        const filterAvailable: { name: string, component: any }[] = [
            { name: 'Email', component: <TextField id="email" label="Email" onChange={this.filterOnChange} value={filterParameters['email']} /> }
        ];

        const filterToDisplay = [];

        for (let filter of filterAvailable) {
            let exist = false;
            for (let filterEnable of filterEnabled) {
                if (filter.name === filterEnable.name)
                    exist = true;
            }
            if (!exist)
                filterToDisplay.push(filter);
        }

        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs="auto">
                      <IconButton onClick={(e: any) => { this.setState({ filterMenuAnchor: e.currentTarget })} }>
                        <FilterListIcon />
                      </IconButton>
                    </Grid>
                    { filterEnabled.map((curFilter, index) => (
                        <Grid item xs="auto" key={index}>
                            {curFilter.component}
                        </Grid>
                    ))}
                </Grid>
                <Menu
                    id="simple-menu"
                    anchorEl={filterMenuAnchor as any}
                    keepMounted
                    open={Boolean(filterMenuAnchor)}
                    onClose={(e: any) => this.setState({ filterMenuAnchor: null })}
                >
                    { filterToDisplay.map((filter, index) => (
                        <MenuItem
                            key={index}
                            onClick={(e) => { this.setState(prevState => ({ filterEnabled: [...prevState.filterEnabled, filter], filterMenuAnchor: null })) }}>
                            { filter.name }
                        </MenuItem>
                    )) }
                </Menu>
            </div>
        );
    };
    /**
     * Function called when the admin press the unpersonate button
     *
     * @param e event triggered
     */
    impersonateClicked = (e: any) => {
        const { apiUrl, token } = this.props;
        const { users, userDetailIndex } = this.state;
        const { id } = users[userDetailIndex];

        fetch(`${apiUrl}/users/impersonate/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then((data) => {
                const { setToken, setAdminToken } = this.props;

                cookies.set('admin_token', token);
                cookies.set('token', data.token);
                setToken(data.token);
                setAdminToken(token);

                this.props.history.push('/');

                window.location.reload();
            });
    };

    /**
     * Change page event, triggered when the admin wants to change page
     * in the table
     * @param e event triggered
     * @param newPage page to go
     */
    onChangePage = (e: any, newPage: any) => {
        this.setState({ page: newPage });
    };

    /**
     * Event triggered when a user wants to change the number
     * of row per pages
     * @param e event triggered
     */
    onRowPerPageChange = (e: any) => {
        this.setState({ rowsPerPage: e.target.value });
    };

    /**
     * Event triggered when the user press the details button
     *
     * @param index index of the user
     * @param event event triggered
     */
    onClickDetail(index: any, event: any) {
        this.setState({ userDetail: true, userDetailIndex: index + (this.state.page * this.state.rowsPerPage) });
    };

    /**
     * Event triggered when the user press the back button
     * inside user details
     *
     * @param e event triggered
     */
    onClickBackDetail = (e: any) => {
        this.setState({ userDetail: false, userDetailIndex: 0 });
    };

    /**
     * Event triggered when the user wants to delete a user, it opens
     * the validation of the delete
     *
     * @param e event triggered
     */
    toggleValidationDelete = (e: any) => {
        this.setState({ validationOpen: true });
    };

    /**
     * Event triggered when the user closed the deletion confirmation on back button
     * or on confirm
     *
     * @param e event triggered
     */
    closeValidationDelete = (e: any) => {
        this.setState({ validationOpen: false });
    };

    /**
     * Delete a user from the API
     *
     * @param e event triggered
     */
    deleteUser = (e: any) => {
        const { apiUrl, token } = this.props;
        const currentUser = this.state.users[this.state.userDetailIndex];
        const idToDelete = currentUser.id;

        fetch(`${apiUrl}/users/${idToDelete}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        })
        .then((data) => {
            let userArray = this.state.users;

            delete userArray[this.state.userDetailIndex];
            this.setState({ validationOpen: false, users: userArray, userDetailIndex: 0, userDetail: false, alertList: true, alertListMessage: 'User deleted' });
        })
    };

    /**
     * Patch a user on the server, to add or delete roles on it
     *
     * @param e event triggered
     */
    patchUser = (e: any) => {
        const { apiUrl, token } = this.props;
        const currentUser = this.state.users[this.state.userDetailIndex];
        const idToDelete = currentUser.id;

        fetch(`${apiUrl}/users/${idToDelete}`, {
            method: 'PATCH',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: currentUser.role })
        })
        .then((data) => {
            this.setState({ alertDetail: true, alertDetailMessage: 'User updated' });
        })
    };

    /**
     * Function triggered on role changing
     *
     * @param e event triggered
     */
    selectChange = (e: any) => {
        let users: User[] = this.state.users;
        users[this.state.userDetailIndex].role = e.target.value;

        this.setState({ users: users });
    };

    /**
     * Function to close the alert in the list
     *
     * @param e event triggered
     */
    alertListClose = (e: any) => {
        this.setState({ alertList: false });
    };

    /**
     * Function to close the alert in the detail component
     *
     * @param e event triggered
     */
    alertDetailClose = (e: any) => {
        this.setState({ alertDetail: false });
    };

    render() {
        const { classes } = this.props;
        const currentUser: User = this.state.users[this.state.userDetailIndex];

        if (!this.state.userDetail) {
            return (
                <div>
                    { this.filterComponent() }
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="left">Id</TableCell>
                                <TableCell align="left">Email</TableCell>
                                <TableCell align="left">Roles</TableCell>
                                <TableCell align="left">Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {this.state.users
                        .slice(this.state.page * this.state.rowsPerPage, this.state.page * this.state.rowsPerPage + this.state.rowsPerPage)
                        .map((row: any, index: number) => (
                            (row.role !== undefined)
                            ?
                                <TableRow hover key={index} onClick={this.onClickDetail.bind(this, index)}>
                                    <TableCell align="left">{row.id}</TableCell>
                                    <TableCell align="left">{row.email}</TableCell>
                                    <TableCell align="left">
                                        {row.role.map((elem: string) => (
                                            <ChipRole key={row.role.indexOf(elem)} role={elem} size="small" />
                                        ))}
                                    </TableCell>
                                    <TableCell align="left">
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<DetailsIcon />}
                                            onClick={this.onClickDetail.bind(this, index)}
                                        >
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            : ''
                        ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={this.state.users.length}
                        rowsPerPage={this.state.rowsPerPage}
                        page={this.state.page}
                        onChangePage={this.onChangePage}
                        onChangeRowsPerPage={this.onRowPerPageChange}
                    />
                    <Snackbar open={this.state.alertList} autoHideDuration={6000} onClose={this.alertListClose}>
                        <Alert onClose={this.alertListClose} severity="success">
                            { this.state.alertListMessage }
                        </Alert>
                    </Snackbar>
                </div>
            );
        } else {
            return (
                <div>
                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<ArrowBackIosIcon />}
                                onClick={this.onClickBackDetail}
                            >
                                Back
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AdbIcon />}
                                onClick={this.impersonateClicked}
                                style={{float: 'right'}}
                                disabled={this.props.adminToken !== ''}
                            >
                                Impersonate
                            </Button>
                        </Grid>
                    </Grid>

                    <br />
                    <Grid
                        container
                        spacing={0}
                        direction='column'
                        alignItems='center'
                        justify='center'
                        style={{ marginTop: '-100px', minHeight: '100vh', textAlign: 'center' }}
                    >
                        <Grid item xs={3}>
                            <Typography variant="h6" gutterBottom>
                                ID
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {currentUser.id}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Email Address
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                {currentUser.email}
                            </Typography>
                            <Typography variant="h6" gutterBottom>
                                Roles
                            </Typography>
                            <Select
                                id="chip-role-select"
                                multiple
                                value={currentUser.role}
                                renderValue={selected => (
                                    <div>
                                        {(selected as string[]).map(elem => (
                                            <ChipRole key={currentUser.role.indexOf(elem as any)} role={elem as any} size="medium" />
                                        ))}
                                    </div>
                                )}
                                onChange={this.selectChange}
                            >
                                {this.state.availableRoles.map(name => (
                                    <MenuItem key={name} value={name}>
                                        { name }
                                    </MenuItem>
                                ))}
                            </Select>
                            <br />
                            <br />
                            <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={this.patchUser}
                            >
                                Save
                            </Button>
                            &nbsp;
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={this.toggleValidationDelete}
                            >
                                Delete
                            </Button>
                        </Grid>
                    </Grid>
                    <Snackbar open={this.state.alertDetail} autoHideDuration={6000} onClose={this.alertDetailClose}>
                        <Alert onClose={this.alertDetailClose} severity="success">
                            { this.state.alertDetailMessage }
                        </Alert>
                    </Snackbar>
                    <Dialog
                        open={this.state.validationOpen}
                        onClose={this.closeValidationDelete}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">Delete {currentUser.email}</DialogTitle>
                        <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Are you sure  you wish to remove this user ? This action is irreversible.
                        </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                        <Button onClick={this.closeValidationDelete} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={this.deleteUser} color="primary" autoFocus>
                            Delete
                        </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            )
        }
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Users));
