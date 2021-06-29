import React from "react";
import Button from '@material-ui/core/Button';
import {Link} from "react-router-dom";
import "./Button.css";

export default function Buttons(props) {

    let data = props.data;
    let route = "./" + data.route;

    return (
        <div>
            <Button className="CustomButton" component={Link}
                to={route} variant="contained" color="primary" href="#outlined-buttons"
            >
                    {data.name}
            </Button>
        </div>
    );
}
