import {registerAWS, listBuckets, listObjects, getObject, addAWSCred, getAWSCred} from "../../common/Managers/EndpointManager";
import React, {useContext, useState} from "react";
import {DataGrid} from "@material-ui/data-grid";
import "./AWSImport.css";
import AWSImportForm from "./Form";
import {DialogContent, TextField, Typography} from "@material-ui/core";
import {CloseModalContext} from "../JobForms/Components/FileUploadComponent";
import {getAuthCookie} from "../../common/Managers/CookieManager";

const objectTableFields = [
  {field: 'Key', headerName: 'Key', flex: 1},
  {field: 'Owner', headerName: 'Owner', flex: 1},
  {field: 'LastModified', headerName: 'Last Modified', flex: 1},
  {field: 'Size', headerName: 'Size (in MiB)', flex: 1}
];

const bucketsTableFields = [
  {field: 'Name', headerName: 'Name', flex: 1},
  {field: "Owner", headerName: "Owner", flex: 1},
  {field: "CreationDate", headerName: "Creation Date", flex: 1}
];

export default function AWSImportView(props) {
  const [rows, setRows] = useState([]);
  const [rowsToShow, setRowsToShow] = useState([]); // rowsToShow and rows can be different based on search params
  const [currBucket, setCurrBucket] = useState("");
  const [tableFields, setTableFields] = useState([]);
  const [showBucketsTable, setShowBucketsTable] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const closeModal = useContext(CloseModalContext);

  const tableTitle = (showBucketsTable) ? "Buckets" : currBucket;



  function onSearchChange(event) {
    const newSearch = event.target.value;
    if (newSearch === "") setRowsToShow(rows);
    else if (showBucketsTable) setRowsToShow(rows.filter(row => row.Name.toLowerCase().includes(newSearch.toLowerCase())));
    else setRowsToShow(rows.filter(row => row.Key.toLowerCase().includes(newSearch.toLowerCase())));
  }

  function getBucketRows(buckets, owner) {
    return buckets.map((bucket, ind) => {
      return {id: ind, Name: bucket.Name, Owner: owner, CreationDate: bucket.CreationDate};
    });
  }

  function updateRows(newRows) {
    setRows(newRows);
    setRowsToShow(newRows);
  }

  function getObjectRows(arr) {
    return arr.map((obj, ind) => {
      const size = parseFloat(obj.Size);
      const sizeInMiB = (size / 1048576.).toPrecision(3);
      return {id: ind, Key: obj.Key, Owner: obj.Owner.DisplayName, LastModified: obj.LastModified, Size: sizeInMiB};
    });
  }

  function registerAndListBuckets(region, accessKey, secretKey) {
    const cookie = getAuthCookie();
    return getAWSCred(cookie.email)
      .then((res) => {
        if (res === null) {
          // change for the frontend to send an alert or open up add cred options
          console.log("aws creds do not exist");
          return "error";
        } else {
          return getAWSCred(cookie.email);
        }
      })
      .then((res) => {
    return registerAWS(region, accessKey, secretKey);
      // .then( () => {
      //   return addAWSCred(cookie.email, accessKey, secretKey);
      // })
      // .then( () => {
      //   return getAWSCred(cookie.email);
      // })
      })
      .then( (res) => {
        console.log(res);
      })
      .then(() => {
        updateRows([]);
        setIsLoadingList(true);
        return listBuckets();
      })
      .then(res => {
        const buckets = (res.Buckets !== undefined) ? res.Buckets : [];
        const owner = res.Owner.DisplayName;
        const rows = getBucketRows(buckets, owner);
        setTableFields(bucketsTableFields);
        setShowBucketsTable(true);
        updateRows(rows);
      })
      .catch(err => {
        alert("Unable to get buckets. Check that the provided keys are correct, and that the associated user has S3 Read privileges");
        console.log(err);
      })
      .finally(() => setIsLoadingList(false));
  }

  function listObjectsOnClick(params, event) {
    const bucketName = params.row.Name;
    updateRows([]);
    setCurrBucket(bucketName);
    setIsLoadingList(true);
    listObjects(bucketName)
      .then(res => {
        const objects = (res !== "") ? res : []; // avoids errors when there are no objects in bucket
        const rows = getObjectRows(objects);
        setTableFields(objectTableFields);
        updateRows(rows);
      })
      .catch(err => {
        console.log(err);
        alert("Failed to retrieve data from objects. Check that the region selected matches the bucket region");
      })
      .finally(() => {
        setIsLoadingList(false);
        setShowBucketsTable(false);
      });
  }

  function getObjectOnClick(params, event) {
    console.log(props);
    const key = params.row.Key;
    if (key.slice(-4) !== ".csv") {
      alert("File object must have a '.csv' extension");
    } else {
      props.setIsLoadingFile(true);
      props.setProgressBarType('indeterminate');
      closeModal();

      getObject(currBucket, key)
        .then(csvString => {
          props.updateCSVState(csvString);
        })
        .catch(err => {
          console.log(err);
          alert("Failed to retrieve file from S3");
          props.setDataImportSuccess(false);
        })
        .finally(() => {
          props.setIsLoadingFile(false);
          updateRows([]);
        });
    }
  }

  function onDoubleClick(params, event) {
    return (showBucketsTable) ? listObjectsOnClick(params, event) : getObjectOnClick(params, event);
  }

  return (
    <DialogContent style={{height: "100vh"}}>
      <AWSImportForm onSubmit={registerAndListBuckets}/>
      <br/><br/>
      <Typography variant="h4" style={{textAlign: "center", marginBottom: "20px"}}>{tableTitle}</Typography>
      <div style={{display: "flex", justifyContent: "end"}}>
        <TextField onChange={onSearchChange} label="Search" type="search"/>
      </div>
      <div style={{display: "flex", height: "100%"}}>
        <div style={{flexGrow: 1}}>
          <DataGrid rows={rowsToShow}
                    columns={tableFields}
                    pageSize={10}
                    onCellDoubleClick={onDoubleClick}
                    columnBuffer={2}
                    loading={isLoadingList}
          />
        </div>
      </div>
    </DialogContent>
  );
}
