import React from 'react'
import "./Settings.css"

const Account = ({name, logo, link}) => {
    return (
        <div className="account">
            <img src={logo} alt={name + " logo"} />
            <div>{name}</div>
            <button onClick={() => {
                window.open(link, name, 'height=640,width=960,toolbar=no,menubar=no,scrollbars=no,location=no,status=no')
            }} className="connect-btn" >Connect</button>
        </div>
    )
}

export default Account;
