import React from 'react'
import "./Settings.css"

function Account(props) {
    return (
        <div className="account">
            <img src={props.logo} alt={props.name + " logo"} />
            <div>{props.name}</div>
            <button onClick={() => {
                window.open(props.link, props.name, 'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no')
            }} className="connect-btn" >Connect</button>
        </div>
    )
}

export default Account;
