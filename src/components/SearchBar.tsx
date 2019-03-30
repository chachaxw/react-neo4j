import React, { Component } from 'react';

export default class SearchBar extends Component {
  private trigger: boolean = true;



  render() {
    return (
      <div className="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="136" height="32">
          <path className="right" fill="none" stroke="#438EF7" strokeWidth="2" strokeMiterlimit="10"
            d="M67,30 L118,30 C127,30 132,25 133,16 C133,7 127,1 117,1 L67,1"/>
          <path className="left" fill="none" stroke="#438EF7" strokeWidth="2" strokeMiterlimit="10"
            d="M67,30 L16,30 C7,30 2,25 1,16 C1,7 7,1 16,1 L67,1"/>
        </svg>

        <p></p>
        <input type="text" />

        <span>Search</span>
      </div>
    );
  }
}
