import classNames from 'classnames';
import React, { Component, FormEvent } from 'react';

interface InternalState {
  trigger: boolean | null;
  value: string;
}

export default class SearchBar extends Component<any, InternalState> {
  public readonly state = {
    trigger: null,
    value: '',
  };

  public handleClick() {
    if (!this.state.trigger) {
      this.setState({ trigger: true });
    }
  }

  public handleBlur() {
    const search = document.querySelector('.search-bar');
    this.setState({ trigger: false, value: '' });

    if (!search) {
      return;
    }

    setTimeout(() => {
      search.classList.add('done');

      setTimeout(() => {
        setTimeout(() => {
          search.classList.remove('done');
          this.setState({ trigger: null });
          search.classList.remove('remove');
        }, 100);
      }, 100);
    }, 800);
  }

  public render() {
    const { trigger, value } = this.state;
    const cls = classNames('search-bar', { active: trigger, remove: trigger === false });

    return (
      <div className={cls} onClick={() => this.handleClick()}>
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="32">
          <path
            className="right"
            fill="none"
            stroke="#065dab"
            strokeWidth="4"
            strokeMiterlimit="10"
            style={{ transform: 'scale(0.36)' }}
            d="M177.75 85.99h133.5c23.334 0 42.25-18.916 42.25-42.25C352.944 20.528 333.967 2 310.748 2H177.75"
          />
          <path
            className="left"
            fill="none"
            stroke="#065dab"
            strokeWidth="4"
            strokeMiterlimit="10"
            style={{ transform: 'scale(0.36)' }}
            d="M177.75 85.99H44.25C20.916 85.99 2 67.074 2 43.74 2.556 20.528 21.533 2 44.752 2H177.75"
          />
        </svg>

        <p>{value}</p>
        <input
          type="text"
          value={value}
          onBlur={() => this.handleBlur()}
          onChange={(e: FormEvent<HTMLInputElement>) => this.setState({ value: e.currentTarget.value })}
        />

        <span>Search</span>
      </div>
    );
  }
}
