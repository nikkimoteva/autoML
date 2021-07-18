import {Button, makeStyles, Grid} from "@material-ui/core";
import {Link} from "react-router-dom";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import React, {useEffect, useState} from "react";
import {getJobs, deleteJob as deleteJobDB} from "../common/Managers/EndpointManager";
import {useAuth} from "../common/Auth";
import { DataGrid } from '@material-ui/data-grid';


const useStyles = makeStyles({
    jobButtonContainer:{
      justifyContent: 'center',
    },
    newJobButton: {
    display:"flex",
    float:"left",
    justify: "flex-end",
    margin: "10px",
    width: "15vh",

  },
  jobAttributeColumn: {
    align:"left",
  },
  jobTable:{
    height:"650px"
    // display:"block",
    // overflow:"auto"
  }
});


export default function Jobs(props) {
  const classes = useStyles();
  const [jobs, setJobs] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const auth = useAuth();

  useEffect(() => {
    getJobs(auth.user.id)
        .then(res => {
          const gottenJobs = res.data;
          setJobs(gottenJobs);

        });
  }, []);

  function deleteJob() {
    const jobId = selectionModel[0];
    console.log(jobId);
    deleteJobDB(auth.user.id, selectionModel[0])
        .then(res => {
          getJobs(auth.user.id)
          .then(res => {
            const gottenJobs = res.data;
            setJobs(gottenJobs);
          });
        })
        .catch(err => console.log(err));
  }
  const columns = [
    { field: 'name', headerName: 'Name', width: 300 },
    {
      field: 'user',
      headerName: 'User',
      width: 300,
    },
    {
      field: 'targe_column',
      headerName: 'Target Column',
      width: 300,
      editable: true,
    },
    {
      field: 'target_name',
      headerName: 'Target Name',
      width: 300,
      editable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 120,
      
    },
  ];

  const rows = jobs;
  rows.forEach( function(data) {
    data.id = data._id;
  });
  return (
    <div>
      <Grid container justify = "center">
      

      <Button variant="contained" color="secondary"
              className={classes.newJobButton} component={Link}
              to={`${props.url}/submitJob`}
      >
        New Job
      </Button>
      </Grid>
     
    <div className={classes.jobTable}>
      <Button variant="contained" color="primary" onClick={deleteJob}>
        Delete
      </Button>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        checkboxSelection
        selectionModel={selectionModel}
        onSelectionModelChange={(selection) => {
          const newSelectionModel = selection.selectionModel;

          if (newSelectionModel.length > 1) {
            const selectionSet = new Set(selectionModel);
            const result = newSelectionModel.filter(
              (s) => !selectionSet.has(s)
            );

            setSelectionModel(result);
          } else {
            setSelectionModel(newSelectionModel);
          }
        }}
      />
    </div>
    </div>
  );
}
