import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { EditIcon, ChevronDown, ChevronRight } from 'lucide-react';

const Row = ({ row, columns, onEdit, onDelete, nestedConfig }) => {
  const [open, setOpen] = useState(false);
  const hasNestedData = nestedConfig && row[nestedConfig.key];

  const renderNestedTable = (nestedData, nestedColumns) => (
    <Table size="small" aria-label="nested-data">
      <TableHead>
        <TableRow>
          {nestedColumns.map((column) => (
            <TableCell key={column.id}>{column.label}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {nestedData.map((item, index) => (
          <TableRow key={index}>
            {nestedColumns.map((column) => (
              <TableCell key={column.id}>
                {column.format ? column.format(item[column.id]) : item[column.id]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <TableRow hover role="checkbox" tabIndex={-1}>
        {hasNestedData && (
          <TableCell key={"food"}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <ChevronDown /> : <ChevronRight />}
            </IconButton>
          </TableCell>
        )}
        {columns.map((column) => {
          const value = row[column.id];
          return (
            <TableCell key={column.id}>
              {column.id === 'actions' ? (
                <>
                  <IconButton onClick={() => onDelete(row.id)}>
                    <DeleteIcon />
                  </IconButton>
                  <IconButton onClick={() => onEdit(row)}>
                    <EditIcon />
                  </IconButton>
                </>
              ) : column.format ? (
                column.format(value)
              ) : (
                value
              )}
            </TableCell>
          );
        })}
      </TableRow>
      {hasNestedData && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  {nestedConfig.label}
                </Typography>
                {renderNestedTable(row[nestedConfig.key], nestedConfig.columns)}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const DataTable = ({ columns, rows, onEdit, onDelete, nestedConfig }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%' }}>
      <TableContainer>
        <Table stickyHeader aria-label="collapsible table">
          <TableHead>
            <TableRow>
              {nestedConfig && <TableCell />}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <Row 
                  key={row.id} 
                  row={row} 
                  columns={columns} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  nestedConfig={nestedConfig}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;