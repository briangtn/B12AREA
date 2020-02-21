import React, { Component } from 'react';

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

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import Grid from '@material-ui/core/Grid';

import Alert from '../Alert';

interface Props {
    apiUrl: string,
    token: string,
    classes: {
        table: string
    }
}

interface State {
    users: User[],
    rowsPerPage: number,
    page: number,
    userDetail: boolean,
    userDetailIndex: number,
    validationOpen: boolean,
    error: boolean,
    errorMessage: string
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
    authServices: AuthService[]
}

const styles = (theme: Theme) => createStyles({
    table: {
        minWidth: 650,
    }
});

class Users extends Component<Props, State> {
    state: State = {
        users: [],
        rowsPerPage: 10,
        page: 0,
        userDetail: false,
        userDetailIndex: 0,
        validationOpen: false,
        error: false,
        errorMessage: ''
    };

    componentDidMount() {
        const { apiUrl, token } = this.props;

        fetch(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then((data) => {
            this.setState({ users: data });
        })
    }

    onChangePage = (e: any, newPage: any) => {
        this.setState({ page: newPage });
    }

    onRowPerPageChange = (e: any) => {
        this.setState({ rowsPerPage: e.target.value });
    }

    onClickDetail(index: any, event: any) {
        this.setState({ userDetail: true, userDetailIndex: index });
    }

    onClickBackDetail = (e: any) => {
        this.setState({ userDetail: false });
    }

    toggleValidationDelete = (e: any) => {
        this.setState({ validationOpen: true });
    }

    closeValidationDelete = (e: any) => {
        this.setState({ validationOpen: false });
    }

    deleteUser = (e: any) => {
        const { apiUrl, token } = this.props;
        const currentUser = this.state.users[this.state.userDetailIndex];
        const idToDelete = currentUser.id;

        fetch(`${apiUrl}/users/${idToDelete}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${this.props.token}`}
        })
        .then((data) => {
            let userArray = this.state.users;

            delete userArray[this.state.userDetailIndex];
            this.setState({ validationOpen: false, users: userArray, userDetailIndex: 0, userDetail: false, error: true, errorMessage: 'User deleted' });
        })
    }

    alertClose = (e: any) => {
        this.setState({ error: false });
    }

    render() {
        const { classes } = this.props;
        const currentUser: User = this.state.users[this.state.userDetailIndex];

        if (!this.state.userDetail) {
            return (
                <div>
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
                    <Snackbar open={this.state.error} autoHideDuration={6000} onClose={this.alertClose}>
                        <Alert onClose={this.alertClose} severity="success">
                            { this.state.errorMessage }
                        </Alert>
                    </Snackbar>
                </div>
            );
        } else {
            return (
                <div>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ArrowBackIosIcon />}
                        onClick={this.onClickBackDetail}
                    >
                        Back
                    </Button>
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
                            {currentUser.role.map((role) => (
                                <ChipRole key={currentUser.role.indexOf(role)} role={role} size="medium" />
                            ))}
                            <br />
                            <br />
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

export default withStyles(styles)(Users);