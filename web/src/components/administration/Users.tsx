import React, { Component } from 'react';

import { withStyles, createStyles, Theme } from "@material-ui/core";

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';

interface Props {
    apiUrl: string,
    token: string,
    classes: {
        table: string
    }
}

interface State {
    users: any,
    rowsPerPage: number,
    page: number
}

const styles = (theme: Theme) => createStyles({
    table: {
        minWidth: 650,
    }
});

class Users extends Component<Props, State> {
    state: State = {
        users: [],
        rowsPerPage: 5,
        page: 0
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

    render() {
        const { classes } = this.props;

        return (
            <div>
                <Table className={classes.table} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">Id</TableCell>
                            <TableCell align="left">Email</TableCell>
                            <TableCell align="left">Roles</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {this.state.users
                    .slice(this.state.page * this.state.rowsPerPage, this.state.page * this.state.rowsPerPage + this.state.rowsPerPage)
                    .map((row: any, index: number) => (
                        <TableRow hover key={index}>
                        <TableCell align="left">{row.id}</TableCell>
                        <TableCell align="left">{row.email}</TableCell>
                        <TableCell align="left">{row.role.join(', ')}</TableCell>
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
            </div>
        );
    }
};

export default withStyles(styles)(Users);