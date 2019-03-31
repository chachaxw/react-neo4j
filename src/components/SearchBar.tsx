import React, { Component } from 'react';

export default class SearchBar extends Component {
  private trigger: boolean = true;



  render() {
    return (
      <div className="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="32">
          <path className="right" fill="none" stroke="#438EF7" strokeWidth="1" strokeMiterlimit="10"
            d="M62.7678571,29.9964286 L110.446429,29.9964286 C118.78,29.9964286 125.535714,23.2407143 125.535714,14.9071429 C125.337143,6.61714286 118.559643,0 110.267143,0 L62.7678571,0"/>
          <path className="left" fill="none" stroke="#438EF7" strokeWidth="1" strokeMiterlimit="10"
            d="M62.7678571,29.9964286 L15.0892857,29.9964286 C6.75571429,29.9964286 0,23.2407143 0,14.9071429 C0.198571429,6.61714286 6.97607143,0 15.2685714,0 L62.7678571,0"/>
        </svg>

        <p></p>
        <input type="text" />

        <span>Search</span>
      </div>
    );
  }
}
